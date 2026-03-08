require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { streamText, tool, convertToModelMessages } = require('ai');
const { z } = require('zod');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { createGroq } = require('@ai-sdk/groq');
const { createDeepSeek } = require('@ai-sdk/deepseek');
const ChatSession = require('./models/ChatSession');
const cloudinary = require('cloudinary').v2;
const Exa = require('exa-js').default;

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

const uploadRoute = require('./routes/upload');
const authRoute = require('./routes/auth');
const profileRoute = require('./routes/profile');
const youtubeRoute = require('./routes/youtube');
const studyPrepRoute = require('./routes/studyPrep');
const jobPrepRoute = require('./routes/jobPrep');
const pdfUploadRoute = require('./routes/pdfUpload');

// Initialize AI providers
const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// 3 Groq instances with separate API keys to distribute rate limits
const groqChat = createGroq({
    apiKey: process.env.GROQ_API_KEY_CHAT,
});

const groqVision = createGroq({
    apiKey: process.env.GROQ_API_KEY_VISION,
});

const groqTools = createGroq({
    apiKey: process.env.GROQ_API_KEY_TOOLS,
});

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
});

// Exa Smart Search
const exa = process.env.EXA_API_KEY ? new Exa(process.env.EXA_API_KEY) : null;

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/upload', uploadRoute);
app.use('/api/auth', authRoute);
app.use('/api/profile', profileRoute);
app.use('/api/youtube', youtubeRoute);
app.use('/api/studyPrep', studyPrepRoute);
app.use('/api/jobPrep', jobPrepRoute);
app.use('/api/upload-pdf', pdfUploadRoute);

// Detects whether the user is asking for image generation
const IMAGE_GEN_REGEX = /\b(generate|create|draw|make|paint|render|show me|give me)\b.*\b(image|picture|photo|illustration|drawing|art|artwork|portrait|landscape|scene|wallpaper|sketch|graphic)\b/i;

// POST /api/chat - Streaming AI Response
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, sessionId, userId, model, pineconeAssistantId } = req.body;
        let currentSession;

        if (!messages || !Array.isArray(messages)) {
            console.log('[Chat] Error: messages is missing or not an array');
            return res.status(400).json({ error: 'Messages are required' });
        }

        // Helper to map UI components to valid DB Strings
        const sanitizeMessageForDb = (msg) => {
            let contentStr = msg.content;
            if (Array.isArray(msg.parts)) {
                contentStr = msg.parts.map(p => p.type === 'text' ? p.text : '').join('');
            } else if (!contentStr) {
                // edge case for tool_calls missing content property entirely
                contentStr = '';
            }
            return {
                ...msg,
                content: contentStr
            };
        };

        // Ensure user is providing context
        if (!userId) {
            console.log('[Chat] Error: userId is missing');
            return res.status(401).json({ error: 'User must be authenticated to chat.' });
        }

        const isGuest = typeof userId === 'string' && userId.startsWith('guest-');
        console.log(`[Chat] Request from ${isGuest ? 'GUEST' : 'USER'}: ${userId}`);

        // Save or update session in DB if not a guest
        if (!isGuest && sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
            currentSession = await ChatSession.findById(sessionId);
            if (currentSession) {
                // Append the new user message to the session
                currentSession.messages.push(sanitizeMessageForDb(messages[messages.length - 1]));
                await currentSession.save();
            }
        }

        // Check if an image URL was processed and attach to session
        const imageMatches = messages.map(msg => {
            if (msg.role === 'user' && typeof msg.content === 'string') {
                const match = msg.content.match(/(https?:\/\/res\.cloudinary\.com[^\s]+\.(?:jpg|jpeg|png|gif|webp))/i);
                return match ? match[1] : null;
            }
            return null;
        }).filter(Boolean);

        if (!isGuest) {
            if (!currentSession) {
                // Create new session if none exists
                currentSession = new ChatSession({
                    userId,
                    title: messages[0]?.content?.substring(0, 30) || 'New Conversation',
                    messages: messages.map(sanitizeMessageForDb),
                    mediaItems: imageMatches.map(url => ({ cloudinaryUrl: url }))
                });
                await currentSession.save();
            } else if (imageMatches.length > 0) {
                // append new images to existing session
                imageMatches.forEach(url => currentSession.mediaItems.push({ cloudinaryUrl: url }));
                await currentSession.save();
            }
        }

        // Initialize Tools list
        const aiTools = {};

        // Closure variable to capture the generated image URL directly from the execute() function.
        // This is the most reliable way to ensure the URL reaches onFinish, because
        // step.toolResults in onFinish may be empty depending on AI SDK version/model behavior.
        let generatedImageUrl = null;

        // Only inject web search if we have the Tavily API key
        if (process.env.TAVILY_API_KEY) {
            aiTools.webSearch = tool({
                description: 'Search the internet for real-time information to answer questions about recent events or facts.',
                parameters: z.object({
                    query: z.string().describe('The search query to look up on the web'),
                }),
                execute: async ({ query }) => {
                    const response = await fetch('https://api.tavily.com/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            api_key: process.env.TAVILY_API_KEY,
                            query: query,
                            search_depth: 'basic'
                        })
                    });
                    const data = await response.json();
                    return data.results ? data.results.map(r => r.content).join('\n') : 'No results found.';
                },
            });
        }

        // Exa Smart Search is called PRE-LLM (before streamText) as a context injection,
        // similar to the Pinecone RAG pattern. This avoids the broken multi-step tool calling
        // in AI SDK v6's pipeUIMessageStreamToResponse which terminates after the first tool call.
        // The search results are injected directly into the system prompt.

        // NOTE: The generateImage tool is intentionally NOT defined here.
        // Image generation is handled directly on the server (see below) to avoid
        // Groq's "Failed to call a function" error which occurs when the model can't
        // produce valid tool call JSON for certain prompts.

        // Sanitize messages: strip all tool invocation parts from history.
        // Tool outputs are already embedded in the text content field, so we only
        // need text parts. This prevents "Tool result is missing" validation errors
        // from the AI SDK when tool call/result pairs are incomplete in history.
        //
        // IMPORTANT: Also strip cloudinary image URLs from historical (non-last) user messages.
        // Old image references in history cause the AI to treat new plain-text questions as
        // image analysis requests (context bleed bug).
        const lastUserIndex = (messages || []).reduce((last, m, i) => m.role === 'user' ? i : last, -1);

        const sanitizedMessages = (messages || []).map((m, idx) => {
            // Force content to be a plain string — MongoDB may store it as null, array, or object
            let textContent = ' ';
            if (typeof m.content === 'string' && m.content.trim()) {
                textContent = m.content;
            } else if (Array.isArray(m.content)) {
                textContent = m.content
                    .filter(p => p && (p.type === 'text' || typeof p === 'string'))
                    .map(p => (typeof p === 'string' ? p : p.text || ''))
                    .join(' ').trim() || ' ';
            } else if (m.content && typeof m.content === 'object' && m.content.text) {
                textContent = m.content.text;
            }

            // 2. Cleanup User Content: Completely obliterate historical image requests
            // If the user's old messages contain "create a cat image", it confuses the text-only LLMs.
            const isOldImageGen = IMAGE_GEN_REGEX.test(textContent) &&
                !(/\b(analyze|analyse|describe|explain|look at|what is|what's in|tell me about)\b/i.test(textContent));

            // To completely prevent "I can't create images" refusal loops, hide the entire image context from history.
            if (m.role === 'user' && idx < lastUserIndex && isOldImageGen) {
                textContent = "Can you help me with a task?";
            }

            // 3. Cleanup Assistant Content
            if (m.role === 'assistant' && idx < messages.length - 1) {
                // If it's a generated image marker, or an apology for not being able to generate images
                const isImageMarker = textContent.includes('[GENERATED_IMAGE') || textContent.includes('![Generated Image]');
                const isImageRefusal = /can['’]t|cannot|unable|don['’]t have the ability/i.test(textContent) &&
                    /image|create|generate/i.test(textContent);

                if (isImageMarker || isImageRefusal) {
                    textContent = "Of course! Let me know what you need help with.";
                } else {
                    textContent = textContent.trim() || ' ';
                }
            }

            return {
                role: m.role,
                content: textContent,
                id: m.id || m._id || String(Date.now()),
                parts: [{ type: 'text', text: textContent }]
            };
        });

        console.log(`[Chat] Converting ${sanitizedMessages.length} sanitized messages to ModelMessages...`);
        // console.log('[Chat] Messages Sample:', JSON.stringify(sanitizedMessages.slice(-2), null, 2));

        // Convert UI messages to Model messages for ai stream processing
        let coreMessages;
        try {
            coreMessages = await convertToModelMessages(sanitizedMessages, { tools: aiTools, ignoreIncompleteToolCalls: true });
        } catch (err) {
            console.error('[Chat] convertToModelMessages FAILED:', err);
            console.error('[Chat] Failed Messages:', JSON.stringify(sanitizedMessages, null, 2));
            throw err;
        }

        // Store coreMessages — multimodal conversion is deferred until after model selection
        // because only the vision model supports array content; non-vision models reject it.
        // Trim to last 20 messages to avoid context window overflow and tool-call failures
        let processedMessages = coreMessages.length > 20
            ? coreMessages.slice(-20)
            : coreMessages;

        // Dynamic Intent Routing Based on Prompt
        const lastUserMsg = (messages || []).filter(m => m.role === 'user').pop();
        let promptText = '';
        if (lastUserMsg) {
            if (typeof lastUserMsg.content === 'string' && lastUserMsg.content.trim()) {
                promptText = lastUserMsg.content.toLowerCase();
            } else if (Array.isArray(lastUserMsg.content)) {
                promptText = lastUserMsg.content.map(p => p.type === 'text' ? p.text.toLowerCase() : '').join(' ');
            } else if (Array.isArray(lastUserMsg.parts)) {
                // AI SDK sends messages with parts array instead of content string
                promptText = lastUserMsg.parts.map(p => p.type === 'text' ? (p.text || '').toLowerCase() : '').join(' ');
            }
        }
        console.log(`[Chat] Extracted promptText: "${promptText.substring(0, 100)}"`);

        const imageKeywordsRegex = /\b(generate|create|draw|make|paint|render|show me|give me)\b.*\b(?:image|picture|photo|illustration|drawing|art|artwork|portrait|sketch|graphic)\b/i;
        const implicitImageRegex = /\b(draw me|paint me|generate a[n]? image|create a[n]? image|make a[n]? image|make me a[n]? image|create a[n]? picture|make a photo)\b/i;
        // Exclude analysis/description requests — these should NOT trigger generateImage
        // IMPORTANT: Only treat as analysis if there's actually an image URL present,
        // otherwise "what is X" or "explain Y" are just normal text queries
        const hasImageUrl = promptText.includes('res.cloudinary.com') || promptText.includes('image:');
        const isAnalysisRequest = hasImageUrl && /\b(analyze|analyse|describe|explain|read|scan|extract|ocr|what is|what's in|tell me about|look at|details|identify|show me what is in|this image)\b/i.test(promptText);
        const isImageRequest = !isAnalysisRequest && (imageKeywordsRegex.test(promptText) || implicitImageRegex.test(promptText));
        console.log(`[Chat] isImageRequest: ${isImageRequest}, isAnalysisRequest: ${isAnalysisRequest} (promptText: "${promptText.substring(0, 50)}")`);

        let selectedAiModel = google('gemini-2.5-flash'); // Primary brain — Gemini

        if (isImageRequest) {
            // Image is pre-generated via HuggingFace — use fast Groq for the text response
            console.log('[Chat] Dynamic Route: Image Request -> Groq Chat key (text response only)');
            selectedAiModel = groqChat('llama-3.3-70b-versatile');
        } else if (hasImageUrl || isAnalysisRequest) {
            // Gemini has native multimodal vision — perfect for image analysis
            console.log('[Chat] Dynamic Route: Image Analysis -> Gemini Vision');
            selectedAiModel = google('gemini-2.5-flash');
        } else if (model === 'deep') {
            console.log('[Chat] Dynamic Route: Deep Research -> Gemini (with Exa context)');
            selectedAiModel = google('gemini-2.5-flash');
        } else if (model === 'google') {
            console.log('[Chat] Dynamic Route: Google mode -> Gemini');
            selectedAiModel = google('gemini-2.5-flash');
        } else {
            // Default conversational chat — Gemini primary
            console.log('[Chat] Dynamic Route: Default Chat -> Gemini');
            selectedAiModel = google('gemini-2.5-flash');
        }

        // ONLY convert to multimodal for the vision model — other models reject array content
        if (hasImageUrl || isAnalysisRequest) {
            processedMessages = processedMessages.map(msg => {
                if (msg.role !== 'user') return msg;

                let fullText = '';
                if (typeof msg.content === 'string') {
                    fullText = msg.content;
                } else if (Array.isArray(msg.content)) {
                    fullText = msg.content.map(p => (p.type === 'text' ? p.text : '')).join(' ');
                }

                // Only convert the LAST user message with an image URL to multimodal
                const urlMatch = fullText.match(/(https?:\/\/res\.cloudinary\.com[^\s]+\.(?:jpg|jpeg|png|gif|webp))/i);
                if (urlMatch) {
                    const imageUrl = urlMatch[1];
                    const textPrompt = fullText.replace(imageUrl, '').replace(/Image:\s*/gi, '').trim();
                    console.log(`[Chat] Converting message to multimodal: text="${textPrompt.substring(0, 60)}", image="${imageUrl.substring(0, 60)}..."`);
                    return {
                        ...msg,
                        content: [
                            { type: 'text', text: textPrompt || 'Please analyze this image in detail.' },
                            { type: 'image', image: new URL(imageUrl) }
                        ]
                    };
                }
                return msg;
            });
        }

        // Adjust system prompt based on intent
        const promptTextForSystemPrompt = promptText.substring(0, 500);
        let systemPrompt = `You are Pengu AI, a complete, multi-capable AI machine and empathetic study companion.
You handle text, vision, and deep semantic search seamlessly. Be warm, conversational, and helpful—never robotic.

### CAPABILITIES & CORE BEHAVIOR
- **Primary Brain**: You are powered by Google Gemini (gemini-2.5-flash). You can speak and understand dozens of languages fluently.
- **Vision Model**: If the user provides an image or a URL to one, you use your native vision capabilities to analyze it.
- **Exa.ai Semantic Search**: For ANY search request ("search for", "find me", "look up"), the system automatically retrieves real-time context from Exa.ai. Use this data to provide cited, accurate answers.
- **Document RAG**: If the user is in a PDF chat, relevant chunks from their textbook are injected into your context. Use them as the primary source of truth.

Focus on being an expert research and study assistant. Always be encouraging, clear, and help students learn step-by-step.`;

        // IMPORTANT: Only add the image generation capability/disclaimer if the current request is an image request.
        // This prevents the "I can't create images" robotic refusal for plain-text queries like "hy" 
        // because Gemini models will preemptively refuse if "image generation" is in their base prompt.
        if (isImageRequest) {
            systemPrompt += "\n\n**Image Generation**: The user has asked to generate an image. Confirm that you are creating the image for them now, and be enthusiastic about it. Keep your response brief as the image will appear automatically.";
        }

        // The /api/chat route only needs to handle image ANALYSIS (user uploaded an image).
        if (hasImageUrl) {
            systemPrompt += '\n\n**Vision Mode Active**: The user has uploaded an image for analysis. Analyze it thoroughly and answer the user\'s specific questions about it.';
        }

        // --- Exa Smart Search: Pre-LLM Context Injection ---
        // Detect if the user is asking for research, papers, articles, or academic sources
        const isResearchQuery = /\b(research|paper|papers|journal|scholarly|academic|study|studies|peer[- ]?reviewed|literature|thesis|dissertation|experiment|clinical trial)\b/i.test(promptText);
        const isNewsQuery = /\b(news|latest|current events|headlines|breaking|update|updates|what happened|today)\b/i.test(promptText);
        // General search intent: if they ask to "search for", "find me", "look up", or "google" anything
        const isGeneralSearch = /\b(search (for|on)|find (me|information|info)|look up|tell me about the history of|who is|what is the status of|recent developments in)\b/i.test(promptText);

        let exaInjected = false;

        if (exa && (isResearchQuery || isNewsQuery || isGeneralSearch)) {
            try {
                let searchCategory = 'general';
                if (isResearchQuery) searchCategory = 'research paper';
                if (isNewsQuery) searchCategory = 'news';

                console.log(`[Chat] Exa Smart Search detected (category: ${searchCategory}) — querying before LLM...`);

                const searchOptions = {
                    type: 'auto',
                    numResults: 8,
                    contents: {
                        highlights: { maxCharacters: 3000 }
                    },
                    category: searchCategory
                };

                const exaResults = await exa.search(promptText, searchOptions);

                if (exaResults.results && exaResults.results.length > 0) {
                    const formatted = exaResults.results.map((r, i) => {
                        let entry = `**${i + 1}. ${r.title || 'Untitled'}**\n`;
                        entry += `   🔗 ${r.url}\n`;
                        if (r.author) entry += `   ✍️ Author: ${r.author}\n`;
                        if (r.publishedDate) entry += `   📅 Published: ${new Date(r.publishedDate).toLocaleDateString()}\n`;
                        if (r.highlights && r.highlights.length > 0) {
                            entry += `   📝 ${r.highlights.join(' ... ')}\n`;
                        } else if (r.text) {
                            entry += `   📝 ${r.text.substring(0, 300)}...\n`;
                        }
                        return entry;
                    }).join('\n');

                    systemPrompt += `\n\n**EXA SMART SEARCH RESULTS**: The following high-quality sources were found using semantic search for "${promptText}". Present these results clearly with titles, URLs, and key takeaways:\n\n${formatted}\n\nAlways provide the source URLs for citations.`;
                    console.log(`[Chat] Injected ${exaResults.results.length} Exa results into system prompt.`);
                    exaInjected = true;
                }
            } catch (exaErr) {
                console.error('[Chat] Exa Smart Search failed:', exaErr.message);
            }
        }

        // Only include tools when Exa hasn't already provided context
        // (prevents Groq from redundantly calling webSearch with null args after seeing Exa data)
        const activeTools = {};
        if (!exaInjected && aiTools.webSearch) activeTools.webSearch = aiTools.webSearch;
        const hasTools = Object.keys(activeTools).length > 0;

        // Retrieve RAG Context from Pinecone PDF Assistant if active
        const targetPineconeId = pineconeAssistantId || (currentSession && currentSession.pineconeAssistantId);
        if (targetPineconeId) {
            try {
                console.log(`[Chat] Querying Pinecone Assistant (${targetPineconeId}) for RAG Context...`);
                const { Pinecone } = require('@pinecone-database/pinecone');
                const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
                const assistant = pc.assistant(targetPineconeId);

                // Fetch relevant chunks using the user's latest prompt
                const ragResponse = await assistant.context({ query: promptText || 'summary' });

                if (ragResponse) {
                    systemPrompt += "\n\n**PDF RAG CONTEXT**: You have access to the following relevant document excerpts retrieved from the student's embedded textbook:\n\n";
                    systemPrompt += typeof ragResponse === 'string' ? ragResponse : JSON.stringify(ragResponse);
                    systemPrompt += "\n\nUse the above excerpts to accurately answer the user's question. If the excerpts do not contain the answer, you can rely on your general knowledge but clarify that the book did not explicitly cover it.";
                    console.log(`[Chat] Successfully injected Pinecone RAG layout context into system prompt.`);
                }
            } catch (err) {
                console.error(`[Chat] Failed to query Pinecone Assistant for context:`, err.message);
            }
        }

        // Call AI Model
        console.log(`[Chat] Sending request to model: ${req.body.model || 'default'} (Mapped: ${selectedAiModel.modelId}), tools: [${Object.keys(activeTools).join(', ')}]`);

        const result = await streamText({
            model: selectedAiModel,
            messages: processedMessages,
            system: systemPrompt,
            tools: hasTools ? activeTools : undefined,
            toolChoice: 'auto',
            maxSteps: hasTools ? 5 : 1,
            onFinish: async ({ text, steps, response }) => {
                let finalContent = text || '';

                // Extract tool results from all steps
                const allToolResults = [];
                if (steps && steps.length > 0) {
                    for (const step of steps) {
                        // Check step.toolResults
                        if (step.toolResults && Array.isArray(step.toolResults) && step.toolResults.length > 0) {
                            allToolResults.push(...step.toolResults);
                        }
                        // Also check step.toolCalls (each may contain a result)
                        if (step.toolCalls && Array.isArray(step.toolCalls)) {
                            for (const tc of step.toolCalls) {
                                if (tc.result !== undefined) {
                                    const exists = allToolResults.some(r => r.toolCallId === tc.toolCallId);
                                    if (!exists) {
                                        allToolResults.push({ toolCallId: tc.toolCallId, toolName: tc.toolName, args: tc.args, result: tc.result });
                                    }
                                }
                            }
                        }
                    }
                }

                console.log(`[Chat] onFinish: text="${(finalContent || '').substring(0, 80)}", toolResults=${allToolResults.length}, steps=${steps?.length || 0}`);

                // If no text content but we have tool results, build content from them
                if ((!finalContent || finalContent.trim().length === 0) && allToolResults.length > 0) {
                    finalContent = allToolResults.map(tr => {
                        try { console.log(`[Chat] Tool result: name=${tr.toolName}, keys=${tr.result ? Object.keys(tr.result) : 'none'}`); } catch (e) { }
                        if (typeof tr.result === 'string') return tr.result;
                        if (tr.result && tr.result.url) return `![Generated Image](${tr.result.url})`;
                        try { return JSON.stringify(tr.result); } catch (e) { return ''; }
                    }).filter(Boolean).join('\n\n');
                }

                // PRIMARY FIX: Use the closure-captured URL as the authoritative source.
                // This works even if step.toolResults is empty or structured unexpectedly.
                // The URL is captured directly inside execute() the moment Cloudinary confirms upload.
                if (generatedImageUrl && !finalContent.includes(generatedImageUrl)) {
                    const imageMarkdown = `![Generated Image](${generatedImageUrl})`;
                    finalContent = (finalContent.trim() ? finalContent.trim() + '\n\n' : '') + imageMarkdown;
                    console.log(`[Chat] Injected image markdown from closure URL: ${generatedImageUrl}`);
                }

                // Also check: if text already contains the image URL from tool output, keep it
                // But if text is empty and response messages have tool-result parts, extract from there
                if ((!finalContent || finalContent.trim().length === 0) && response?.messages) {
                    for (const msg of response.messages) {
                        if (msg.role === 'assistant' && Array.isArray(msg.content)) {
                            for (const part of msg.content) {
                                if (part.type === 'tool-call' || part.type === 'tool-result') {
                                    const result = part.result || part.args;
                                    if (result?.url) {
                                        finalContent = `![Generated Image](${result.url})`;
                                    }
                                }
                            }
                        }
                    }
                }

                finalContent = finalContent || ' ';
                console.log(`[Chat] Final content to save (${finalContent.length} chars): "${finalContent.substring(0, 150)}"`);

                // Save the AI's response to the database once the stream completes
                if (currentSession) {
                    currentSession.messages.push({
                        role: 'assistant',
                        content: finalContent,
                        id: Date.now().toString(),
                        toolInvocations: allToolResults.length > 0 ?
                            allToolResults.map(tr => ({
                                state: 'result',
                                toolCallId: tr.toolCallId,
                                toolName: tr.toolName,
                                args: tr.args,
                                result: tr.result
                            })) : []
                    });
                    await currentSession.save();
                    console.log(`[Chat] Session saved with content: "${finalContent.substring(0, 100)}"`);
                }
            }
        });

        // Extract the sessionId to send back in headers so the frontend can retain it
        if (!isGuest && currentSession) {
            res.setHeader('x-session-id', currentSession._id.toString());
        }

        try {
            // Fix: Add headers to prevent proxy buffering (Vercel Edge/Render NGINX)
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('X-Accel-Buffering', 'no');

            // Stream response back to client using the officially supported v6 UI Message protocol
            console.log('[Chat] Stream started and piping to response.');
            result.pipeUIMessageStreamToResponse(res);
            console.log('[Chat] Piped successfully via UIMessageStream.');
        } catch (streamError) {
            console.error('[Chat] Stream pipe error, attempting plain-text fallback:', streamError?.message);
            if (!res.headersSent) {
                try {
                    // Fix: Apply same proxy headers for fallback
                    res.setHeader('Connection', 'keep-alive');
                    res.setHeader('Cache-Control', 'no-cache, no-transform');
                    res.setHeader('X-Accel-Buffering', 'no');

                    const fallback = await streamText({
                        model: groqChat('llama-3.3-70b-versatile'),
                        messages: processedMessages,
                        system: 'You are Pengu AI, a helpful tutor. Answer clearly and helpfully.',
                        maxSteps: 1
                    });
                    fallback.pipeUIMessageStreamToResponse(res);
                } catch (fallbackError) {
                    console.error('[Chat] Fallback stream also failed:', fallbackError?.message);
                    res.status(500).json({ error: 'Failed to process chat request' });
                }
            }
        }

    } catch (error) {
        // ── Gemini → Groq Automatic Fallback Chain ─────────────────────────
        // If the primary Gemini model fails for any reason (rate limit, API error, etc.),
        // automatically retry with Groq as a fast fallback so the user always gets a response.
        const isGeminiFail = error?.message?.includes('GOOGLE') ||
            error?.message?.includes('gemini') ||
            error?.message?.includes('Quota') ||
            error?.message?.includes('429') ||
            error?.message?.includes('503') ||
            error?.message?.includes('500') ||
            error?.statusCode === 429 ||
            error?.statusCode === 503;

        const isToolCallError = error?.message?.includes('Failed to call a function') ||
            error?.message?.includes('failed_generation') ||
            (error?.data?.error?.type === 'invalid_request_error');

        if ((isGeminiFail || isToolCallError) && !res.headersSent) {
            console.error(`[Chat] Primary model failed (${error?.message?.substring(0, 80)}), falling back to Groq...`);
            try {
                // Fix: Apply proxy headers here too
                res.setHeader('Connection', 'keep-alive');
                res.setHeader('Cache-Control', 'no-cache, no-transform');
                res.setHeader('X-Accel-Buffering', 'no');

                const fallback = await streamText({
                    model: groqChat('llama-3.3-70b-versatile'),
                    messages: processedMessages,
                    system: 'You are Pengu AI, a friendly, intelligent, and empathetic study companion. Be warm, conversational, and helpful. Answer clearly and helpfully.',
                    maxSteps: 1
                });
                fallback.pipeUIMessageStreamToResponse(res);
                return;
            } catch (fallbackErr) {
                console.error('[Chat] Groq fallback also failed:', fallbackErr?.message);
            }
        }

        console.error('Chat API Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to process chat request', details: error.message });
        }
    }
});

// ─── Dedicated Image Generation Endpoint ────────────────────────────────────
// Completely separate from /api/chat to avoid any LLM tool-calling issues.
// Frontend calls this directly when it detects an image request.
app.post('/api/generate-image', async (req, res) => {
    try {
        // NOTE: userMessage must be destructured here — it is sent by the frontend
        // so we can save the user's "create a cat image" text to the DB as well.
        const { prompt, sessionId, userId, userMessage } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
        if (!process.env.HUGGINGFACE_API_KEY) return res.status(503).json({ error: 'Image generation not configured' });

        console.log(`[ImageGen] Generating image for prompt: "${prompt}"`);

        // Add 30-second timeout for HuggingFace cold starts
        const abortController = new AbortController();
        const hfTimeout = setTimeout(() => abortController.abort(), 30000);

        const hfResponse = await fetch(
            'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ inputs: prompt }),
                signal: abortController.signal,
            }
        );
        clearTimeout(hfTimeout);

        if (!hfResponse.ok) {
            const errText = await hfResponse.text();
            console.error(`[ImageGen] HuggingFace error ${hfResponse.status}: ${errText}`);
            return res.status(502).json({ error: `Visual processing system unavailable` });
        }

        const arrayBuffer = await hfResponse.arrayBuffer();
        if (!arrayBuffer || arrayBuffer.byteLength < 100) {
            return res.status(502).json({ error: 'Failed to retrieve generated image' });
        }

        const buffer = Buffer.from(arrayBuffer);
        const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
        const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8;
        if (!isPng && !isJpeg) return res.status(502).json({ error: 'Invalid image format' });

        // Upload to Cloudinary
        const uploadedImage = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: 'pengu-ai-generated', resource_type: 'image' },
                (error, result) => { if (error) reject(error); else resolve(result); }
            ).end(buffer);
        });

        const imageUrl = uploadedImage.secure_url;
        console.log(`[ImageGen] Uploaded to Cloudinary: ${imageUrl}`);

        // ── Persist to MongoDB ────────────────────────────────────────────
        // Works for both existing sessions AND brand-new chats (no sessionId yet).
        let savedSessionId = sessionId;

        if (userId) {
            try {
                const now = Date.now();
                const userMsgObj = userMessage ? {
                    role: 'user',
                    content: userMessage,
                    id: now.toString(),
                } : null;
                const assistantMsgObj = {
                    role: 'assistant',
                    content: `[GENERATED_IMAGE:${imageUrl}]`,
                    id: (now + 1).toString(),
                    toolInvocations: [{
                        state: 'result',
                        toolCallId: `img-${now}`,
                        toolName: 'generateImage',
                        args: { prompt },
                        result: { url: imageUrl, prompt, success: true }
                    }]
                };
                const mediaItem = {
                    originalName: `generated-${now}.jpg`,
                    cloudinaryUrl: imageUrl
                };

                if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
                    // Existing session — append messages
                    const session = await ChatSession.findById(sessionId);
                    if (session) {
                        if (userMsgObj) session.messages.push(userMsgObj);
                        session.messages.push(assistantMsgObj);
                        session.mediaItems.push(mediaItem);
                        await session.save();
                        console.log(`[ImageGen] Saved to existing session ${sessionId}`);
                    }
                } else {
                    // New chat — create a fresh session so data persists after reload
                    const title = (userMessage || prompt).substring(0, 40) || 'Image Generation';
                    const newMessages = userMsgObj
                        ? [userMsgObj, assistantMsgObj]
                        : [assistantMsgObj];
                    const newSession = new ChatSession({
                        userId,
                        title,
                        messages: newMessages,
                        mediaItems: [mediaItem],
                    });
                    await newSession.save();
                    savedSessionId = newSession._id.toString();
                    console.log(`[ImageGen] Created new session ${savedSessionId}`);
                }
            } catch (dbErr) {
                console.error('[ImageGen] DB save error (non-fatal):', dbErr.message);
            }
        }

        // Return sessionId so frontend can call updateChatId for new chats
        res.json({ url: imageUrl, prompt, sessionId: savedSessionId });
    } catch (error) {
        console.error('[ImageGen] Error:', error.message);
        res.status(500).json({ error: 'Image generation failed', details: error.message });
    }
});


app.get('/api/chat/history', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(401).json({ error: 'UserId required' });
        }

        // Prevent Cast to ObjectId failed for value "mm0..." (BSONError)
        // If the user's local storage contains a legacy string ID, just return empty.
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.json([]);
        }

        const sessions = await ChatSession.find({ userId }).sort({ updatedAt: -1 });
        res.json(sessions);
    } catch (error) {
        console.error("HISTORY FETCH ERROR:", error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.get('/api/chat/:sessionId', async (req, res) => {
    try {
        const session = await ChatSession.findById(req.params.sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch session' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

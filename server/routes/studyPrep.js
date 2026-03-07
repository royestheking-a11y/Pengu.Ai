const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { generateText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { createGroq } = require('@ai-sdk/groq');
const ChatSession = require('../models/ChatSession');

// Initialize AI providers locally for this route
const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY_CHAT || process.env.GROQ_API_KEY_VISION,
});

// Configure multer for temporary local storage
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { purpose, subject, sessionId, userId, syllabusText } = req.body;

        if (!subject) {
            return res.status(400).json({ error: 'Subject is required' });
        }

        let documentContext = "";

        // If a file was uploaded, process it with Gemini
        if (req.file) {
            console.log(`[StudyPrep] Processing uploaded file: ${req.file.originalname}`);

            // Upload to Cloudinary first
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'pengu-ai-syllabus',
                resource_type: 'auto'
            });

            // Clean up temp file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            console.log(`[StudyPrep] File uploaded to Cloudinary: ${result.secure_url}`);

            // Use Gemini to analyze the document (URL or buffer)
            try {
                // Fetch the image to pass as buffer
                const imgResponse = await fetch(result.secure_url);
                const imgBuffer = await imgResponse.arrayBuffer();

                const analysis = await generateText({
                    model: google('gemini-2.5-flash'),
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `Read this past exam paper or syllabus for ${subject}. Identify the core topics, the difficulty level, and the question formats (e.g., multiple choice, short answer). Extract key concepts that should be tested.`
                                },
                                {
                                    type: 'image',
                                    image: Buffer.from(imgBuffer)
                                }
                            ]
                        }
                    ]
                });

                documentContext = `\nBased on the uploaded syllabus/document analysis: ${analysis.text}`;
                console.log(`[StudyPrep] Document analysis complete.`);
            } catch (err) {
                console.error("[StudyPrep] Gemini Analysis failed:", err);
                documentContext = "\n(A document was uploaded but could not be analyzed. Please proceed generating questions based on the subject alone.)";
            }
        } else if (syllabusText && syllabusText.trim()) {
            documentContext = `\nBased on the provided syllabus/pattern: ${syllabusText.trim()}`;
            console.log(`[StudyPrep] Using pasted syllabus text.`);
        }

        console.log(`[StudyPrep] Generating quiz via Groq...`);

        // Use Groq to generate the quiz JSON
        const quizGeneration = await generateText({
            model: groq('llama-3.3-70b-versatile'),
            system: `You are an expert tutor preparing a ${purpose} for the subject: ${subject}.
You MUST return the output EXACTLY as a valid JSON array of 10 question objects.
Do not output any markdown formatting, no \`\`\`json, just the raw JSON array.
Each object must have exactly these keys: "question", "options" (array of 4 strings), "correct" (string, must exactly match one of the options), and "explanation" (string).`,
            prompt: `Generate exactly 10 relevant multiple-choice questions for ${subject}. ${documentContext}`,
        });

        let quizJson = quizGeneration.text.trim();

        // Safety cleanup if the LLM still wrapped it in markdown
        if (quizJson.startsWith('```json')) {
            quizJson = quizJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (quizJson.startsWith('```')) {
            quizJson = quizJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const quizData = JSON.parse(quizJson);

        console.log(`[StudyPrep] Quiz successfully generated with ${quizData.length} questions.`);

        // Save session context to history
        if (userId && sessionId) {
            try {
                const session = await ChatSession.findById(sessionId);
                if (session) {
                    session.messages.push({
                        role: 'user',
                        content: `Generated a ${purpose} quiz for ${subject}.${req.file ? ' (Included an uploaded pattern)' : ''}`
                    });

                    const quizSummary = quizData.map((q, i) => `${i + 1}. ${q.question}`).join('\n');
                    session.messages.push({
                        role: 'assistant',
                        content: `I have generated a ${quizData.length}-question interactive quiz for ${subject}.\n\nPreview of topics:\n${quizSummary}`
                    });

                    await session.save();
                }
            } catch (dbErr) {
                console.error("[StudyPrep] Failed to save to session history:", dbErr);
            }
        }

        res.json({ success: true, quiz: quizData });

    } catch (error) {
        console.error('[StudyPrep Error]:', error);

        // Cleanup temp file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: 'Failed to generate study prep materials', details: error.message });
    }
});

module.exports = router;

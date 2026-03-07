import { useState, useRef, useEffect, FormEvent, useCallback } from "react";
import { Send, Mic, Paperclip, ChevronDown, Sparkles, Zap, Loader2, HelpCircle, Square, FileText, MessageSquare, Brain, X, Image as ImageIcon, Volume2, VolumeX, Headphones } from "lucide-react";
import { useChat, UIMessage as Message } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useChatContext } from "./ChatContext";
import { useToast } from "./ToastContext";
import {
  extractPDFText,
  extractImageText,
  fetchYouTubeTranscript,
  parseYouTubeVideoId
} from "./FileUploadHandler";
import { QuickGuide } from "./QuickGuide";
import { Mermaid } from "./Mermaid";
import { ImageOutput } from "./ImageOutput";
import { API_BASE_URL } from "../../config";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import penguLogo from "@/assets/f5ab8b8d79f0bc497ec9b77eb6c002de4b5b855f.png";

export const getMessageContent = (msg: Message | any) => {
  if (!msg) return '';

  let textContent = '';

  // 1. Extract from content string
  if (typeof msg.content === 'string' && msg.content && msg.content !== 'undefined') {
    textContent = msg.content;
  }

  // 2. Extract from parts (new AI SDK pattern)
  if (msg.parts && Array.isArray(msg.parts)) {
    const partsText = msg.parts
      .map((p: any) => (p.type === 'text' && p.text && p.text !== 'undefined' ? p.text : ''))
      .filter(Boolean)
      .join('');
    if (partsText && !textContent.includes(partsText)) {
      textContent += (textContent ? '\n' : '') + partsText;
    }
  } else if (msg.parts && !Array.isArray(msg.parts)) {
    if (msg.parts.type === 'text' && msg.parts.text && msg.parts.text !== 'undefined') {
      textContent = msg.parts.text;
    }
  }

  // Filter out potential tool tags that might be emitted as text artifacts
  textContent = textContent.replace(/<generateimage>[\s\S]*?<\/generateimage>/gi, '');
  textContent = textContent.replace(/<websearch>[\s\S]*?<\/websearch>/gi, '');

  // 3. Handle Tool Results for status messages
  const toolCalls = msg.toolInvocations ||
    msg.parts?.filter((p: any) => p.type?.startsWith('tool-'))
      .map((p: any) => ({
        toolName: p.toolName || p.type.replace('tool-', ''),
        state: p.state === 'output-available' ? 'result' : p.state,
        result: p.output || p.result,
        toolCallId: p.toolCallId
      })) || [];

  if (toolCalls.length > 0) {
    const toolTexts = toolCalls.map((invocation: any) => {
      if (invocation.state === 'call' || invocation.state === 'partial-call') {
        return `\n\n*Running tool: ${invocation.toolName}...*`;
      }
      if (invocation.state === 'result' || invocation.state === 'output-available') {
        if (invocation.toolName === 'generateImage') return '';
        const res = invocation.result;
        if (!res || res === 'undefined') return '';
        const resStr = typeof res === 'string' ? res : JSON.stringify(res);
        return `\n\n${resStr}`;
      }
      return '';
    }).filter(Boolean).join('');

    textContent += toolTexts;
  }

  const finalContent = textContent.trim();
  return finalContent === 'undefined' ? '' : finalContent;
};

// Detects whether the user is asking for image generation
const IMAGE_GEN_REGEX = /\b(generate|create|draw|make|paint|render|show me|give me)\b.*\b(image|picture|photo|illustration|drawing|art|artwork|portrait|landscape|scene|wallpaper|sketch|graphic)\b/i;
const isImageGenRequest = (text: string) =>
  IMAGE_GEN_REGEX.test(text) &&
  !(/\b(analyze|analyse|describe|explain|look at|what is|what's in|tell me about|details|identify|scan|read|show me what is in)\b/i.test(text));


interface ChatInterfaceProps {
  openCanvas: (content: string, type: "text" | "flashcards" | "mindmap") => void;
}

// A synthetic message used to track live image generation state in the chat list
export interface ImageGenMessage {
  id: string;
  role: 'assistant';
  isImageGen: true;
  status: 'loading' | 'finished' | 'error';
  prompt: string;
  url?: string;
  errorMessage?: string;
}

export function ChatInterface({ openCanvas }: ChatInterfaceProps) {
  const { currentChat, user, updateChatId, addMessage } = useChatContext();
  const { showToast } = useToast();

  const [selectedModel, setSelectedModel] = useState<"fast" | "basic" | "deep">("basic");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ type: 'image' | 'pdf' | 'text'; url?: string; name: string; content?: string } | null>(null);
  // State for live image generation messages (loading/finished/error cards)
  const [imageGenMessages, setImageGenMessages] = useState<ImageGenMessage[]>([]);
  // User text that was sent via image gen path (not through useChat stream)
  const [pendingUserMessages, setPendingUserMessages] = useState<Array<{ id: string; content: string }>>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState("");

  // Sanitize messages to ensure content is always a string (fixes SDK validation error)
  const sanitizedInitialMessages = (currentChat?.messages || []).map((m: any) => {
    let safeContent = ' ';
    if (typeof m.content === 'string' && m.content.trim()) {
      safeContent = m.content;
    } else if (Array.isArray(m.content)) {
      safeContent = m.content
        .filter((p: any) => p && (p.type === 'text' || typeof p === 'string'))
        .map((p: any) => (typeof p === 'string' ? p : p.text || ''))
        .join(' ').trim() || ' ';
    } else if (m.content && typeof m.content === 'object' && m.content.text) {
      safeContent = String(m.content.text);
    }
    return { ...m, content: safeContent, parts: [{ type: 'text' as const, text: safeContent }] };
  });

  // Vercel AI SDK Integration
  const {
    messages,
    status,
    sendMessage,
    stop
  } = useChat({
    id: currentChat?.id || "new-chat",
    messages: sanitizedInitialMessages,
    transport: new DefaultChatTransport({
      api: `${API_BASE_URL}/api/chat`,
      body: {
        sessionId: currentChat?.id,
        model: selectedModel,
        userId: user?.id
      },
      // Custom fetch to extract session ID from response headers
      fetch: async (url, init) => {
        const response = await fetch(url, init);
        const serverSessionId = response.headers.get('x-session-id');
        if (serverSessionId && currentChat?.id && serverSessionId !== currentChat.id) {
          updateChatId(currentChat.id, serverSessionId);
        }
        return response;
      }
    }),
    onFinish: (result: any) => {
      // The backend already saves AI responses to MongoDB.
      console.log('[ChatInterface] AI response finished.');
      // Speak the response if voice mode is on
      // Use the ref because onFinish is a stale closure in useChat and wouldn't see state updates
      if (voiceModeRef.current && result?.content) {
        const textContent = typeof result.content === 'string'
          ? result.content
          : Array.isArray(result.content)
            ? result.content.filter((p: any) => p.type === 'text').map((p: any) => p.text).join(' ')
            : '';
        if (textContent) speakText(textContent);
      }
    },
    onError: (error) => {
      console.error(error);
      showToast("Failed to connect to AI server", "error");
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingUserMessages, imageGenMessages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Clear live image gen cards and pending user messages when switching chats
  useEffect(() => {
    setImageGenMessages([]);
    setPendingUserMessages([]);
  }, [currentChat?.id]);

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input?.trim() && !pendingAttachment) || isLoading) return;

    // Check if input is a YouTube URL
    const videoId = parseYouTubeVideoId(input || '');
    if (videoId) {
      handleYouTubeUrl(input);
      handleInputChange({ target: { value: '' } } as any);
      return;
    }

    // Build the message text, including any pending attachment
    let messageText = input?.trim() || '';

    if (pendingAttachment) {
      if (pendingAttachment.type === 'image' && pendingAttachment.url) {
        // Prepend image URL so the server can detect and pass to vision model
        const userPrompt = messageText || 'Please analyze this image in detail.';
        messageText = `${userPrompt}\n\nImage: ${pendingAttachment.url}`;
      } else if (pendingAttachment.type === 'pdf' && pendingAttachment.content) {
        const userPrompt = messageText || 'Please summarize this document.';
        messageText = `${userPrompt}\n\nDocument content:\n${pendingAttachment.content}`;
      } else if (pendingAttachment.type === 'text' && pendingAttachment.content) {
        const userPrompt = messageText || 'Please analyze this text file.';
        messageText = `${userPrompt}\n\nFile content:\n${pendingAttachment.content}`;
      }
      setPendingAttachment(null);
    }

    if (!messageText) return;

    setInput('');

    // ── Image Generation: bypass the AI stream entirely ───────────────
    // Directly call /api/generate-image and show the premium image card.
    if (isImageGenRequest(messageText) && !pendingAttachment) {
      const genId = `imggen-${Date.now()}`;
      const userMsgId = `user-${Date.now()}`;

      // 1. Show the user's message bubble immediately (before the loading card)
      setPendingUserMessages(prev => [...prev, { id: userMsgId, content: messageText }]);

      // 2. Immediately show a loading card in the chat
      setImageGenMessages(prev => [...prev, {
        id: genId,
        role: 'assistant',
        isImageGen: true,
        status: 'loading',
        prompt: messageText,
      }]);

      // 3. Call the dedicated image generation endpoint
      const sessionId = currentChat?.id;
      const userId = user?.id;
      fetch(`${API_BASE_URL}/api/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Pass userMessage so the server can save it to the DB as well
        body: JSON.stringify({ prompt: messageText, sessionId, userId, userMessage: messageText }),
      })
        .then(r => r.json())
        .then(data => {
          if (data?.url) {
            // 3a. Success — replace loading card with image card
            setImageGenMessages(prev => prev.map(m =>
              m.id === genId ? { ...m, status: 'finished', url: data.url } : m
            ));

            // If the server created a new session (new chat), register it in ChatContext
            // so the sidebar shows it and it persists across reloads.
            if (data.sessionId) {
              const currentId = currentChat?.id;
              if (!currentId || currentId !== data.sessionId) {
                // updateChatId maps the old temp id (or null) to the real MongoDB id
                updateChatId(currentId || 'new', data.sessionId);
              }
            }
          } else {
            // 3b. API-level failure
            setImageGenMessages(prev => prev.map(m =>
              m.id === genId ? { ...m, status: 'error', errorMessage: data?.error || 'Generation failed' } : m
            ));
          }
        })
        .catch(err => {
          console.error('[ImageGen] Request failed:', err);
          setImageGenMessages(prev => prev.map(m =>
            m.id === genId ? { ...m, status: 'error', errorMessage: 'Network error — please try again' } : m
          ));
        });

      return; // Don't send to the AI chat stream
    }

    sendMessage({ text: messageText });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast("Processing file...", "info");
      const fileType = file.type;
      const fileName = file.name;

      if (fileType === "application/pdf") {
        const extractedText = await extractPDFText(file);
        setPendingAttachment({ type: 'pdf', name: fileName, content: extractedText });
        showToast(`PDF "${fileName}" ready! Type your question and send.`, "success");
      } else if (fileType.startsWith("image/")) {
        // Upload image to Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", user.id);

        showToast("Uploading image...", "info");
        const response = await fetch(`${API_BASE_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();

        // Stage the image — don't auto-send, let the user type a prompt
        setPendingAttachment({ type: 'image', url: data.url, name: fileName });
        showToast(`Image uploaded! Type your question and send.`, "success");
      } else if (
        fileType === 'text/plain' ||
        fileType === 'text/csv' ||
        fileType === 'text/markdown' ||
        fileName.endsWith('.txt') ||
        fileName.endsWith('.csv') ||
        fileName.endsWith('.md')
      ) {
        // Read text file directly
        const text = await file.text();
        setPendingAttachment({ type: 'text', name: fileName, content: text });
        showToast(`File "${fileName}" ready! Type your question and send.`, "success");
      } else {
        showToast("Unsupported file type. Please upload PDF, image, or text file.", "error");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      showToast("Failed to process file", "error")
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleYouTubeUrl = async (url: string) => {
    const videoId = parseYouTubeVideoId(url);
    if (!videoId) return;

    try {
      showToast("Fetching YouTube transcript...", "info");
      const transcript = await fetchYouTubeTranscript(videoId);

      if (!transcript || transcript === 'No transcript content available.') {
        showToast("No transcript available for this video. Captions may be disabled.", "error");
        return;
      }

      showToast("Generating study guide...", "success");

      // Comprehensive study guide prompt
      const prompt = `You are a study guide creator. A student has shared a YouTube video. Below is the full transcript from the video. Based on this transcript, please generate a **comprehensive study guide** with the following structure:

## 📋 Structured Summary
Provide a clear, well-organized summary of the video's main topics. Use headers and bullet points. Break down complex ideas into digestible sections.

## 📖 Key Vocabulary & Definitions
List 8-12 important terms, concepts, or keywords from the video with clear definitions.

## ❓ 5-Question Multiple Choice Quiz
Create 5 multiple-choice questions (A, B, C, D) that test understanding of the video's content. Include the correct answer after each question.

## 💡 Key Takeaways
List 3-5 main takeaways or learning points from the video.

---

**YouTube Video Transcript:**

${transcript}

---

Please generate the study guide now. Make it engaging, educational, and well-formatted with markdown.`;

      sendMessage({ text: prompt });
    } catch (error: any) {
      console.error("Error fetching transcript:", error);
      showToast(error.message || "Failed to fetch YouTube transcript", "error");
    }
  };

  const recognitionRef = useRef<any>(null);
  const voiceModeRef = useRef(voiceMode);
  const pendingVoiceTextRef = useRef('');

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Keep voiceMode ref in sync
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  // Speech Synthesis — Pengu reads AI responses aloud
  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    utteranceRef.current = null;

    // Clean markdown formatting for natural speech
    const cleanText = text
      .replace(/#{1,6}\s/g, '') // headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // bold
      .replace(/\*(.*?)\*/g, '$1') // italic
      .replace(/`{1,3}[^`]*`{1,3}/g, '') // code blocks
      .replace(/!\[.*?\]\(.*?\)/g, '') // images
      .replace(/\[(.+?)\]\(.*?\)/g, '$1') // links
      .replace(/[-*]\s/g, '') // list bullets
      .replace(/\n{2,}/g, '. ') // paragraph breaks
      .replace(/\n/g, ' ')
      .trim();

    if (!cleanText) return;

    // Split into chunks for long text (max ~200 chars per utterance for reliability)
    const sentences = cleanText.match(/[^.!?]+[.!?]*/g) || [cleanText];
    let currentChunk = '';
    const chunks: string[] = [];

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > 200) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());

    setIsSpeaking(true);

    const speakChunk = (index: number) => {
      if (index >= chunks.length) {
        setIsSpeaking(false);
        utteranceRef.current = null;
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[index]);

      // Keep a reference to prevent Chrome garbage collection from stopping speech mid-way
      utteranceRef.current = utterance;

      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to use a natural-sounding voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v =>
        v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Natural')
      ) || voices.find(v => v.lang.startsWith('en'));
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => speakChunk(index + 1);
      utterance.onerror = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      window.speechSynthesis.speak(utterance);
    };

    speakChunk(0);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  // Keep track of the input value right before recording started
  const preRecordInputRef = useRef('');

  // Keep track of the current input value without adding it to useEffect dependencies
  const inputRef = useRef(input);
  useEffect(() => { inputRef.current = input; }, [input]);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Preload voices
      window.speechSynthesis?.getVoices();

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        // Turn off interimResults to prevent the duplicating text issue 
        // because React state updates can clash with rapid interim results
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            const cleanTranscript = finalTranscript.trim();
            pendingVoiceTextRef.current = cleanTranscript;

            // Append the new transcript to whatever the user typed BEFORE hitting the mic button
            const newCombinedInput = preRecordInputRef.current
              ? `${preRecordInputRef.current} ${cleanTranscript}`.trim()
              : cleanTranscript;

            setInput(newCombinedInput);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
          if (event.error !== 'aborted') {
            showToast(`Microphone error: ${event.error}`, "error");
          }
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);

          // In voice mode, auto-trigger a send if there's text
          // We use the ref to check voice mode to avoid stale closures
          if (voiceModeRef.current && pendingVoiceTextRef.current.trim()) {
            pendingVoiceTextRef.current = '';

            // Give React a tiny tick to finish the setInput render
            setTimeout(() => {
              // Programmatically click the submit button to trigger the exact same React flow
              // as if the user clicked it, avoiding synthetic event issues with handleSendMessage
              const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
              if (submitBtn) {
                submitBtn.click();
              }
            }, 100);
          }
        };
      }
    }
  }, [showToast]);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      showToast("Voice input is not supported in your browser.", "error");
      return;
    }

    // Stop any ongoing speech when starting to record
    stopSpeaking();

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      if (!voiceMode) {
        showToast("Voice recording stopped", "info");
      }
    } else {
      // Snapshot what is CURRENTLY in the textbox before we start listening
      preRecordInputRef.current = inputRef.current.trim();
      pendingVoiceTextRef.current = '';

      try {
        recognitionRef.current.start();
        setIsRecording(true);
        showToast(voiceMode ? "🎧 Listening... Speak now" : "Voice recording started...", "info");
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    }
  };

  const toggleVoiceMode = () => {
    const newMode = !voiceMode;
    setVoiceMode(newMode);
    if (!newMode) {
      // Turning off voice mode — stop any speech and recording
      stopSpeaking();
      if (isRecording) {
        recognitionRef.current?.stop();
        setIsRecording(false);
      }
      showToast("Voice mode off", "info");
    } else {
      showToast("🎧 Walk & Study mode on! Pengu will speak responses.", "success");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const handleStopGenerating = () => {
    stop();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header - ChatGPT Style */}
      <div className="border-b border-gray-200 pl-16 pr-4 md:px-6 py-3 md:py-4 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3 truncate">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 truncate">
            {currentChat?.title || "New Chat"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Help Button */}
          <button
            onClick={() => setShowGuide(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Quick Guide"
          >
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </button>

          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
            >
              {selectedModel === "fast" ? (
                <>
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="hidden sm:inline">model 3.2</span>
                </>
              ) : selectedModel === "basic" ? (
                <>
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span className="hidden sm:inline">model 4.2</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline">model 5.2</span>
                </>
              )}
              <ChevronDown className="w-4 h-4" />
            </button>

            {showModelDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowModelDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                  <button
                    onClick={() => {
                      setSelectedModel("fast");
                      setShowModelDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${selectedModel === "fast" ? "bg-gray-50" : ""
                      }`}
                  >
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold text-sm text-gray-900">model 3.2</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedModel("basic");
                      setShowModelDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${selectedModel === "basic" ? "bg-gray-50" : ""
                      }`}
                  >
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-sm text-gray-900">model 4.2</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedModel("deep");
                      setShowModelDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors ${selectedModel === "deep" ? "bg-gray-50" : ""
                      }`}
                  >
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-sm text-gray-900">model 5.2</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && pendingUserMessages.length === 0 && imageGenMessages.length === 0 ? (
          <EmptyState onSelectPrompt={(p) => handleInputChange({ target: { value: p } } as any)} />
        ) : (
          <div className="w-full">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                openCanvas={openCanvas}
                isLatest={index === messages.length - 1 && pendingUserMessages.length === 0 && imageGenMessages.length === 0}
              />
            ))}
            {/* User messages sent via image gen path (not through useChat) */}
            {pendingUserMessages.map((pum) => (
              <div key={pum.id} className="w-full py-6 md:py-8 bg-white">
                <div className="max-w-3xl mx-auto px-4 md:px-6">
                  <div className="flex gap-3 md:gap-4 flex-row-reverse">
                    <div className="flex-shrink-0">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#462D28] flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">U</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col items-end">
                      <div className="inline-block max-w-[85%] bg-[#F5F2F1] rounded-2xl px-4 py-3">
                        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed m-0">{pum.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Live image generation cards (loading → finished/error) */}
            {imageGenMessages.map((imgMsg) => (
              <div key={imgMsg.id} className="w-full border-b border-gray-100 py-6 md:py-8">
                <div className="max-w-3xl mx-auto px-4 md:px-6">
                  <div className="flex gap-3 md:gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#462D28]/10 flex items-center justify-center">
                        <img src={penguLogo} alt="Pengu" className="w-5 h-5 md:w-6 md:h-6 rounded-full" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <ImageOutput
                        status={imgMsg.status}
                        url={imgMsg.url}
                        prompt={imgMsg.prompt}
                        errorMessage={imgMsg.errorMessage}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              messages.length === 0 ||
              messages[messages.length - 1]?.role === "user" ||
              (messages[messages.length - 1]?.role === "assistant" && !getMessageContent(messages[messages.length - 1]))
            ) && (
                <div className="w-full border-b border-gray-100 py-6 md:py-8">
                  <div className="max-w-3xl mx-auto px-4 md:px-6">
                    <div className="flex gap-3 md:gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#462D28]/10 flex items-center justify-center">
                          <img src={penguLogo} alt="Pengu" className="w-5 h-5 md:w-6 md:h-6 rounded-full" />
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          <span className="text-sm text-gray-500">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - ChatGPT Style */}
      <div className="border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-6">
          {isLoading && (
            <div className="mb-3 flex justify-center">
              <button
                onClick={handleStopGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Square className="w-3.5 h-3.5" fill="currentColor" />
                Stop generating
              </button>
            </div>
          )}

          {/* Voice Recording Indicator */}
          {isRecording && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-2 animate-pulse">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <span className="text-sm font-medium text-red-700">
                {voiceMode ? '🎧 Listening... Speak and I\'ll reply when you stop' : 'Recording... Click mic to stop'}
              </span>
              {input && (
                <span className="text-xs text-red-500 truncate flex-1 text-right italic">"{input}"</span>
              )}
            </div>
          )}

          {/* Speaking Indicator */}
          {isSpeaking && (
            <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3 mb-2">
              <div className="flex gap-1 items-end h-4">
                <div className="w-1 bg-purple-500 rounded-full animate-bounce" style={{ height: '8px', animationDelay: '0ms' }} />
                <div className="w-1 bg-purple-500 rounded-full animate-bounce" style={{ height: '14px', animationDelay: '150ms' }} />
                <div className="w-1 bg-purple-500 rounded-full animate-bounce" style={{ height: '10px', animationDelay: '300ms' }} />
                <div className="w-1 bg-purple-500 rounded-full animate-bounce" style={{ height: '16px', animationDelay: '100ms' }} />
                <div className="w-1 bg-purple-500 rounded-full animate-bounce" style={{ height: '6px', animationDelay: '250ms' }} />
              </div>
              <span className="text-sm font-medium text-purple-700">Pengu is speaking...</span>
              <button onClick={stopSpeaking} className="ml-auto text-xs text-purple-500 hover:text-purple-700 font-medium">
                Stop
              </button>
            </div>
          )}

          {/* Pending Attachment Preview */}
          {pendingAttachment && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2 mb-2">
              {pendingAttachment.type === 'image' ? (
                <>
                  <img src={pendingAttachment.url} alt="Uploaded" className="w-12 h-12 object-cover rounded-lg" />
                  <span className="text-sm text-blue-700 flex-1 truncate">{pendingAttachment.name}</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-blue-700 flex-1 truncate">{pendingAttachment.name}</span>
                </>
              )}
              <button
                onClick={() => setPendingAttachment(null)}
                className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                title="Remove attachment"
              >
                <X className="w-4 h-4 text-blue-500" />
              </button>
            </div>
          )}

          <div className="relative flex items-end gap-2 bg-white border border-gray-300 rounded-3xl shadow-sm hover:shadow-md transition-shadow px-4 py-2">
            {/* Attachment Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*,.txt,.csv,.md"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              title="Attach PDF, Image, or Text file"
            >
              <Paperclip className="w-5 h-5 text-gray-500" />
            </button>

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Message Pengu..."
              disabled={isLoading}
              className="flex-1 bg-transparent resize-none outline-none text-gray-900 placeholder:text-gray-400 disabled:opacity-50 py-2 max-h-[200px]"
              rows={1}
            />

            {/* Voice Mode Toggle */}
            <button
              type="button"
              onClick={toggleVoiceMode}
              className={`flex-shrink-0 p-2 rounded-lg transition-all ${voiceMode
                ? 'bg-purple-100 text-purple-600 ring-2 ring-purple-300'
                : 'hover:bg-gray-100 text-gray-500'
                }`}
              title={voiceMode ? "Turn off Walk & Study mode" : "Turn on Walk & Study mode (Pengu speaks responses)"}
            >
              <Headphones className="w-5 h-5" />
            </button>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isLoading}
              className={`flex-shrink-0 p-2 rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-transparent ${isRecording
                ? 'bg-red-100 ring-2 ring-red-400 animate-pulse'
                : voiceMode
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-600'
                  : 'hover:bg-gray-100'
                }`}
              title={isRecording ? "Stop Recording" : voiceMode ? "Speak to Pengu" : "Voice Input"}
            >
              <Mic className={`w-5 h-5 ${isRecording ? 'text-red-600' : voiceMode ? 'text-purple-600' : 'text-gray-500'}`} />
            </button>

            {/* Speaking Stop Button */}
            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="flex-shrink-0 p-2 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors ring-2 ring-orange-300 animate-pulse"
                title="Stop Pengu from speaking"
              >
                <VolumeX className="w-5 h-5 text-orange-600" />
              </button>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!input.trim() && !pendingAttachment) || isLoading}
              className="flex-shrink-0 p-2 bg-[#462D28] hover:bg-[#5a3a34] disabled:bg-gray-200 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-3">
            Pengu can make mistakes. Check important info.
          </p>
        </form>
      </div>

      {/* Quick Guide Modal */}
      <QuickGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}

function EmptyState({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
  const suggestions = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Summarize Documents",
      description: "Upload PDFs and get instant summaries",
      prompt: "Please summarize the key points from this PDF"
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "YouTube to Notes",
      description: "Convert video lectures to study materials",
      prompt: "Help me create study notes from this YouTube video"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Generate Flashcards",
      description: "Create quiz cards from any topic",
      prompt: "Create flashcards about photosynthesis"
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: "Mind Map Ideas",
      description: "Visualize complex concepts",
      prompt: "Create a mind map for the water cycle"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-6 sm:py-8 md:py-12">
      {/* Logo with improved branding */}
      <div className="mb-6 sm:mb-8 md:mb-10">
        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-[#462D28] flex items-center justify-center shadow-lg">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-white shadow-inner flex items-center justify-center">
              <img src={penguLogo} alt="Pengu AI" className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover" />
            </div>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-6 h-6 sm:w-7 sm:h-7 bg-[#462D28] rounded-full flex items-center justify-center shadow-md">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Welcome Text */}
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#462D28] mb-2 text-center px-4">
        How can I help you study today?
      </h2>
      <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-6 sm:mb-8 md:mb-10 max-w-md text-center px-4">
        Ask me anything, upload files, or try one of these suggestions
      </p>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-3xl w-full">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(suggestion.prompt)}
            className="group text-left p-4 sm:p-5 bg-white border border-gray-200 rounded-xl sm:rounded-2xl hover:bg-[#F5F2F1] hover:border-[#462D28] transition-all hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 sm:p-2 bg-[#462D28]/10 text-[#462D28] rounded-lg group-hover:bg-[#462D28] group-hover:text-white transition-colors flex-shrink-0">
                {suggestion.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-xs sm:text-sm text-[#462D28] mb-0.5 sm:mb-1">
                  {suggestion.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {suggestion.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  openCanvas,
  isLatest
}: {
  message: any;
  openCanvas: (content: string, type: "text" | "flashcards" | "mindmap") => void;
  isLatest: boolean;
}) {
  const isUser = message.role === "user";
  // Strip [GENERATED_IMAGE:url] and old ![Generated Image](url) from text content
  // before passing to ReactMarkdown — these are rendered via ImageOutput, not markdown.
  const rawContent = getMessageContent(message);
  const isImageMessage = !!(message as any).imageUrl;
  const content = isImageMessage
    ? rawContent.replace(/^\[GENERATED_IMAGE:[^\]]+\]$/, '').replace(/!\[Generated Image\]\([^)]+\)/g, '').trim()
    : rawContent.replace(/!\[Generated Image\]\([^)]+\)/g, '').trim();

  return (
    <div className={`w-full py-6 md:py-8 ${isUser ? 'bg-white' : 'bg-gray-50'}`}>
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className={`flex gap-3 md:gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isUser ? (
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#462D28] flex items-center justify-center">
                <span className="text-white text-sm font-semibold">U</span>
              </div>
            ) : (
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#462D28]/10 flex items-center justify-center">
                <img src={penguLogo} alt="Pengu" className="w-5 h-5 md:w-6 md:h-6 rounded-full" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className={`flex-1 min-w-0 space-y-3 ${isUser ? 'flex flex-col items-end' : ''}`}>
            {isUser ? (() => {
              // Check if user message contains a Cloudinary image URL
              const cloudinaryMatch = content.match(/(https?:\/\/res\.cloudinary\.com[^\s]+\.(?:jpg|jpeg|png|gif|webp))/i);
              if (cloudinaryMatch) {
                const imageUrl = cloudinaryMatch[1];
                const textPart = content.replace(imageUrl, '').replace(/Image:\s*/i, '').trim();
                return (
                  <div className="inline-block max-w-[85%] bg-[#F5F2F1] rounded-2xl px-4 py-3 space-y-2">
                    {textPart && (
                      <p className="text-gray-900 whitespace-pre-wrap leading-relaxed m-0">{textPart}</p>
                    )}
                    <img
                      src={imageUrl}
                      alt="Uploaded"
                      className="rounded-xl max-h-64 w-auto object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                );
              }
              return (
                <div className="inline-block max-w-[85%] bg-[#F5F2F1] rounded-2xl px-4 py-3">
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed m-0">
                    {content}
                  </p>
                </div>
              );
            })() : (
              <>
                <div className="prose prose-sm md:prose-base max-w-none prose-p:leading-relaxed text-gray-900 prose-pre:bg-[#F5F2F1] prose-pre:text-gray-900 prose-code:text-[#462D28] prose-code:bg-[#F5F2F1] prose-code:px-1 prose-code:rounded">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        const isMermaid = match && match[1] === "mermaid";
                        if (!inline && isMermaid) {
                          return <Mermaid chart={String(children).replace(/\n$/, "")} />;
                        }
                        return !inline ? (
                          <pre className={className} {...props}>
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                      img({ src, alt, ...props }: any) {
                        // If we have an imageUrl property, we'll render ImageOutput directly below,
                        // so we should hide markdown images to prevent duplicates.
                        if (message.imageUrl === src) return null;

                        // Render generated images from ![alt](url) markdown
                        return (
                          <div className="my-3">
                            <img
                              src={src}
                              alt={alt || "Generated Image"}
                              className="rounded-xl max-w-full max-h-80 object-contain shadow-md border border-gray-200"
                              loading="lazy"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            {alt && alt !== "Generated Image" && (
                              <p className="text-xs text-gray-500 mt-1 italic">{alt}</p>
                            )}
                          </div>
                        );
                      }
                    }}
                  >
                    {content.replace(/\[GENERATED_IMAGE:(https?:\/\/[^\]]+)\]/g, '').trim() || ' '}
                  </ReactMarkdown>
                </div>
                {/* If this is a reloaded image message, render ImageOutput directly */}
                {isImageMessage && (message as any).imageUrl ? (
                  <ImageOutput
                    status="finished"
                    url={(message as any).imageUrl}
                    prompt={(message as any).toolInvocations?.[0]?.args?.prompt}
                  />
                ) : null}



              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Mock functions removed, using real Vercel AI useChat stream ---

function generateFlashcards(content: string): string {
  const cards: { front: string; back: string }[] = [];

  // Strategy 1: Extract from markdown headers + following content
  const headerBlocks = content.split(/\n(?=#{1,3}\s)/);
  for (const block of headerBlocks) {
    const headerMatch = block.match(/^#{1,3}\s+(.+)/);
    if (headerMatch) {
      const question = headerMatch[1].replace(/[*_`]/g, '').trim();
      const body = block.replace(/^#{1,3}\s+.+\n?/, '').trim();
      if (body && body.length > 10 && question.length > 3) {
        cards.push({
          front: question.endsWith('?') ? question : `What is ${question}?`,
          back: body.split('\n').slice(0, 3).join(' ').replace(/[*_`#-]/g, '').trim().substring(0, 200)
        });
      }
    }
  }

  // Strategy 2: Extract from bold terms + following text  
  const boldMatches = content.matchAll(/\*\*(.+?)\*\*[:\s]+([^*\n]+)/g);
  for (const match of boldMatches) {
    const term = match[1].trim();
    const def = match[2].trim();
    if (term.length > 2 && def.length > 10 && cards.length < 12) {
      const exists = cards.some(c => c.front.includes(term));
      if (!exists) {
        cards.push({
          front: `Define: ${term}`,
          back: def.substring(0, 200)
        });
      }
    }
  }

  // Strategy 3: Extract from numbered/bullet lists
  const listItems = content.match(/(?:^|\n)\s*(?:\d+[.)]\s|\-\s|\*\s)(.+)/g);
  if (listItems && cards.length < 6) {
    for (let i = 0; i < listItems.length && cards.length < 10; i += 2) {
      const item = listItems[i].replace(/^\s*(?:\d+[.)]\s|\-\s|\*\s)/, '').replace(/[*_`]/g, '').trim();
      if (item.length > 15) {
        cards.push({
          front: `Explain: ${item.substring(0, 80)}${item.length > 80 ? '...' : ''}`,
          back: item
        });
      }
    }
  }

  // Fallback: Split content into chunks if we got too few cards
  if (cards.length < 3) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    for (let i = 0; i < Math.min(sentences.length, 5); i++) {
      const sentence = sentences[i].replace(/[*_`#\-]/g, '').trim();
      cards.push({
        front: `What does this mean?\n"${sentence.substring(0, 100)}..."`,
        back: sentence.substring(0, 200)
      });
    }
  }

  return JSON.stringify(cards.slice(0, 12));
}
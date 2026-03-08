import { useState, useRef, useEffect, useMemo } from "react";
// Force Vite HMR reload
import { Send, Mic, Paperclip, ChevronDown, Sparkles, Zap, Loader2, Square, FileText, MessageSquare, Brain, X } from "lucide-react";
import { useChat, UIMessage as Message } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { GuestHeader } from "./GuestHeader";
import { QuickGuide } from "./QuickGuide";
import { Mermaid } from "./Mermaid";
import { API_BASE_URL } from "../../config";
import { useToast } from "./ToastContext";
import { ImageOutput } from "./ImageOutput";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import penguLogo from "@/assets/f5ab8b8d79f0bc497ec9b77eb6c002de4b5b855f.png";
import { getMessageContent } from "./ChatInterface";
import { extractPDFText } from "./FileUploadHandler";

interface GuestChatProps {
  onLogin: () => void;
  onSignup: () => void;
  onLearnMore: () => void;
}

const MAX_GUEST_MESSAGES = 10; // 5 user messages, 5 AI responses

// Detects whether the user is asking for image generation
const IMAGE_GEN_REGEX = /\b(generate|create|draw|make|paint|render|show me|give me)\b.*\b(image|picture|photo|illustration|drawing|art|artwork|portrait|landscape|scene|wallpaper|sketch|graphic)\b/i;
const isImageGenRequest = (text: string) =>
  IMAGE_GEN_REGEX.test(text) &&
  !(/\b(analyze|analyse|describe|explain|look at|what is|what's in|tell me about|details|identify|scan|read|show me what is in)\b/i.test(text));

// A synthetic message used to track live image generation state
export interface ImageGenMessage {
  id: string;
  role: 'assistant';
  isImageGen: true;
  status: 'loading' | 'finished' | 'error';
  prompt: string;
  url?: string;
  errorMessage?: string;
}

export function GuestChat({ onLogin, onSignup, onLearnMore }: GuestChatProps) {
  const { showToast } = useToast();
  // We use a stable, unique guest ID for this session so the server knows it's a guest
  const [guestId] = useState(`guest-${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`);

  const [selectedModel, setSelectedModel] = useState<"basic" | "deep">("basic");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extra state to hold the fallback message that isn't handled by the AI stream
  const [fallbackMessages, setFallbackMessages] = useState<Message[]>([]);
  // State for live image generation messages (loading/finished/error cards)
  const [imageGenMessages, setImageGenMessages] = useState<ImageGenMessage[]>([]);
  // User text that was sent via image gen path (not through useChat stream)
  const [pendingUserMessages, setPendingUserMessages] = useState<Array<{ id: string, content: string }>>([]);

  const [input, setInput] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<{ type: 'image' | 'pdf' | 'text', url?: string, name: string, content?: string } | null>(null);

  const {
    messages: aiMessages,
    status,
    sendMessage,
    stop
  } = useChat({
    id: guestId,
    transport: new DefaultChatTransport({
      api: `${API_BASE_URL}/api/chat`,
      body: {
        userId: guestId,
        model: selectedModel
      }
    }),
    onError: (error) => {
      console.error(error);
      showToast("Failed to connect to AI server", "error");
    }
  });

  // Combine and sort messages for display
  const displayMessages = useMemo(() => {
    const allChatMessages = [...aiMessages, ...fallbackMessages];
    const allMessagesWithPendingUser = [...allChatMessages, ...pendingUserMessages.map(pm => ({
      id: pm.id,
      role: 'user',
      parts: [{ type: 'text', text: pm.content }]
    }))];

    // Sort logic: use timestamp suffix for synthetic IDs, and createdAt for DB messages
    const getTimestamp = (m: any) => {
      if (m.createdAt) return new Date(m.createdAt).getTime();
      const parts = m.id.split('-');
      const ts = parseInt(parts[parts.length - 1]);
      return isNaN(ts) ? 0 : ts;
    };

    const combined = [...allMessagesWithPendingUser, ...imageGenMessages.map(img => ({
      ...img,
      isImageGen: true
    }))];

    return combined.sort((a, b) => {
      const timeA = getTimestamp(a);
      const timeB = getTimestamp(b);
      if (timeA !== timeB) return timeA - timeB;
      // If same time, User comes first
      return a.role === 'user' ? -1 : 1;
    });
  }, [aiMessages, fallbackMessages, pendingUserMessages, imageGenMessages]);

  const allMessages = displayMessages; // Restore reference for limit checks logic below

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const isProcessing = status === 'streaming' || status === 'submitted';

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input?.trim() && !pendingAttachment) || isProcessing) return;

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

    // ── Image Generation: bypass the AI stream for guests too ─────────
    if (isImageGenRequest(messageText) && !pendingAttachment) {
      // Check limits first
      if (aiMessages.length >= MAX_GUEST_MESSAGES - 1) {
        setShowLimitModal(true);
        return;
      }

      const timestamp = Date.now();
      const genId = `imggen-${timestamp}`;
      const userMsgId = `user-${timestamp}`;

      setPendingUserMessages(prev => [...prev, { id: userMsgId, content: messageText }]);
      setImageGenMessages(prev => [...prev, {
        id: genId,
        role: 'assistant',
        isImageGen: true,
        status: 'loading',
        prompt: messageText,
      }]);

      setInput('');
      fetch(`${API_BASE_URL}/api/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: messageText, userId: guestId, userMessage: messageText }),
      })
        .then(r => r.json())
        .then(data => {
          if (data?.url) {
            setImageGenMessages(prev => prev.map(m =>
              m.id === genId ? { ...m, status: 'finished', url: data.url } : m
            ));
          } else {
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

      return;
    }

    // Check if we reached the absolute limit for normal messages
    if (aiMessages.length >= MAX_GUEST_MESSAGES - 1) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        parts: [{ type: "text", text: input }]
      } as any;

      const aiFallback: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        parts: [{ type: "text", text: `Great question! This is a sample response to: "${input}"\n\nSign up to access:\n• Full AI-powered responses\n• PDF upload and analysis\n• YouTube transcript extraction\n• Interactive flashcards\n• Mind map generation\n• Unlimited conversations\n\nClick "Sign up for free" to unlock all features!` }]
      } as any;

      setFallbackMessages(prev => [...prev, userMessage, aiFallback]);
      setInput('');
      setShowLimitModal(true);
      return;
    }

    // Call the Vercel AI hook directly to hit the backend
    setInput('');
    sendMessage({ text: messageText });

    // Show warning when 2 messages remaining (meaning length is 6, max is 10)
    if (aiMessages.length === MAX_GUEST_MESSAGES - 4) {
      showToast(`2 messages remaining. Sign up to continue!`, "info");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
        // Upload image to Cloudinary first
        const formData = new FormData();
        formData.append("file", file);

        showToast("Uploading image...", "info");
        const response = await fetch(`${API_BASE_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();

        // Stage the image
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

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <GuestHeader onLogin={onLogin} onSignup={onSignup} onHelp={() => setShowGuide(true)} />

      {/* Disclaimer Banner */}
      <div className="bg-gray-900 text-white px-4 py-2 text-center text-[10px] sm:text-xs">
        <p className="max-w-xl mx-auto opacity-90 leading-tight">
          By messaging Pengu AI, you agree to our Terms and Privacy Policy.
          Chats may be reviewed. {" "}
          <button onClick={onLearnMore} className="underline hover:text-gray-300 font-medium">Learn more</button>
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {displayMessages.length === 0 ? (
          <EmptyState onSelectPrompt={(prompt) => {
            handleInputChange({ target: { value: prompt } } as any);
            // Small delay to allow state update
            setTimeout(() => {
              // Fake synthetic event to submit immediately
              handleSendMessage();
            }, 50);
          }} />
        ) : (
          <div className="w-full">
            {displayMessages.map((message) => {
              // Handle synthetic ImageGenMessages
              if ((message as any).isImageGen) {
                const imgMsg = message as unknown as ImageGenMessage;
                return (
                  <div key={imgMsg.id} className="w-full border-b border-gray-100 py-6 md:py-8 bg-gray-50">
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
                );
              }
              // Normal message bubbles
              return <MessageBubble key={message.id} message={message} />;
            })}
            {isProcessing && (
              displayMessages.length === 0 ||
              displayMessages[displayMessages.length - 1]?.role === "user" ||
              (displayMessages[displayMessages.length - 1]?.role === "assistant" && !getMessageContent(displayMessages[displayMessages.length - 1]))
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

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-6">
          {isProcessing && (
            <div className="mb-3 flex justify-center">
              <button
                onClick={() => stop()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Square className="w-3.5 h-3.5" fill="currentColor" />
                Stop generating
              </button>
            </div>
          )}

          {/* Message Count Indicator */}
          <div className="mb-2 text-center text-xs text-gray-500">
            {Math.min(Math.ceil(allMessages.length / 2), 5)} of 5 messages used
          </div>

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
              disabled={isProcessing || allMessages.length >= MAX_GUEST_MESSAGES}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              title="Attach PDF, Image, or Text file"
            >
              <Paperclip className="w-5 h-5 text-gray-500" />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Message Pengu..."
              disabled={isProcessing || allMessages.length >= MAX_GUEST_MESSAGES}
              className="flex-1 bg-transparent resize-none outline-none text-gray-900 placeholder:text-gray-400 disabled:opacity-50 py-2 max-h-[200px]"
              rows={1}
            />

            <button
              className="flex-shrink-0 p-2 text-gray-400 cursor-not-allowed"
              title="Sign up for voice input"
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              onClick={handleSendMessage}
              disabled={(!input?.trim() && !pendingAttachment) || isProcessing || allMessages.length >= MAX_GUEST_MESSAGES}
              className="flex-shrink-0 p-2 bg-[#462D28] hover:bg-[#5a3a34] disabled:bg-gray-200 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-3">
            Pengu can make mistakes. Check important info.
          </p>
        </div>
      </div>

      {/* Limit Reached Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#462D28] mx-auto mb-4 flex items-center justify-center">
                <img src={penguLogo} alt="Pengu" className="w-14 h-14 rounded-full" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Message Limit Reached
              </h3>
              <p className="text-gray-600">
                You've used all 5 free messages. Sign up to continue chatting and unlock all features!
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={onSignup}
                className="w-full py-3 bg-[#462D28] text-white rounded-lg hover:bg-[#5a3a34] transition-colors font-medium"
              >
                Sign up for free
              </button>
              <button
                onClick={onLogin}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Log in
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Guide Modal */}
      <QuickGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}

function EmptyState({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
  const suggestions = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Study Help",
      description: "Ask questions about any topic",
      prompt: "Explain photosynthesis in simple terms"
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Quick Answers",
      description: "Get instant explanations",
      prompt: "What is the Pythagorean theorem?"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Practice Questions",
      description: "Test your knowledge",
      prompt: "Give me 5 practice questions about World War 2"
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: "Concept Review",
      description: "Break down complex ideas",
      prompt: "Explain quantum mechanics to a beginner"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 py-4 sm:py-8 md:py-12">
      <div className="mb-4 sm:mb-8 scale-90 sm:scale-100">
        <div className="relative">
          <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-[#462D28] flex items-center justify-center shadow-lg">
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-white shadow-inner flex items-center justify-center">
              <img src={penguLogo} alt="Pengu AI" className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover" />
            </div>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 sm:w-6 sm:h-6 bg-[#462D28] rounded-full flex items-center justify-center shadow-md">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
        </div>
      </div>

      <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-[#462D28] mb-1.5 text-center px-4 leading-tight">
        What can I help you study?
      </h2>
      <p className="text-[10px] sm:text-sm text-gray-600 mb-6 max-w-sm text-center px-4">
        Try Pengu AI for free - no account needed
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-4 max-w-3xl w-full">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(suggestion.prompt)}
            className="group text-left p-3 sm:p-5 bg-white border border-gray-200 rounded-xl sm:rounded-2xl hover:bg-[#F5F2F1] hover:border-[#462D28] transition-all hover:shadow-md"
          >
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-[#462D28]/10 text-[#462D28] rounded-lg group-hover:bg-[#462D28] group-hover:text-white transition-colors flex-shrink-0">
                {suggestion.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[11px] sm:text-sm text-[#462D28] mb-0.5 sm:mb-1">
                  {suggestion.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed line-clamp-2">
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

function MessageBubble({ message }: { message: Message | any }) {
  const isUser = message.role === "user";

  return (
    <div className={`w-full py-6 md:py-8 ${isUser ? 'bg-white' : 'bg-gray-50'}`}>
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className={`flex gap-3 md:gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
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

          <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
            {isUser ? (
              <div className="inline-block max-w-[85%] bg-[#F5F2F1] rounded-2xl px-4 py-3">
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed m-0">
                  {getMessageContent(message)}
                </p>
              </div>
            ) : (
              <div className="prose prose-sm md:prose-base max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-pre:rounded-lg">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {getMessageContent(message)}
                </ReactMarkdown>

                {/* Enhanced Image Output for generateImage tool */}
                {[...(message.toolInvocations || []), ...(message.parts?.filter((p: any) => p.type?.startsWith('tool-')).map((p: any) => ({
                  ...p,
                  toolName: p.toolName || p.type.replace('tool-', ''),
                  state: p.state === 'output-available' ? 'result' : p.state,
                  result: p.output || p.result,
                  args: p.input || p.args
                })) || [])].map((invocation: any) => {
                  if (invocation.toolName === 'generateImage') {
                    // More robust status detection
                    const isFinished = invocation.state === 'result' || !!invocation.result || !!invocation.output;
                    const isLoading = invocation.state === 'call' || invocation.state === 'partial-call' || (!invocation.result && !invocation.output && !invocation.error);
                    const status = isFinished ? 'finished' : isLoading ? 'loading' : 'error';

                    let url = '';
                    if (isFinished) {
                      const finalResult = invocation.result || invocation.output;
                      if (typeof finalResult === 'string') {
                        url = finalResult.match(/\((https?:\/\/res\.cloudinary\.com[^\s]+\.(?:jpg|jpeg|png|gif|webp))\)/i)?.[1] || '';
                      } else if (finalResult?.url) {
                        url = finalResult.url;
                      }
                    }
                    const prompt = invocation.args?.prompt || invocation.result?.prompt || invocation.output?.prompt;

                    return (
                      <ImageOutput
                        key={invocation.toolCallId || Math.random().toString()}
                        status={status as any}
                        url={url}
                        prompt={prompt}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


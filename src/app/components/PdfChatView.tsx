import { useState, useRef, useEffect } from "react";
import { Upload, FileText, Loader2, Send, BookOpen, Bot, Trash2 } from "lucide-react";
import { useChatContext } from "./ChatContext";
import { useChat, UIMessage as Message } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { API_BASE_URL } from '../../config';

export function PdfChatView() {
    const { currentChat, user, updateChatId } = useChatContext();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [pineconeId, setPineconeId] = useState<string | null>(currentChat?.pineconeAssistantId || null);

    // Auto-update local state if we swap to another chat history that already has a pinecone ID
    useEffect(() => {
        setPineconeId(currentChat?.pineconeAssistantId || null);
    }, [currentChat?.pineconeAssistantId, currentChat?.id]);

    const [input, setInput] = useState("");

    const { messages, status, append: sendMessage } = useChat({
        id: currentChat?.id || "pdf-chat",
        messages: currentChat?.messages as any,
        transport: new DefaultChatTransport({
            api: `${API_BASE_URL}/api/chat`,
            body: {
                userId: user?.id,
                sessionId: currentChat?.id,
                pineconeAssistantId: pineconeId,
                model: "google"
            }
        })
    });

    const isLoading = status === 'streaming' || status === 'submitted';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        sendMessage({
            role: 'user',
            content: input
        });

        setInput("");
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleInitialize = async () => {
        if (!file || !user) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append("userId", user?.id || "");
        if (currentChat?.id) formData.append('sessionId', currentChat.id);

        try {
            const res = await fetch(`${API_BASE_URL}/api/upload-pdf`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();

            // The backend successfully vectorized everything!
            setPineconeId(data.assistantId);
            if (data.sessionId && data.sessionId !== currentChat?.id) {
                updateChatId(currentChat?.id || '', data.sessionId);
                // The ChatContext will re-fetch or reload with the new ID and Pinecone Assistant
            }
        } catch (error) {
            console.error(error);
            alert("Failed to process the PDF. Please ensure backend is running and valid API keys are set.");
        } finally {
            setIsUploading(false);
        }
    };

    // If the PDF hasn't been uploaded and processed yet, show the Dropzone
    if (!pineconeId) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-orange-50/30 p-8">
                <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm border border-orange-100 p-8 text-center">
                    <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">PDF Textbook Chat</h2>
                    <p className="text-gray-500 mb-8">
                        Upload a massive textbook or document. Our Pinecone Vector Database will automatically chunk, index, and retrieve only the relevant paragraphs for Gemini so you never hit a token limit.
                    </p>

                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 mb-6 hover:bg-gray-50 transition-colors">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="pdf-upload"
                        />
                        <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                            <Upload className="w-8 h-8 text-gray-400 mb-3" />
                            {file ? (
                                <span className="text-emerald-600 font-medium">{file.name}</span>
                            ) : (
                                <span><span className="text-orange-600 font-medium">Click to upload</span> or drag and drop</span>
                            )}
                            <span className="text-gray-400 text-sm mt-1">PDF up to 100MB</span>
                        </label>
                    </div>

                    <button
                        onClick={handleInitialize}
                        disabled={!file || isUploading}
                        className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex justify-center items-center gap-2 shadow-sm"
                    >
                        {isUploading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Vectorizing Document...</>
                        ) : (
                            <><FileText className="w-5 h-5" /> Initialize Knowledge Base</>
                        )}
                    </button>
                    {isUploading && (
                        <p className="text-sm text-gray-500 mt-4 animate-pulse">This may take a minute or two depending on the size of the book!</p>
                    )}
                </div>
            </div>
        );
    }

    // If processed, render the Vercel AI Chat interface!
    return (
        <div className="flex flex-col h-full bg-white">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-white sticky top-0 z-10">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center border border-orange-200">
                    <BookOpen className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">PDF Textbook Chat</h2>
                    <p className="text-xs text-emerald-600 tracking-wide font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        PINECONE INDEX: ACTIVE
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 m-auto">
                        <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4 border border-orange-100">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 text-center">Your Document is Ready!</h3>
                        <p className="text-gray-500 text-center max-w-sm">
                            Ask any specific questions, and I'll find the exact paragraphs from the text to answer you.
                        </p>
                    </div>
                )}
                {messages.map((m: any) => {
                    const textContent = typeof m.content === 'string' ? m.content : Array.isArray(m.parts) ? m.parts.map((p: any) => p.text).join(' ') : m.content?.text || '';
                    return (
                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] md:max-w-3xl rounded-2xl p-4 ${m.role === 'user' ? 'bg-[#462D28] text-white rounded-br-none' : 'bg-gray-50 border border-gray-200 rounded-tl-none'
                                }`}>
                                <div className={`prose max-w-none ${m.role === 'user' ? 'prose-invert' : ''}`}>
                                    <ReactMarkdown>
                                        {textContent}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {isLoading && (
                    <div className="flex items-center gap-2 text-gray-500 p-4 bg-gray-50 rounded-2xl rounded-tl-none w-fit">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                        <span className="text-sm font-medium">Retrieving Context...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
                    <input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask a question about the textbook..."
                        className="w-full py-4 pl-6 pr-14 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 focus:bg-white transition-all outline-none"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-full transition-colors disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}

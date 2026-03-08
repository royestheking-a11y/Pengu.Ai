import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_BASE_URL } from '../../config';

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  parts: any[];
  toolInvocations?: any[];
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  sessionType?: "general_chat" | "study_prep" | "job_prep" | "pdf_chat";
  pineconeAssistantId?: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

interface ChatContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | null;
  user: User | null;
  isAuthenticated: boolean;
  createNewChat: (sessionType?: "general_chat" | "study_prep" | "job_prep" | "pdf_chat") => void;
  selectChat: (chatId: string) => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  deleteChat: (chatId: string) => void;
  login: (email: string, name: string, id: string) => void;
  logout: () => void;
  updateChatId: (oldId: string, newId: string) => void;
  setChatMessages: (chatId: string, messages: Message[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load chats on mount or auth change
  useEffect(() => {
    const savedUser = localStorage.getItem("pengu-user");
    let currentUser = user;

    if (!currentUser && savedUser) {
      currentUser = JSON.parse(savedUser);
      setUser(currentUser);
      setIsAuthenticated(true);
    }

    const fetchChats = async () => {
      if (currentUser?.id) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/chat/history?userId=${currentUser.id}`);
          if (res.ok) {
            const history = await res.json();

            // Map MongoDB models to frontend Chat interfaces
            // IMPORTANT: We strip tool invocation parts from historical messages because
            // the AI SDK's useChat hook strictly validates that every tool-call has a paired
            // tool-result in history. Since our MongoDB stores tool results loosely, the
            // safest approach is to keep only the text content (which already contains
            // the tool output like "![Generated Image](url)").
            const mappedChats: Chat[] = history.map((session: any) => ({
              id: session._id,
              title: session.title || 'New Chat',
              sessionType: session.sessionType || 'general_chat',
              messages: (session.messages || []).map((msg: any, index: number) => {
                // Force content to string — MongoDB may store as array, object, null
                let textContent = ' ';
                if (typeof msg.content === 'string' && msg.content.trim()) {
                  textContent = msg.content;
                } else if (Array.isArray(msg.content)) {
                  textContent = msg.content
                    .filter((p: any) => p && (p.type === 'text' || typeof p === 'string'))
                    .map((p: any) => (typeof p === 'string' ? p : p.text || ''))
                    .join(' ').trim() || ' ';
                } else if (msg.content && typeof msg.content === 'object' && msg.content.text) {
                  textContent = String(msg.content.text);
                }

                // Detect image URL from two possible formats:
                // 1. New format:  [GENERATED_IMAGE:https://...]
                // 2. Old format:  ![Generated Image](https://...)
                const newFormatMatch = textContent.match(/^\[GENERATED_IMAGE:(https?:\/\/[^\]]+)\]$/);
                const oldFormatMatch = textContent.match(/!\[Generated Image\]\((https?:\/\/[^)]+)\)/);
                const imageUrl = newFormatMatch?.[1] || oldFormatMatch?.[1] || null;

                // For image messages, toolInvocations must be clean so ImageOutput
                // renders correctly — never restore raw MongoDB toolInvocations.
                const restoredToolInvocations = imageUrl
                  ? [{
                    state: 'result',
                    toolCallId: `restored-${session._id}-${index}`,
                    toolName: 'generateImage',
                    args: { prompt: '' },
                    result: { url: imageUrl, success: true }
                  }]
                  : [];

                return {
                  id: msg.id || msg._id || `${session._id}-msg-${index}`,
                  role: (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') ? msg.role : 'assistant',
                  content: textContent,
                  // imageUrl flag — MessageBubble checks this to render ImageOutput instead of markdown
                  imageUrl: imageUrl || undefined,
                  parts: [{ type: 'text' as const, text: textContent }],
                  toolInvocations: restoredToolInvocations,
                  timestamp: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now()
                };
              }),
              createdAt: new Date(session.createdAt).getTime(),
              updatedAt: new Date(session.updatedAt).getTime()
            }));

            if (mappedChats.length > 0) {
              setChats(mappedChats);
              setCurrentChatId(mappedChats[0].id);
              return;
            }
          }
        } catch (error) {
          console.error("Failed to fetch chat history:", error);
        }
      }

      // Default state if no user or empty history
      const initialChat: Chat = {
        id: generateId(),
        title: "New Chat",
        sessionType: "general_chat",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setChats([initialChat]);
      setCurrentChatId(initialChat.id);
    };

    fetchChats();
  }, [isAuthenticated, user?.id]);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("pengu-chats", JSON.stringify(chats));
    }
  }, [chats]);

  // Save current chat ID
  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem("pengu-current-chat-id", currentChatId);
    }
  }, [currentChatId]);

  const currentChat = chats.find(c => c.id === currentChatId) || null;

  const createNewChat = (sessionType: "general_chat" | "study_prep" | "job_prep" | "pdf_chat" = "general_chat") => {
    const newChat: Chat = {
      id: Date.now().toString(), // temporary ID until synced with DB
      title: sessionType === "job_prep" ? "Job Preparation" : sessionType === "study_prep" ? "Study Preparation" : sessionType === "pdf_chat" ? "PDF Chat" : "New Chat",
      sessionType,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
    if (!currentChatId) return;

    const newMessage: Message = {
      ...message,
      id: generateId(),
      timestamp: Date.now(),
      parts: message.parts || [{ type: 'text', text: message.content }]
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        const updatedMessages = [...chat.messages, newMessage];
        // Auto-generate title from first user message
        const title = chat.messages.length === 0 && message.role === "user"
          ? message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "")
          : chat.title;

        return {
          ...chat,
          messages: updatedMessages,
          title,
          updatedAt: Date.now(),
        };
      }
      return chat;
    }));
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => {
      const filtered = prev.filter(c => c.id !== chatId);
      if (filtered.length === 0) {
        // If no chats left, create a new one
        const newChat: Chat = {
          id: generateId(),
          title: "New Chat",
          sessionType: "general_chat",
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setCurrentChatId(newChat.id);
        return [newChat];
      }
      if (chatId === currentChatId) {
        setCurrentChatId(filtered[0].id);
      }
      return filtered;
    });
  };

  const login = (email: string, name: string, id: string) => {
    const newUser: User = {
      id,
      email,
      name,
    };
    // Force a clean state before registering the new user, this will trigger the useEffect
    // which makes the fetch() to MongoDB for the *real* chat array of this user
    setChats([]);
    setCurrentChatId(null);
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem("pengu-user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setChats([]); // Force clearing chat state
    setCurrentChatId(null);
    localStorage.removeItem("pengu-user");
    localStorage.removeItem("pengu-chats");
    localStorage.removeItem("pengu-current-chat-id");
  };

  const updateChatId = (oldId: string, newId: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === oldId ? { ...chat, id: newId } : chat
    ));
    if (currentChatId === oldId) {
      setCurrentChatId(newId);
    }
  };

  const setChatMessages = (chatId: string, messages: Message[]) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, messages, updatedAt: Date.now() } : chat
    ));
  };

  return (
    <ChatContext.Provider value={{
      chats,
      currentChatId,
      currentChat,
      user,
      isAuthenticated,
      createNewChat,
      selectChat,
      addMessage,
      deleteChat,
      login,
      logout,
      updateChatId,
      setChatMessages,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
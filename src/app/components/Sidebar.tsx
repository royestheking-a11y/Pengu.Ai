import { useState } from "react";
import { Plus, MessageSquare, Trash2, ChevronDown, ChevronUp, X, BookOpen, Briefcase } from "lucide-react";
import { useChatContext } from "./ChatContext";
import { PomodoroTimer } from "./PomodoroTimer";
import { UserProfileMenu } from "./UserProfileMenu";
import penguLogo from "@/assets/f5ab8b8d79f0bc497ec9b77eb6c002de4b5b855f.png";

interface SidebarProps {
  onCloseMobile?: () => void;
  onNavigate?: (view: "chat" | "settings" | "upgrade" | "personalization") => void;
}

export function Sidebar({ onCloseMobile, onNavigate }: SidebarProps) {
  const { chats, currentChatId, createNewChat, selectChat, deleteChat, user } = useChatContext();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  const getChatsByDate = () => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const today: typeof chats = [];
    const previous7Days: typeof chats = [];
    const older: typeof chats = [];

    chats.forEach(chat => {
      if (chat.updatedAt > oneDayAgo) {
        today.push(chat);
      } else if (chat.updatedAt > sevenDaysAgo) {
        previous7Days.push(chat);
      } else {
        older.push(chat);
      }
    });

    return { today, previous7Days, older };
  };

  const { today, previous7Days, older } = getChatsByDate();

  const handleNewChat = (sessionType: "general_chat" | "study_prep" | "job_prep" | "pdf_chat" = "general_chat") => {
    createNewChat(sessionType);
    onCloseMobile?.();
  };

  const handleSelectChat = (chatId: string) => {
    selectChat(chatId);
    onCloseMobile?.();
  };

  return (
    <div className="w-64 h-full bg-[#462D28] text-white flex flex-col shadow-xl">
      {/* Header with Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Professional Logo with Circles */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1">
                  <img src={penguLogo} alt="Pengu AI" className="w-full h-full rounded-full object-cover" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Pengu AI</h1>
              <p className="text-xs text-white/60">Study Companion</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-2 text-white/60 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => handleNewChat("general_chat")}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors mb-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Chat</span>
        </button>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={() => handleNewChat("study_prep")}
            className="flex flex-col items-center justify-center gap-1 py-2 px-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-100 rounded-lg transition-colors border border-indigo-500/30"
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-medium">Study Prep</span>
          </button>
          <button
            onClick={() => handleNewChat("job_prep")}
            className="flex flex-col items-center justify-center gap-1 py-2 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 rounded-lg transition-colors border border-emerald-500/30"
          >
            <Briefcase className="w-4 h-4" />
            <span className="text-xs font-medium">Job Prep</span>
          </button>
        </div>

        <button
          onClick={() => handleNewChat("pdf_chat")}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-orange-500/20 hover:bg-orange-500/30 text-orange-100 rounded-lg transition-colors border border-orange-500/30"
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-sm font-medium">PDF Textbook Chat</span>
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {today.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-medium text-white/60 px-2 mb-2">Today</h3>
            {today.map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === currentChatId}
                onSelect={() => handleSelectChat(chat.id)}
                onDelete={() => deleteChat(chat.id)}
              />
            ))}
          </div>
        )}

        {previous7Days.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-medium text-white/60 px-2 mb-2">Previous 7 Days</h3>
            {previous7Days.map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === currentChatId}
                onSelect={() => handleSelectChat(chat.id)}
                onDelete={() => deleteChat(chat.id)}
              />
            ))}
          </div>
        )}

        {older.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-medium text-white/60 px-2 mb-2">Older</h3>
            {older.map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === currentChatId}
                onSelect={() => handleSelectChat(chat.id)}
                onDelete={() => deleteChat(chat.id)}
              />
            ))}
          </div>
        )}

        {chats.length === 0 && (
          <div className="text-center text-white/40 text-sm py-8 px-4">
            No chats yet. Start a new conversation!
          </div>
        )}
      </div>

      {/* Focus Timer - Collapsible */}
      <div className="border-t border-white/10">
        <button
          onClick={() => setShowTimer(!showTimer)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors"
        >
          <span className="text-sm font-medium">Focus Timer</span>
          {showTimer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showTimer && (
          <div className="px-4 pb-4">
            <PomodoroTimer />
          </div>
        )}
      </div>

      {/* User Profile Footer */}
      <div className="border-t border-white/10 p-3 relative">
        <div className="w-full flex items-center justify-between gap-3 py-2 px-3 hover:bg-white/10 rounded-lg transition-colors">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 min-w-0 flex-1"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{user?.name || 'User'}</div>
                <div className="text-xs text-white/60 truncate">Free Plan</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => window.location.href = '/upgrade'}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs font-medium transition-colors flex-shrink-0"
          >
            Upgrade
          </button>
        </div>

        {/* Profile Menu */}
        {showProfileMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowProfileMenu(false)}
            />
            <div className="relative z-50">
              <UserProfileMenu
                isOpen={showProfileMenu}
                onClose={() => setShowProfileMenu(false)}
                onNavigate={onNavigate}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChatItem({
  chat,
  isActive,
  onSelect,
  onDelete
}: {
  chat: any;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className={`group relative flex items-center gap-2 py-2 px-3 mb-1 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-white/20' : 'hover:bg-white/10'
        }`}
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <MessageSquare className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm flex-1 truncate">{chat.title}</span>
      {showDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
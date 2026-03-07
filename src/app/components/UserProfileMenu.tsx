import { useState } from "react";
import {
  Sparkles,
  Smile,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  ChevronRight,
  FileEdit,
  FileText,
  Shield,
  Download,
  Zap
} from "lucide-react";
import { useChatContext } from "./ChatContext";

interface UserProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: "chat" | "settings" | "upgrade" | "personalization") => void;
}

export function UserProfileMenu({ isOpen, onClose, onNavigate }: UserProfileMenuProps) {
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const { user, logout } = useChatContext();

  if (!isOpen) return null;

  const handleNavigation = (view: "chat" | "settings" | "upgrade" | "personalization") => {
    if (onNavigate) {
      onNavigate(view);
    }
    onClose();
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      logout();
      onClose();
    }
  };

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-gradient-to-br from-[#462D28] to-[#5a3a34] rounded-xl shadow-2xl overflow-hidden border border-[#5a3a34]">
      {/* User Info Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium text-sm truncate">{user?.name || 'User'}</div>
            <div className="text-white/70 text-xs truncate">{user?.email || '@user'}</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        <button
          onClick={() => handleNavigation("upgrade")}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-left"
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">Upgrade plan</span>
        </button>

        <button
          onClick={() => handleNavigation("personalization")}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-left"
        >
          <Smile className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">Personalization</span>
        </button>

        <button
          onClick={() => handleNavigation("settings")}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-left"
        >
          <SettingsIcon className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">Settings</span>
        </button>

        <div className="border-t border-white/10 my-2" />

        {/* Help with Submenu */}
        <div className="relative">
          <button
            onClick={() => setShowHelpMenu(!showHelpMenu)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/10 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Help</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-white transition-transform ${showHelpMenu ? 'rotate-90' : ''}`} />
          </button>

          {showHelpMenu && (
            <div className="absolute right-full top-0 mr-2 bg-gradient-to-br from-[#462D28] to-[#5a3a34] rounded-xl shadow-2xl overflow-hidden border border-[#5a3a34] min-w-[220px]">
              <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-left">
                <HelpCircle className="w-4 h-4 text-white" />
                <span className="text-white text-sm">Help center</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-left">
                <FileEdit className="w-4 h-4 text-white" />
                <span className="text-white text-sm">Release notes</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-left">
                <FileText className="w-4 h-4 text-white" />
                <span className="text-white text-sm">Terms & policies</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-left">
                <Shield className="w-4 h-4 text-white" />
                <span className="text-white text-sm">Report Bug</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-left">
                <Download className="w-4 h-4 text-white" />
                <span className="text-white text-sm">Download apps</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-left">
                <Zap className="w-4 h-4 text-white" />
                <span className="text-white text-sm">Keyboard shortcuts</span>
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 my-2" />

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/20 transition-colors text-left group"
        >
          <LogOut className="w-4 h-4 text-white group-hover:text-red-300" />
          <span className="text-white text-sm font-medium group-hover:text-red-300">Log out</span>
        </button>
      </div>
    </div>
  );
}
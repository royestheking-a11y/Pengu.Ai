import { X, Trash2, Download, Upload, Keyboard } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "./ToastContext";
import { SHORTCUTS } from "./KeyboardShortcuts";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [geminiKey, setGeminiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const { showToast } = useToast();

  // Load API keys from localStorage on mount
  useEffect(() => {
    const savedGeminiKey = localStorage.getItem("pengu-gemini-api-key") || "";
    const savedGroqKey = localStorage.getItem("pengu-groq-api-key") || "";
    setGeminiKey(savedGeminiKey);
    setGroqKey(savedGroqKey);
  }, [isOpen]);

  // Save API keys to localStorage
  const handleSaveKeys = () => {
    localStorage.setItem("pengu-gemini-api-key", geminiKey);
    localStorage.setItem("pengu-groq-api-key", groqKey);
    showToast("API keys saved successfully!", "success");
  };

  if (!isOpen) return null;

  const handleExportChats = () => {
    const chats = localStorage.getItem("pengu-chats");
    if (chats) {
      const blob = new Blob([chats], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pengu-chats-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Chat history exported successfully!", "success");
    } else {
      showToast("No chat history to export", "warning");
    }
  };

  const handleImportChats = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            JSON.parse(content); // Validate JSON
            localStorage.setItem("pengu-chats", content);
            showToast("Chats imported successfully! Refreshing...", "success");
            setTimeout(() => window.location.reload(), 1500);
          } catch {
            showToast("Invalid backup file format", "error");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClearAllData = () => {
    if (confirm("Are you sure you want to clear all chat history? This cannot be undone.")) {
      localStorage.removeItem("pengu-chats");
      localStorage.removeItem("pengu-current-chat-id");
      showToast("All data cleared. Refreshing...", "info");
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-4 rounded-t-2xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 md:px-6 py-4 space-y-4">
          {/* API Configuration */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-medium text-[#1A1A1A] mb-3">API Configuration</h3>
            <div className="space-y-2">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Gemini API Key</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Enter your API key..."
                  className="w-full px-3 py-2 bg-[#F5F2F1] rounded-lg outline-none focus:ring-2 focus:ring-[#462D28]"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Groq API Key</label>
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="Enter your API key..."
                  className="w-full px-3 py-2 bg-[#F5F2F1] rounded-lg outline-none focus:ring-2 focus:ring-[#462D28]"
                />
              </div>
              <button
                onClick={handleSaveKeys}
                className="w-full px-4 py-2 bg-[#462D28] text-white rounded-lg hover:bg-[#5a3a34] transition-colors mt-2"
              >
                Save API Keys
              </button>
              <p className="text-xs text-gray-500 mt-2">
                API keys are stored locally in your browser for privacy.
              </p>
            </div>
          </div>

          {/* Data Management */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-medium text-[#1A1A1A] mb-3">Data Management</h3>
            <div className="space-y-2">
              <button
                onClick={handleExportChats}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-[#F5F2F1] hover:bg-[#e8e5e4] rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Export Chat History</span>
              </button>
              <button
                onClick={handleImportChats}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-[#F5F2F1] hover:bg-[#e8e5e4] rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm">Import Chat History</span>
              </button>
              <button
                onClick={handleClearAllData}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Clear All Data</span>
              </button>
            </div>
          </div>

          {/* About */}
          <div>
            <h3 className="font-medium text-[#1A1A1A] mb-2">About Pengu AI</h3>
            <p className="text-sm text-gray-600">
              Version 1.0.0 - A distraction-free study companion built for students.
              All features are ready for API integration.
            </p>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="font-medium text-[#1A1A1A] mb-3 flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              Keyboard Shortcuts
            </h3>
            <div className="bg-[#F5F2F1] rounded-xl p-4 space-y-2">
              <ShortcutRow shortcut={SHORTCUTS.newChat} />
              <ShortcutRow shortcut={SHORTCUTS.send} />
              <ShortcutRow shortcut={SHORTCUTS.newLine} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ shortcut }: { shortcut: typeof SHORTCUTS[keyof typeof SHORTCUTS] }) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const keys = isMac ? shortcut.mac : shortcut.keys;

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{shortcut.description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <kbd key={i} className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
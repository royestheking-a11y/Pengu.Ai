import { useEffect } from "react";
import { useChatContext } from "./ChatContext";

interface KeyboardShortcutsProps {
  onNewChat?: () => void;
  onOpenSettings?: () => void;
}

export function KeyboardShortcuts({ onNewChat, onOpenSettings }: KeyboardShortcutsProps) {
  const { createNewChat } = useChatContext();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N - New Chat
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        if (onNewChat) {
          onNewChat();
        } else {
          createNewChat();
        }
      }

      // Ctrl/Cmd + , - Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        onOpenSettings?.();
      }

      // Ctrl/Cmd + / - Help
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        // This would trigger help modal if passed as prop
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createNewChat, onNewChat, onOpenSettings]);

  return null; // This component doesn't render anything
}

// Keyboard shortcuts reference
export const SHORTCUTS = {
  newChat: { keys: ["Ctrl", "N"], mac: ["⌘", "N"], description: "Create new chat" },
  settings: { keys: ["Ctrl", ","], mac: ["⌘", ","], description: "Open settings" },
  send: { keys: ["Enter"], mac: ["↵"], description: "Send message" },
  newLine: { keys: ["Shift", "Enter"], mac: ["⇧", "↵"], description: "New line in message" },
} as const;

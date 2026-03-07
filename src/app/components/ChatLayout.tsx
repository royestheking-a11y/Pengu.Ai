import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { ChatInterface } from "./ChatInterface";
import { Canvas } from "./Canvas";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { useChatContext } from "./ChatContext";
import { StudyPrepView } from "./StudyPrepView";
import { JobPrepView } from "./JobPrepView";
import { PdfChatView } from "./PdfChatView"; // Pinecone RAG View

import { SettingsPage } from "./SettingsPage";
import { UpgradePlanPage } from "./UpgradePlanPage";
import { PersonalizationPage } from "./PersonalizationPage";
import { Menu, X } from "lucide-react";

type AppView = "chat" | "settings" | "upgrade" | "personalization";

export function ChatLayout() {
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [canvasContent, setCanvasContent] = useState("");
  const [canvasType, setCanvasType] = useState<"text" | "flashcards" | "mindmap">("text");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>("chat");
  const { currentChat } = useChatContext();

  const openCanvas = (content: string, type: "text" | "flashcards" | "mindmap" = "text") => {
    setCanvasContent(content);
    setCanvasType(type);
    setIsCanvasOpen(true);
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Render specific view
  if (currentView === "settings") {
    return <SettingsPage onClose={() => setCurrentView("chat")} />;
  }

  if (currentView === "upgrade") {
    return <UpgradePlanPage onClose={() => setCurrentView("chat")} />;
  }

  if (currentView === "personalization") {
    return <PersonalizationPage onClose={() => setCurrentView("chat")} />;
  }

  return (
    <>

      <KeyboardShortcuts />
      <div className="flex h-screen w-screen overflow-hidden bg-white">
        {/* Mobile Menu Button */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#462D28] text-white rounded-lg shadow-lg hover:bg-[#5a3a34] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Sidebar Overlay (Mobile) */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed md:relative h-full z-40
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <Sidebar onCloseMobile={() => setIsSidebarOpen(false)} onNavigate={handleNavigate} />
        </div>

        {/* Interface Panel (Chat, Study Prep, or Job Prep) */}
        <div className={`flex-1 transition-all duration-300 ${isCanvasOpen ? 'mr-0' : ''}`}>
          {currentChat?.sessionType === "study_prep" ? (
            <StudyPrepView />
          ) : currentChat?.sessionType === "job_prep" ? (
            <JobPrepView />
          ) : currentChat?.sessionType === "pdf_chat" ? (
            <PdfChatView />
          ) : (
            <ChatInterface openCanvas={openCanvas} />
          )}
        </div>

        {/* Canvas - Expandable Right Panel */}
        <Canvas
          isOpen={isCanvasOpen}
          onClose={() => setIsCanvasOpen(false)}
          content={canvasContent}
          type={canvasType}
          onContentChange={setCanvasContent}
        />
      </div>
    </>
  );
}
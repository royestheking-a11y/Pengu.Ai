import { X, Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "./ToastContext";
import { Flashcards } from "./Flashcards";
import { MindMap } from "./MindMap";

interface CanvasProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  type: "text" | "flashcards" | "mindmap";
  onContentChange: (content: string) => void;
}

export function Canvas({ isOpen, onClose, content, type, onContentChange }: CanvasProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    showToast("Copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pengu-export-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Content exported successfully!", "success");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className="lg:hidden fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Canvas Panel */}
      <div className="fixed lg:relative right-0 top-0 w-full sm:w-[500px] lg:w-[600px] h-full border-l border-gray-200 bg-white flex flex-col z-50 shadow-2xl lg:shadow-none animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">
            {type === "text" ? "Canvas Editor" : type === "flashcards" ? "Flashcards" : "Mind Map"}
          </h2>
          <div className="flex items-center gap-2">
            {type === "text" && (
              <>
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-600" />}
                </button>
                <button
                  onClick={handleExport}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Export as file"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {type === "text" && (
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="w-full h-full p-4 bg-white border border-gray-200 rounded-xl resize-none outline-none text-gray-900 focus:ring-2 focus:ring-[#462D28] focus:border-transparent"
              placeholder="Edit your content here..."
            />
          )}
          
          {type === "flashcards" && <Flashcards content={content} />}
          
          {type === "mindmap" && <MindMap content={content} />}
        </div>
      </div>
    </>
  );
}
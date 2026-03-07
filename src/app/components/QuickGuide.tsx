import { X, FileText, Youtube, Brain, Clock, MessageSquare, Zap } from "lucide-react";

interface QuickGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickGuide({ isOpen, onClose }: QuickGuideProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Quick Guide</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[#462D28] mb-3">
              Welcome to Pengu AI 🐧
            </h3>
            <p className="text-gray-600">
              Your distraction-free AI study companion. This app is fully functional with local storage and ready for API integration.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h4 className="font-semibold text-[#462D28]">Core Features</h4>

            <FeatureCard
              icon={<MessageSquare className="w-5 h-5" />}
              title="Smart Chat Interface"
              description="Chat with Pengu using models 3.2, 4.2 or 5.2. Switch between models based on your needs."
            />

            <FeatureCard
              icon={<FileText className="w-5 h-5" />}
              title="PDF Analysis"
              description="Upload PDFs to extract text, generate summaries, and ask questions about document content."
            />

            <FeatureCard
              icon={<Youtube className="w-5 h-5" />}
              title="YouTube to Study Guide"
              description="Paste a YouTube URL to extract transcripts and generate study materials with key concepts and quizzes."
            />

            <FeatureCard
              icon={<Brain className="w-5 h-5" />}
              title="Mind Maps & Flashcards"
              description="Convert any AI response into visual mind maps or interactive flashcards for active recall studying."
            />

            <FeatureCard
              icon={<Clock className="w-5 h-5" />}
              title="Pomodoro Timer"
              description="Built-in focus timer with 25-minute study sessions and 5-minute breaks to maintain productivity."
            />

            <FeatureCard
              icon={<Zap className="w-5 h-5" />}
              title="Canvas Editor"
              description="Edit and export AI-generated content in a rich-text workspace. Perfect for long-form essays and notes."
            />
          </div>

          {/* How to Use */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#1A1A1A]">How to Use</h4>
            <div className="bg-[#F5F2F1] rounded-xl p-4 space-y-2">
              <p className="text-sm"><strong>1. Start a Chat:</strong> Click "New Chat" or start typing in any existing chat.</p>
              <p className="text-sm"><strong>2. Upload Files:</strong> Click the paperclip icon to upload PDFs or images.</p>
              <p className="text-sm"><strong>3. YouTube Links:</strong> Paste a YouTube URL directly in the chat input.</p>
              <p className="text-sm"><strong>4. Create Study Materials:</strong> Click buttons below AI responses to make flashcards or mind maps.</p>
              <p className="text-sm"><strong>5. Edit in Canvas:</strong> Open responses in the side canvas for detailed editing.</p>
              <p className="text-sm"><strong>6. Focus Mode:</strong> Use the Pomodoro timer in the sidebar to stay focused.</p>
            </div>
          </div>



          {/* Tips */}
          <div className="space-y-2">
            <h4 className="font-semibold text-[#1A1A1A]">Pro Tips</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>• Use keyboard shortcut <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> to send messages</p>
              <p>• Your chat history is automatically saved locally</p>
              <p>• Export your chats from Settings for backup</p>
              <p>• The canvas editor supports text formatting and export</p>
              <p>• Flashcards can be navigated with arrow buttons or keyboard</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-[#F5F2F1] rounded-b-2xl">
          <p className="text-sm text-gray-600 text-center">
            Built with React, Tailwind CSS, and designed for distraction-free studying
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 p-3 bg-[#F5F2F1] rounded-xl">
      <div className="flex-shrink-0 p-2 bg-[#462D28] text-white rounded-lg h-fit">
        {icon}
      </div>
      <div className="flex-1">
        <h5 className="font-medium text-sm text-[#1A1A1A] mb-1">{title}</h5>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Sparkles, MessageSquare, FileText, Clock, Zap, ArrowRight, BookOpen, Brain, PenTool } from "lucide-react";
import penguLogo from "@/assets/f5ab8b8d79f0bc497ec9b77eb6c002de4b5b855f.png";

export function WelcomeSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has seen welcome screen before
    const hasSeenWelcome = localStorage.getItem("pengu-welcome-seen");
    if (!hasSeenWelcome) {
      setShow(true);
    }
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem("pengu-welcome-seen", "true");
    setShow(false);
  };

  const handleSkip = () => {
    localStorage.setItem("pengu-welcome-seen", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Glass effect background with blur */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-md"></div>

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 py-8 sm:py-12">
        <div className="max-w-5xl w-full text-center space-y-8 sm:space-y-10 md:space-y-12 animate-fade-in">
          {/* Logo & Brand */}
          <div className="flex flex-col items-center gap-4 sm:gap-5 md:gap-6">
            <div className="relative">
              {/* Outer brown circle */}
              <div className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-full bg-[#462D28] flex items-center justify-center shadow-lg">
                {/* Inner white circle */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-white shadow-inner flex items-center justify-center">
                  <img src={penguLogo} alt="Pengu AI" className="w-14 h-14 sm:w-15 sm:h-15 md:w-16 md:h-16 rounded-full object-cover" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-7 h-7 sm:w-8 sm:h-8 bg-[#462D28] rounded-full flex items-center justify-center shadow-md">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2 px-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#462D28] tracking-tight">
                Welcome to Pengu AI
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
                Your intelligent study companion for focused learning
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto px-2">
            <WelcomeFeature
              icon={<MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />}
              title="AI Chat Assistant"
              description="Get instant, intelligent answers to your study questions"
            />
            <WelcomeFeature
              icon={<FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
              title="PDF & Image Analysis"
              description="Upload documents and extract key insights"
            />
            <WelcomeFeature
              icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />}
              title="Pomodoro Timer"
              description="Stay focused with built-in productivity timer"
            />
            <WelcomeFeature
              icon={<Brain className="w-4 h-4 sm:w-5 sm:h-5" />}
              title="Mind Maps"
              description="Visualize complex concepts and relationships"
            />
            <WelcomeFeature
              icon={<Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
              title="Smart Flashcards"
              description="Create 3D flip cards for effective memorization"
            />
            <WelcomeFeature
              icon={<PenTool className="w-4 h-4 sm:w-5 sm:h-5" />}
              title="Canvas Workspace"
              description="Edit and organize your study materials"
            />
          </div>

          {/* Key Benefits */}
          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 max-w-3xl mx-auto shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center sm:text-left">
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-[#462D28]">2 AI Models</div>
                <p className="text-xs sm:text-sm text-gray-600">Basic & Deep Think modes</p>
              </div>
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-[#462D28]">Distraction-Free</div>
                <p className="text-xs sm:text-sm text-gray-600">Clean, minimal interface</p>
              </div>
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-[#462D28]">Multi-Modal</div>
                <p className="text-xs sm:text-sm text-gray-600">Text, voice & file support</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-[#462D28] text-white rounded-xl hover:bg-[#5a3a34] transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] font-medium text-sm sm:text-base"
            >
              <span>Start Learning Now</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div>
              <button
                onClick={handleSkip}
                className="text-xs sm:text-sm text-gray-500 hover:text-[#462D28] transition-colors font-medium"
              >
                Skip introduction →
              </button>
            </div>
          </div>

          {/* Developer Note */}
          <div className="pt-6 sm:pt-8 border-t border-gray-200 max-w-2xl mx-auto px-4">
            <p className="text-xs text-gray-500 text-left sm:text-center">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              <strong>Distraction-Free Learning:</strong> All your study materials and focused chats are protected and synced in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeFeature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group p-4 sm:p-5 bg-white border border-gray-200 hover:border-[#462D28] rounded-xl text-left transition-all hover:shadow-md">
      <div className="p-1.5 sm:p-2 bg-[#462D28] text-white rounded-lg w-fit mb-2 sm:mb-3 group-hover:bg-[#5a3a34] transition-colors">
        {icon}
      </div>
      <h3 className="font-semibold text-[#462D28] mb-0.5 sm:mb-1 text-xs sm:text-sm">{title}</h3>
      <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
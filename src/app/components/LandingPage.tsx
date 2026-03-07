import { Sparkles, BookOpen, Brain, Zap, Clock, FileText, Youtube, CheckCircle, TrendingUp, Users, Shield, ArrowRight } from "lucide-react";
import penguLogo from "@/assets/f5ab8b8d79f0bc497ec9b77eb6c002de4b5b855f.png";

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="relative z-10 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#462D28] to-[#5a3a34] flex items-center justify-center">
                <img src={penguLogo} alt="Pengu AI" className="w-8 h-8 rounded-full object-cover" />
              </div>
              <span className="text-xl font-bold text-[#462D28]">Pengu AI</span>
            </div>
            <button
              onClick={onStart}
              className="px-6 py-2 bg-[#462D28] text-white rounded-full hover:bg-[#5a3a34] transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F5F2F1] via-white to-[#F5F2F1]">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#462D28]/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#462D28]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#462D28]/10 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-[#462D28]" />
                <span className="text-sm font-semibold text-[#462D28]">AI-Powered Study Companion</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Learn Smarter,
                <br />
                <span className="text-[#462D28]">Not Harder</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                Transform your study sessions with AI-powered insights, interactive flashcards, mind maps, and distraction-free focus tools.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <button
                  onClick={onStart}
                  className="group px-8 py-4 bg-gradient-to-r from-[#462D28] to-[#5a3a34] text-white rounded-full hover:shadow-2xl transition-all font-bold text-lg flex items-center justify-center gap-2"
                >
                  Start Learning Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-white border-2 border-[#462D28] text-[#462D28] rounded-full hover:bg-[#F5F2F1] transition-all font-semibold text-lg">
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center gap-6 justify-center lg:justify-start text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Free trial included</span>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image/Illustration */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-[#462D28] to-[#5a3a34] rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-500">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center animate-bounce">
                  <img src={penguLogo} alt="Pengu" className="w-20 h-20 rounded-2xl object-cover" />
                </div>

                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Brain className="w-6 h-6 text-white" />
                      <span className="text-white font-semibold">AI Chat</span>
                    </div>
                    <p className="text-white/70 text-sm">Get instant answers to your questions...</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-6 h-6 text-white" />
                      <span className="text-white font-semibold">Flashcards</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-16 h-20 bg-white/20 rounded-lg"></div>
                      <div className="w-16 h-20 bg-white/20 rounded-lg"></div>
                      <div className="w-16 h-20 bg-white/20 rounded-lg"></div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-6 h-6 text-white" />
                      <span className="text-white font-semibold">Focus Timer</span>
                    </div>
                    <div className="text-3xl font-bold text-white">25:00</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-[#462D28] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-white/70">Active Learners</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-white/70">Flashcards Created</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">4.9★</div>
              <div className="text-white/70">User Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-white/70">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful tools designed to help you learn faster and retain more
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#462D28] hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[#462D28] to-[#5a3a34] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-[#F5F2F1] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Get Started in 3 Simple Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#462D28] to-[#5a3a34] text-white rounded-full text-2xl font-bold mb-6 shadow-lg">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 w-8 h-8 text-[#462D28]/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#462D28] to-[#5a3a34] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of students who are learning smarter with Pengu AI
          </p>
          <button
            onClick={onStart}
            className="group px-10 py-5 bg-white text-[#462D28] rounded-full hover:bg-gray-100 transition-all font-bold text-lg shadow-2xl hover:scale-105 flex items-center gap-3 mx-auto"
          >
            Start Your Free Trial
            <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </button>
          <p className="text-white/70 mt-6">No credit card required • 7-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#462D28] to-[#5a3a34] flex items-center justify-center">
                <img src={penguLogo} alt="Pengu AI" className="w-8 h-8 rounded-full object-cover" />
              </div>
              <span className="text-xl font-bold">Pengu AI</span>
            </div>
            <p className="text-gray-400 mb-4">Your distraction-free study companion</p>
            <p className="text-gray-500 text-sm">© 2026 Pengu AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: <Brain className="w-7 h-7 text-white" />,
    title: "AI-Powered Assistance",
    description: "Get intelligent answers with advanced AI models. Choose between Basic and Deep Think modes for different complexity levels.",
  },
  {
    icon: <FileText className="w-7 h-7 text-white" />,
    title: "Smart Flashcards",
    description: "Generate interactive 3D flip flashcards from any topic. Study efficiently with spaced repetition techniques.",
  },
  {
    icon: <Brain className="w-7 h-7 text-white" />,
    title: "Visual Mind Maps",
    description: "Transform complex concepts into beautiful, easy-to-understand visual diagrams with Mermaid.js integration.",
  },
  {
    icon: <FileText className="w-7 h-7 text-white" />,
    title: "Document Upload",
    description: "Upload PDFs and images to extract information and generate study materials instantly.",
  },
  {
    icon: <Youtube className="w-7 h-7 text-white" />,
    title: "YouTube Integration",
    description: "Process YouTube URLs to create summaries, notes, and flashcards from educational videos.",
  },
  {
    icon: <Clock className="w-7 h-7 text-white" />,
    title: "Pomodoro Timer",
    description: "Stay focused with built-in timer featuring work sessions, breaks, and study analytics.",
  },
];

const steps = [
  {
    title: "Sign Up Free",
    description: "Create your account in seconds. No credit card needed to start.",
  },
  {
    title: "Start Learning",
    description: "Ask questions, upload materials, or generate flashcards instantly.",
  },
  {
    title: "Track Progress",
    description: "Monitor your learning journey and achieve your study goals.",
  },
];
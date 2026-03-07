import { HelpCircle } from "lucide-react";
import penguLogo from "@/assets/f5ab8b8d79f0bc497ec9b77eb6c002de4b5b855f.png";

interface GuestHeaderProps {
  onLogin: () => void;
  onSignup: () => void;
  onHelp: () => void;
}

export function GuestHeader({ onLogin, onSignup, onHelp }: GuestHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#462D28] flex items-center justify-center shadow-md">
            <img src={penguLogo} alt="Pengu" className="w-8 h-8 rounded-full object-cover" />
          </div>
          <span className="text-xl font-bold text-[#462D28]">Pengu AI</span>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={onHelp}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Help"
          >
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={onLogin}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Log in
          </button>

          <button
            onClick={onSignup}
            className="px-4 py-2 text-sm font-medium bg-[#462D28] text-white rounded-lg hover:bg-[#5a3a34] transition-colors shadow-sm"
          >
            Sign up for free
          </button>
        </div>
      </div>
    </header>
  );
}

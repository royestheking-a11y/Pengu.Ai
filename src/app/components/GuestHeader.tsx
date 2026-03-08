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
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#462D28] flex items-center justify-center shadow-md flex-shrink-0">
            <img src={penguLogo} alt="Pengu" className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover" />
          </div>
          <span className="text-lg md:text-xl font-bold text-[#462D28] hidden sm:block">Pengu AI</span>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5 md:gap-3">
          <button
            onClick={onHelp}
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Help"
          >
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={onLogin}
            className="px-2.5 md:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Log in
          </button>

          <button
            onClick={onSignup}
            className="px-3 md:px-5 py-2 text-sm font-medium bg-[#462D28] text-white rounded-lg hover:bg-[#5a3a34] transition-colors shadow-sm whitespace-nowrap"
          >
            <span className="hidden xs:inline">Sign up for free</span>
            <span className="xs:hidden">Sign up</span>
          </button>
        </div>
      </div>
    </header>
  );
}

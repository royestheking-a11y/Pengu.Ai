import { useState } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, Chrome } from "lucide-react";
import penguLogo from "@/assets/f5ab8b8d79f0bc497ec9b77eb6c002de4b5b855f.png";
import { API_BASE_URL } from '../../config';

interface AuthModalProps {
  isOpen: boolean;
  mode: "login" | "signup";
  onClose: () => void;
  onAuth: (email: string, password: string, name?: string, id?: string) => void;
  onSwitchMode: () => void;
}

export function AuthModal({ isOpen, mode, onClose, onAuth, onSwitchMode }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const endpoint = mode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const payload = mode === "signup" ? { name, email, password } : { email, password };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (mode === "signup") {
        setSuccessMsg("Account created successfully! Please sign in.");
        onSwitchMode();
      } else {
        onAuth(data.user.email, password, data.user.name, data.user.id);

        if (rememberMe) {
          localStorage.setItem("pengu-remember-me", "true");
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    setTimeout(() => {
      onAuth(`user@${provider}.com`, "password", `${provider} User`, "social-id");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-[440px] w-full my-8 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Compact Gradient Header */}
        <div className="relative bg-gradient-to-br from-[#462D28] via-[#5a3a34] to-[#462D28] text-white px-6 py-6 overflow-hidden">
          {/* Animated Background Orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 hover:rotate-90 z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-white shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform">
                <img src={penguLogo} alt="Pengu AI" className="w-12 h-12 rounded-xl object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {mode === "login" ? "Welcome back!" : "Get Started"}
              </h2>
              <p className="text-white/80 text-xs">
                {mode === "login"
                  ? "Sign in to continue learning"
                  : "Create your free account"}
              </p>
            </div>
          </div>
        </div>

        {/* Compact Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Input (Signup only) */}
          {mode === "signup" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Full Name
              </label>
              <div className={`relative transition-all duration-200`}>
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${nameFocused ? 'text-[#462D28]' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  placeholder="Enter your name"
                  required
                  className={`w-full pl-10 pr-3 py-2.5 border-2 rounded-lg transition-all duration-200 outline-none text-sm ${nameFocused
                    ? 'border-[#462D28] bg-[#F5F2F1]/30'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Email Address
            </label>
            <div className={`relative transition-all duration-200`}>
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${emailFocused ? 'text-[#462D28]' : 'text-gray-400'}`} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="you@example.com"
                required
                className={`w-full pl-10 pr-3 py-2.5 border-2 rounded-lg transition-all duration-200 outline-none text-sm ${emailFocused
                  ? 'border-[#462D28] bg-[#F5F2F1]/30'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Password
            </label>
            <div className={`relative transition-all duration-200`}>
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${passwordFocused ? 'text-[#462D28]' : 'text-gray-400'}`} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Enter password"
                required
                className={`w-full pl-10 pr-10 py-2.5 border-2 rounded-lg transition-all duration-200 outline-none text-sm ${passwordFocused
                  ? 'border-[#462D28] bg-[#F5F2F1]/30'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
            {mode === "signup" && (
              <p className="text-[10px] text-gray-500 ml-1">
                Must be at least 8 characters
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password (Login only) */}
          {mode === "login" && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-[#462D28] focus:ring-[#462D28] cursor-pointer"
                />
                <span className="text-xs text-gray-700 font-medium group-hover:text-[#462D28] transition-colors">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-xs text-[#462D28] font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Terms (Signup only) */}
          {mode === "signup" && (
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                required
                className="w-3.5 h-3.5 rounded border-gray-300 text-[#462D28] focus:ring-[#462D28] cursor-pointer"
              />
              <span className="text-[10px] text-gray-600 leading-relaxed">
                I agree to the <button type="button" className="text-[#462D28] font-semibold hover:underline">Terms</button> and <button type="button" className="text-[#462D28] font-semibold hover:underline">Privacy Policy</button>
              </span>
            </label>
          )}

          {/* Messages */}
          {errorMsg && (
            <div className="text-red-500 text-xs font-medium text-center bg-red-50 py-2 rounded-lg border border-red-100 animate-in fade-in">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="text-green-700 text-xs font-medium text-center bg-green-50 py-2 rounded-lg border border-green-200 animate-in fade-in">
              {successMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="relative w-full py-3 bg-gradient-to-r from-[#462D28] to-[#5a3a34] text-white rounded-lg hover:shadow-xl transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#5a3a34] to-[#462D28] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative flex items-center justify-center gap-2 text-sm">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                </>
              )}
            </span>
          </button>

          {/* Social Login */}
          <div className="relative pt-1">
            <div className="absolute inset-0 flex items-center pt-1">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs pt-1">
              <span className="px-3 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="w-full relative flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:border-[#462D28] hover:bg-gray-50 hover:shadow transition-all duration-200 text-sm font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Chrome className="w-5 h-5 text-gray-700 group-hover:scale-110 transition-transform" />
            Sign in with Google
          </button>

          {/* Footer */}
          <div className="pt-3 text-center border-t border-gray-100">
            <p className="text-xs text-gray-600">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => { setErrorMsg(null); setSuccessMsg(null); onSwitchMode(); }}
                className="text-[#462D28] font-bold hover:underline transition-all"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
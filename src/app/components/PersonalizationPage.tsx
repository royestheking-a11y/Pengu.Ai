import { useState } from "react";
import { X, Smile, Palette, Type, Volume2, Sparkles, Image as ImageIcon } from "lucide-react";

interface PersonalizationPageProps {
  onClose: () => void;
}

export function PersonalizationPage({ onClose }: PersonalizationPageProps) {
  const [penguMood, setPenguMood] = useState("Happy");
  const [chatBubbleStyle, setChatBubbleStyle] = useState("Modern");
  const [fontSize, setFontSize] = useState("Medium");
  const [animationSpeed, setAnimationSpeed] = useState("Normal");
  const [soundEffects, setSoundEffects] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);

  const penguMoods = [
    { name: "Happy", emoji: "😊", color: "bg-yellow-500" },
    { name: "Studious", emoji: "🤓", color: "bg-blue-500" },
    { name: "Excited", emoji: "🤩", color: "bg-pink-500" },
    { name: "Chill", emoji: "😎", color: "bg-purple-500" },
    { name: "Focused", emoji: "🧐", color: "bg-green-500" },
  ];

  const chatBubbleStyles = [
    { name: "Modern", preview: "rounded-2xl" },
    { name: "Classic", preview: "rounded-lg" },
    { name: "Minimal", preview: "rounded-sm" },
    { name: "Rounded", preview: "rounded-full" },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#F5F2F1] via-white to-[#F5F2F1] text-gray-900 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-[#462D28]">Personalization</h1>
              <p className="text-gray-600">Customize your Pengu AI experience</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Pengu Mood */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Smile className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Pengu's Mood</h2>
                <p className="text-sm text-gray-600">Choose your mascot's personality</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {penguMoods.map((mood) => (
                <button
                  key={mood.name}
                  onClick={() => setPenguMood(mood.name)}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    penguMood === mood.name
                      ? "border-[#462D28] bg-[#462D28]/10"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-3xl mb-2">{mood.emoji}</div>
                  <div className="text-sm font-medium text-gray-900">{mood.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Bubble Style */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Chat Bubble Style</h2>
                <p className="text-sm text-gray-600">Select your preferred message style</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {chatBubbleStyles.map((style) => (
                <button
                  key={style.name}
                  onClick={() => setChatBubbleStyle(style.name)}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    chatBubbleStyle === style.name
                      ? "border-[#462D28] bg-[#462D28]/10"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-full h-12 bg-gray-300 mb-2 ${style.preview}`}></div>
                  <div className="text-sm font-medium text-gray-900">{style.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Type className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Font Size</h2>
                <p className="text-sm text-gray-600">Adjust text size for comfortable reading</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-20">Small</span>
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={fontSize === "Small" ? 0 : fontSize === "Medium" ? 1 : 2}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFontSize(val === 0 ? "Small" : val === 1 ? "Medium" : "Large");
                }}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#462D28]"
              />
              <span className="text-sm text-gray-600 w-20 text-right">Large</span>
            </div>
            <div className="mt-4 text-center">
              <span className="text-sm font-medium px-4 py-2 bg-gray-100 rounded-lg text-gray-900">
                Current: {fontSize}
              </span>
            </div>
          </div>

          {/* Animation Speed */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Animation Speed</h2>
                <p className="text-sm text-gray-600">Control interface animations</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["Slow", "Normal", "Fast"].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setAnimationSpeed(speed)}
                  className={`py-3 rounded-xl border-2 transition-all ${
                    animationSpeed === speed
                      ? "border-[#462D28] bg-[#462D28]/10 text-gray-900"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <div className="text-sm font-medium">{speed}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Settings */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 mb-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
                <p className="text-sm text-gray-600">Fine-tune your experience</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                <div>
                  <div className="font-medium mb-1 text-gray-900">Sound Effects</div>
                  <div className="text-sm text-gray-600">Play sounds for interactions</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundEffects}
                    onChange={(e) => setSoundEffects(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-[#462D28] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#462D28]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                <div>
                  <div className="font-medium mb-1 text-gray-900">Auto-save</div>
                  <div className="text-sm text-gray-600">Automatically save your work</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-[#462D28] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#462D28]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                <div>
                  <div className="font-medium mb-1 text-gray-900">Compact Mode</div>
                  <div className="text-sm text-gray-600">Reduce spacing between messages</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={(e) => setCompactMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-[#462D28] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#462D28]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                <div>
                  <div className="font-medium mb-1 text-gray-900">Show Timestamps</div>
                  <div className="text-sm text-gray-600">Display time on messages</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTimestamps}
                    onChange={(e) => setShowTimestamps(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-[#462D28] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#462D28]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Save preferences to localStorage
                localStorage.setItem("pengu-personalization", JSON.stringify({
                  penguMood,
                  chatBubbleStyle,
                  fontSize,
                  animationSpeed,
                  soundEffects,
                  autoSave,
                  compactMode,
                  showTimestamps,
                }));
                onClose();
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#462D28] to-[#5a3a34] text-white rounded-xl hover:shadow-xl transition-all font-bold"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
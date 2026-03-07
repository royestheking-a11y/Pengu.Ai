import { useState } from "react";
import { useChatContext } from "./ChatContext";
import { useToast } from './ToastContext';
import { API_BASE_URL } from '../../config';
import {
  X,
  Settings,
  Bell,
  Smile,
  Grid,
  Database,
  Shield,
  Users,
  User,
  ChevronDown,
  Play,
  Menu
} from "lucide-react";

type SettingSection =
  | "general"
  | "notifications"
  | "personalization"
  | "apps"
  | "data-controls"
  | "security"
  | "parental-controls"
  | "account";

interface SettingsPageProps {
  onClose: () => void;
}

export function SettingsPage({ onClose }: SettingsPageProps) {
  const [selectedSection, setSelectedSection] = useState<SettingSection>("general");
  const [appearance, setAppearance] = useState("System");
  const [accentColor, setAccentColor] = useState("Orange");
  const [language, setLanguage] = useState("Auto-detect");
  const [spokenLanguage, setSpokenLanguage] = useState("Auto-detect");
  const [voiceType, setVoiceType] = useState("Spruce");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: "general" as SettingSection, icon: Settings, label: "General" },
    { id: "notifications" as SettingSection, icon: Bell, label: "Notifications" },
    { id: "personalization" as SettingSection, icon: Smile, label: "Personalization" },
    { id: "apps" as SettingSection, icon: Grid, label: "Apps" },
    { id: "data-controls" as SettingSection, icon: Database, label: "Data controls" },
    { id: "security" as SettingSection, icon: Shield, label: "Security" },
    { id: "parental-controls" as SettingSection, icon: Users, label: "Parental controls" },
    { id: "account" as SettingSection, icon: User, label: "Account" },
  ];

  const handleSectionChange = (section: SettingSection) => {
    setSelectedSection(section);
    setIsMobileMenuOpen(false);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#F5F2F1] via-white to-[#F5F2F1] text-gray-900 overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#462D28] text-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={`
        fixed md:relative w-64 h-full border-r border-gray-200 flex flex-col bg-white z-40
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Close Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${selectedSection === item.id
                ? "bg-[#462D28] text-white"
                : "text-gray-700 hover:bg-[#F5F2F1] hover:text-[#462D28]"
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 pt-16 md:pt-8">
          {selectedSection === "general" && <GeneralSettings
            appearance={appearance}
            setAppearance={setAppearance}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            language={language}
            setLanguage={setLanguage}
            spokenLanguage={spokenLanguage}
            setSpokenLanguage={setSpokenLanguage}
            voiceType={voiceType}
            setVoiceType={setVoiceType}
          />}
          {selectedSection === "notifications" && <NotificationsSettings />}
          {selectedSection === "personalization" && <PersonalizationSettings />}
          {selectedSection === "apps" && <AppsSettings />}
          {selectedSection === "data-controls" && <DataControlsSettings />}
          {selectedSection === "security" && <SecuritySettings />}
          {selectedSection === "parental-controls" && <ParentalControlsSettings />}
          {selectedSection === "account" && <AccountSettings />}
        </div>
      </div>
    </div>
  );
}

function GeneralSettings({
  appearance,
  setAppearance,
  accentColor,
  setAccentColor,
  language,
  setLanguage,
  spokenLanguage,
  setSpokenLanguage,
  voiceType,
  setVoiceType
}: {
  appearance: string;
  setAppearance: (val: string) => void;
  accentColor: string;
  setAccentColor: (val: string) => void;
  language: string;
  setLanguage: (val: string) => void;
  spokenLanguage: string;
  setSpokenLanguage: (val: string) => void;
  voiceType: string;
  setVoiceType: (val: string) => void;
}) {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#462D28]">General</h1>
      </div>

      {/* MFA Section */}
      <div className="bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-sm">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#462D28] to-[#5a3a34] flex items-center justify-center">
          <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Secure your account</h2>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
            Add multi-factor authentication (MFA), like a passkey or text message, to help protect your account when logging in.
          </p>
        </div>

        <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#462D28] hover:bg-[#5a3a34] text-white rounded-lg transition-colors text-xs sm:text-sm font-medium">
          Set up MFA
        </button>
      </div>

      {/* Appearance */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Appearance</h3>
          <select
            value={appearance}
            onChange={(e) => setAppearance(e.target.value)}
            className="bg-white border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:border-[#462D28] cursor-pointer w-full sm:w-auto text-gray-900"
          >
            <option>System</option>
            <option>Light</option>
            <option>Dark</option>
          </select>
        </div>
      </div>

      {/* Accent Color */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Accent color</h3>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#462D28]" />
            <select
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="bg-white border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:border-[#462D28] cursor-pointer flex-1 sm:flex-none text-gray-900"
            >
              <option>Orange</option>
              <option>Blue</option>
              <option>Green</option>
              <option>Purple</option>
              <option>Red</option>
            </select>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Language</h3>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:border-[#462D28] cursor-pointer w-full sm:w-auto text-gray-900"
          >
            <option>Auto-detect</option>
            <option>English (US)</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
        </div>
      </div>

      {/* Spoken Language */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Spoken language</h3>
          <select
            value={spokenLanguage}
            onChange={(e) => setSpokenLanguage(e.target.value)}
            className="bg-white border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:border-[#462D28] cursor-pointer w-full sm:w-auto text-gray-900"
          >
            <option>Auto-detect</option>
            <option>English (US)</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
        </div>
        <p className="text-xs sm:text-sm text-gray-600">
          For best results, select the language you mainly speak. If it's not listed, it may still be supported via auto-detection.
        </p>
      </div>

      {/* Voice */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Voice</h3>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Play className="w-4 h-4 text-gray-700" />
            </button>
            <span className="text-xs sm:text-sm text-gray-600">Play</span>
            <select
              value={voiceType}
              onChange={(e) => setVoiceType(e.target.value)}
              className="bg-white border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none focus:border-[#462D28] cursor-pointer flex-1 sm:flex-none text-gray-900"
            >
              <option>Spruce</option>
              <option>Breeze</option>
              <option>Juniper</option>
              <option>Cove</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [studyReminders, setStudyReminders] = useState(true);
  const [achievementAlerts, setAchievementAlerts] = useState(true);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[#462D28]">Notifications</h1>
      <p className="text-sm sm:text-base text-gray-600">Manage your notification preferences</p>

      <div className="space-y-4">
        <div className="bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Email Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium mb-1 text-gray-900">Product Updates</div>
                <div className="text-sm text-gray-600">Get notified about new features</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#462D28]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium mb-1 text-gray-900">Weekly Digest</div>
                <div className="text-sm text-gray-600">Summary of your weekly activity</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#462D28]"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">App Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium mb-1 text-gray-900">Push Notifications</div>
                <div className="text-sm text-gray-600">Receive browser notifications</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#462D28]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium mb-1 text-gray-900">Study Reminders</div>
                <div className="text-sm text-gray-600">Pomodoro and break reminders</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={studyReminders}
                  onChange={(e) => setStudyReminders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#462D28]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium mb-1 text-gray-900">Achievement Alerts</div>
                <div className="text-sm text-gray-600">Celebrate your milestones</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={achievementAlerts}
                  onChange={(e) => setAchievementAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#462D28]"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalizationSettings() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[#462D28]">Personalization</h1>
      <p className="text-sm sm:text-base text-gray-600">Customize your experience</p>
      <div className="bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-4 sm:p-6 shadow-sm">
        <p className="text-xs sm:text-sm text-gray-600 mb-4">
          Visit the dedicated Personalization page from the sidebar menu to customize Pengu's mood, chat bubbles, and more!
        </p>
        <button className="px-4 py-2 bg-[#462D28] hover:bg-[#5a3a34] text-white rounded-lg transition-colors text-sm font-medium">
          Open Personalization
        </button>
      </div>
    </div>
  );
}

function AppsSettings() {
  const [connectedApps] = useState([
    { name: "Google Drive", icon: "💾", connected: true, description: "Sync your study materials" },
    { name: "Notion", icon: "📝", connected: false, description: "Import your notes" },
    { name: "Spotify", icon: "🎵", connected: false, description: "Study music integration" },
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[#462D28]">Apps</h1>
      <p className="text-sm sm:text-base text-gray-600">Manage connected applications</p>
      <div className="space-y-3">
        {connectedApps.map((app) => (
          <div key={app.name} className="bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#462D28] to-[#5a3a34] flex items-center justify-center text-2xl">
                  {app.icon}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{app.name}</div>
                  <div className="text-sm text-gray-600">{app.description}</div>
                </div>
              </div>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${app.connected
                  ? "bg-red-500/20 text-red-600 hover:bg-red-500/30"
                  : "bg-[#462D28] text-white hover:bg-[#5a3a34]"
                  }`}
              >
                {app.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataControlsSettings() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[#462D28]">Data controls</h1>
      <p className="text-sm sm:text-base text-gray-600">Manage your data and privacy</p>

      <div className="space-y-4">
        <div className="bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Export Data</h3>
          <p className="text-sm text-gray-600 mb-4">Download a copy of your chat history and study materials</p>
          <button className="px-4 py-2 bg-[#462D28] hover:bg-[#5a3a34] text-white rounded-lg transition-colors text-sm font-medium">
            Export All Data
          </button>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Clear Chat History</h3>
          <p className="text-sm text-gray-600 mb-4">Permanently delete all your conversations</p>
          <button className="px-4 py-2 bg-red-500/20 text-red-600 hover:bg-red-500/30 rounded-lg transition-colors text-sm font-medium">
            Clear All Chats
          </button>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Data Usage</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total messages</span>
              <span className="font-medium text-gray-900">1,234</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Files uploaded</span>
              <span className="font-medium text-gray-900">45</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Storage used</span>
              <span className="font-medium text-gray-900">125 MB / 5 GB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[#462D28]">Security</h1>
      <p className="text-sm sm:text-base text-gray-600">Protect your account</p>

      <div className="space-y-4">
        <div className="bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Two-Factor Authentication</h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Add an extra layer of security</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#462D28]"></div>
            </label>
          </div>
          {twoFactorEnabled && (
            <button className="px-4 py-2 bg-[#462D28] hover:bg-[#5a3a34] text-white rounded-lg transition-colors text-sm font-medium">
              Setup 2FA
            </button>
          )}
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Change Password</h3>
          <p className="text-sm text-gray-600 mb-4">Update your account password</p>
          <button className="px-4 py-2 bg-[#462D28] hover:bg-[#5a3a34] text-white rounded-lg transition-colors text-sm font-medium">
            Change Password
          </button>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Active Sessions</h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm text-gray-900">Current Session</span>
                <span className="text-xs text-green-600">Active now</span>
              </div>
              <p className="text-xs text-gray-600">Chrome on MacOS • San Francisco, US</p>
            </div>
          </div>
          <button className="mt-4 px-4 py-2 bg-red-500/20 text-red-600 hover:bg-red-500/30 rounded-lg transition-colors text-sm font-medium">
            Sign Out All Devices
          </button>
        </div>
      </div>
    </div>
  );
}

function ParentalControlsSettings() {
  const [restrictedMode, setRestrictedMode] = useState(false);
  const [contentFilter, setContentFilter] = useState(true);
  const [timeLimit, setTimeLimit] = useState("120");

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[#462D28]">Parental controls</h1>
      <p className="text-sm sm:text-base text-gray-600">Set restrictions and monitoring</p>

      <div className="space-y-4">
        <div className="bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Content Controls</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium mb-1 text-gray-900">Restricted Mode</div>
                <div className="text-sm text-gray-600">Filter sensitive content</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={restrictedMode}
                  onChange={(e) => setRestrictedMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#462D28]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium mb-1 text-gray-900">Content Filter</div>
                <div className="text-sm text-gray-600">Block inappropriate topics</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={contentFilter}
                  onChange={(e) => setContentFilter(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#462D28]"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Time Limits</h3>
          <p className="text-sm text-gray-600 mb-4">Daily usage limit (minutes)</p>
          <input
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#462D28] text-gray-900"
            placeholder="120"
          />
          <p className="text-xs text-gray-600 mt-2">Set to 0 for unlimited usage</p>
        </div>
      </div>
    </div>
  );
}

function AccountSettings() {
  const { user, login } = useChatContext();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, name })
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      // Update local context
      if (user) {
        login(user.email, name, user.id);
      }
      showToast("Profile updated successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to update profile. Make sure the server supports this endpoint.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[#462D28]">Account</h1>
      <p className="text-sm sm:text-base text-gray-600">Manage your account details</p>

      <div className="space-y-4">
        <div className="bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Profile Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-2 block font-medium">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#462D28] text-gray-900"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block font-medium">Email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#462D28] text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed directly.</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="mt-4 px-4 py-2 bg-[#462D28] hover:bg-[#5a3a34] disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="bg-white border-2 border-red-200 rounded-xl md:rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
          <div className="space-y-3">
            <button className="w-full py-3 bg-red-500/20 text-red-600 hover:bg-red-500/30 rounded-lg transition-colors text-sm font-medium text-left px-4">
              Deactivate Account
            </button>
            <button className="w-full py-3 bg-red-500/20 text-red-600 hover:bg-red-500/30 rounded-lg transition-colors text-sm font-medium text-left px-4">
              Delete Account Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
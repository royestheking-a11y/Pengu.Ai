# 🐧 Pengu AI - Distraction-Free Study Companion

A beautifully designed, fully functional AI-powered study application with a clean penguin mascot. Built with React, TypeScript, and Tailwind CSS v4.

![Pengu AI](https://img.shields.io/badge/Version-1.0.0-blue) ![React](https://img.shields.io/badge/React-18.3.1-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6) ![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38bdf8)

## ✨ Features

### 🎯 Core Functionality
- **Smart Chat Interface** - Two AI modes: Basic (fast) and Deep Think (detailed analysis)
- **Chat History** - Organized by date (Today, Last 7 Days, Older) with full localStorage persistence
- **Model Selection** - Switch between different AI models based on your needs
- **Expandable Canvas** - Side workspace for editing, reviewing, and exporting content

### 📚 Study Tools
- **3D Flip Flashcards** - Interactive flashcards with smooth 3D animations
- **Mind Maps** - Mermaid.js visualization for complex topics
- **PDF Analysis** - Upload and extract text from PDF documents (ready for API integration)
- **Image OCR** - Extract text from images including handwritten content (ready for API integration)
- **YouTube to Notes** - Convert video transcripts into study materials (ready for API integration)

### ⏰ Productivity Features
- **Pomodoro Timer** - Built-in focus timer with 25-minute sessions and 5-minute breaks
- **Voice Input** - Record voice messages and convert to text (mock implementation ready for Web Speech API)
- **Keyboard Shortcuts** - Quick navigation with Ctrl/Cmd shortcuts
- **Data Export/Import** - Backup and restore your chat history

### 🎨 Design
- **Custom Color Palette**:
  - Primary Brand: `#462D28` (Sidebar)
  - Background: `#FFFFFF`
  - User Messages: `#F5F2F1`
  - Font: Inter (Google Fonts)
- **Responsive Layout** - Three-panel design (Sidebar, Chat, Canvas)
- **Smooth Animations** - Slide-in panels, 3D card flips, fade transitions
- **Custom Scrollbars** - Themed scrollbars matching the brand

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm installed

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd pengu-ai

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:5173`

## 📱 Usage

### First Time Setup
1. On first launch, you'll see a welcome splash screen
2. Click "Get Started" to begin
3. (Optional) Go to Settings to add your API keys

### Creating Chats
- Click the **"+ New Chat"** button in the sidebar
- Or use keyboard shortcut: `Ctrl+N` (Windows) / `Cmd+N` (Mac)

### Uploading Files
- Click the **paperclip icon** to upload PDFs or images
- Drag and drop is also supported
- Files are automatically processed (currently mock responses)

### YouTube Integration
- Simply paste a YouTube URL directly into the chat input
- The app will automatically detect and process it

### Using Flashcards
- After receiving an AI response, click **"Make Flashcards"**
- Flashcards open in the Canvas panel
- Click to flip, use arrow buttons to navigate

### Mind Maps
- Click **"Create Mind Map"** on any AI response
- Mermaid.js generates visual diagrams
- Great for understanding relationships and hierarchies

### Pomodoro Timer
- Located at the bottom of the sidebar
- Click Play to start a 25-minute focus session
- Automatically switches to 5-minute break
- Timer persists across sessions

### Settings & Data Management
- Click **Settings** at the bottom of the sidebar
- **API Configuration**: Add your Gemini and Groq API keys
- **Export Chats**: Download your chat history as JSON
- **Import Chats**: Restore from a previous backup
- **Clear All Data**: Reset the application

## 🔧 Project Structure

```
/src
  /app
    /components
      ChatLayout.tsx         # Main layout component
      ChatInterface.tsx      # Chat UI and message handling
      ChatContext.tsx        # State management with localStorage
      ToastContext.tsx       # Toast notification system
      Sidebar.tsx           # Chat history and timer
      Canvas.tsx            # Expandable workspace
      Flashcards.tsx        # 3D flip flashcards
      MindMap.tsx           # Mermaid.js visualization
      PomodoroTimer.tsx     # Focus timer
      SettingsModal.tsx     # Settings and data management
      QuickGuide.tsx        # Help documentation
      KeyboardShortcuts.tsx # Keyboard navigation
      WelcomeSplash.tsx     # First-time welcome
      FileUploadHandler.tsx # File processing (PDFs, images, YouTube)
      ToastNotification.tsx # Toast component
      /ui                   # Reusable UI components (shadcn/ui)
  /styles
    fonts.css             # Inter font import
    index.css             # Custom animations and scrollbar
    theme.css             # Pengu AI color palette
    tailwind.css          # Tailwind CSS v4 config
```

## 🔌 API Integration

**All UI features are complete and functional with mock data.** Ready to integrate real APIs!

### Quick Integration Guide

1. **Chat AI** - Replace `generateMockResponse()` in `ChatInterface.tsx`
   - Recommended: Google Gemini API or Groq Cloud
   
2. **PDF Extraction** - Replace `extractPDFText()` in `FileUploadHandler.tsx`
   - Recommended: PDF.js library
   
3. **Image OCR** - Replace `extractImageText()` in `FileUploadHandler.tsx`
   - Recommended: Google Gemini Vision API
   
4. **YouTube Transcripts** - Replace `fetchYouTubeTranscript()` in `FileUploadHandler.tsx`
   - Recommended: youtube-transcript npm package
   
5. **Voice Input** - Replace `handleVoiceInput()` in `ChatInterface.tsx`
   - Recommended: Web Speech API (built-in)

See the detailed [API Integration Guide](API_INTEGRATION_GUIDE.md) for complete implementation examples.

## 🎯 Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| Chat Interface | ✅ Complete | Mock responses ready for API |
| Chat History | ✅ Complete | Full localStorage persistence |
| Model Selection | ✅ Complete | UI ready for multiple models |
| Canvas Editor | ✅ Complete | Text editing with copy/export |
| Flashcards | ✅ Complete | 3D animations working |
| Mind Maps | ✅ Complete | Mermaid.js integrated |
| Pomodoro Timer | ✅ Complete | Fully functional |
| PDF Upload | ✅ Complete | Mock extraction, needs PDF.js |
| Image OCR | ✅ Complete | Mock extraction, needs Vision API |
| YouTube Integration | ✅ Complete | Mock transcript, needs API |
| Voice Input | ✅ Complete | Mock recording, needs Web Speech API |
| Settings | ✅ Complete | API keys stored in localStorage |
| Data Export/Import | ✅ Complete | Full backup/restore |
| Keyboard Shortcuts | ✅ Complete | Ctrl+N, Enter, etc. |
| Toast Notifications | ✅ Complete | Success, error, info, warning |
| Welcome Splash | ✅ Complete | First-time user experience |
| Quick Guide | ✅ Complete | In-app help documentation |

## 🎨 Customization

### Changing Colors

Edit `/src/styles/theme.css`:

```css
:root {
  --brand-primary: #462D28;    /* Change sidebar color */
  --brand-white: #FFFFFF;      /* Main background */
  --brand-light: #F5F2F1;      /* User message bubbles */
  --brand-dark-text: #1A1A1A;  /* Text color */
}
```

### Changing Font

Edit `/src/styles/fonts.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=YourFont:wght@400;500;600;700&display=swap');
```

Then update `theme.css`:

```css
--font-family: 'YourFont', sans-serif;
```

## 🛠️ Tech Stack

- **Framework**: React 18.3.1
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7
- **State Management**: React Context API
- **Storage**: localStorage
- **UI Components**: Custom + shadcn/ui
- **Animations**: CSS + Framer Motion (motion/react)
- **Icons**: Lucide React
- **Diagrams**: Mermaid.js
- **Build Tool**: Vite 6.3.5

## 📦 Dependencies

### Core Dependencies
- `react` & `react-dom` - 18.3.1
- `react-router` - 7.13.0
- `lucide-react` - Icons
- `mermaid` - Mind map visualization
- `motion` - Animations

### UI Components (shadcn/ui)
- All Radix UI primitives
- Custom Pengu AI styling

## 🐛 Known Issues

- Voice input uses mock implementation (Web Speech API integration needed)
- PDF extraction is simulated (PDF.js integration needed)
- Image OCR is simulated (Vision API integration needed)
- YouTube transcripts are mocked (API integration needed)
- AI responses are mock data (Gemini/Groq integration needed)

All these are intentional - the UI is complete and ready for your API integrations!

## 🤝 Contributing

This is a Figma Make generated project. Feel free to:
1. Fork the repository
2. Add real API integrations
3. Improve the UI/UX
4. Add new features
5. Submit pull requests

## 📄 License

MIT License - Feel free to use this project for learning or commercial purposes.

## 🙏 Acknowledgments

- UI Components: [shadcn/ui](https://ui.shadcn.com/)
- Icons: [Lucide](https://lucide.dev/)
- Diagrams: [Mermaid.js](https://mermaid.js.org/)
- Font: [Inter by Rasmus Andersson](https://rsms.me/inter/)

## 💬 Support

Need help integrating APIs? Check out:
- [API Integration Guide](API_INTEGRATION_GUIDE.md)
- [Google Gemini Docs](https://ai.google.dev/docs)
- [Groq Cloud](https://console.groq.com/)

---

**Built with Figma Make** 🎨 | **Powered by localStorage** 💾 | **Ready for API Integration** 🚀

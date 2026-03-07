# Pengu AI - Developer Notes

## 🐧 Overview
Pengu AI is a distraction-free AI study companion built with React, TypeScript, and Tailwind CSS. The application is fully functional with localStorage persistence and ready for API integration.

## 🎨 Design System

### Colors
- **Primary Brand**: `#462D28` (Deep espresso/burgundy)
- **Background**: `#FFFFFF` (Pure white)
- **User Message Bubbles**: `#F5F2F1` (Soft tint)
- **Text on Dark**: `#FFFFFF`
- **Text on Light**: `#1A1A1A`

### Typography
- **Font Family**: Inter (via Google Fonts)
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

## 📁 Project Structure

```
/src
  /app
    App.tsx                  # Main entry point
    routes.ts               # React Router configuration
    /components
      ChatLayout.tsx        # Main layout container
      Sidebar.tsx          # Left sidebar with navigation
      ChatInterface.tsx    # Center chat area
      Canvas.tsx           # Right expandable workspace
      ChatContext.tsx      # State management with localStorage
      PomodoroTimer.tsx    # Focus mode timer
      Flashcards.tsx       # Interactive flashcard viewer
      MindMap.tsx          # Mermaid.js mind map renderer
      SettingsModal.tsx    # Settings and preferences
      QuickGuide.tsx       # Help and documentation
      WelcomeSplash.tsx    # First-time user onboarding
      FileUploadHandler.tsx # File processing utilities
      KeyboardShortcuts.tsx # Keyboard shortcuts handler
      ToastNotification.tsx # Toast notifications
  /styles
    fonts.css              # Google Fonts import
    theme.css              # CSS variables and color tokens
    index.css              # Global styles and animations
    tailwind.css           # Tailwind CSS imports
```

## ✨ Features Implemented

### 1. Chat Interface ✅
- **Basic Mode**: Fast, quick responses
- **Deep Think Mode**: Detailed analysis
- Real-time message display with auto-scroll
- User and AI message bubbles
- Pengu mascot avatar on AI messages
- Chat history with automatic title generation

### 2. Sidebar Navigation ✅
- **New Chat Button**: Create new conversations
- **Chat History**: Organized by "Today", "Previous 7 Days", and "Older"
- **Focus Mode**: Built-in Pomodoro timer (25 min study, 5 min break)
- **Settings**: Access to configuration and data management
- Individual chat deletion with confirmation

### 3. File Upload & Processing 🔧
- **PDF Upload**: Ready for text extraction (requires PDF.js)
- **Image Upload**: Ready for OCR/vision analysis
- Mock extractors in place for easy API integration
- File type validation and error handling

### 4. YouTube Integration 🔧
- **URL Detection**: Automatically detects YouTube links
- **Transcript Fetching**: Mock function ready for API
- Video ID parsing utility included

### 5. Canvas Workspace ✅
- **Text Editor**: Rich-text editing with export
- **Flashcards Mode**: Interactive flip cards with 3D animation
- **Mind Map Mode**: Mermaid.js diagram rendering
- Copy to clipboard functionality
- Export as text file

### 6. Pomodoro Timer ✅
- 25-minute focus sessions
- 5-minute break periods
- Visual progress bar
- Play/pause/reset controls
- Automatic mode switching

### 7. Data Persistence ✅
- All data stored in localStorage
- Chat history preservation
- Current chat tracking
- Export/import functionality for backup
- Clear all data option

### 8. UI/UX Enhancements ✅
- Keyboard shortcuts (Ctrl/Cmd + N for new chat)
- Responsive loading states
- Smooth animations and transitions
- Custom scrollbar styling
- Welcome splash for first-time users
- Quick guide modal
- Settings modal with API key inputs

## 🔌 API Integration Points

### Ready for Integration

#### 1. Chat AI (ChatInterface.tsx)
Replace `generateMockResponse()` function with:
- **Google Gemini API** for deep analysis
- **Groq Cloud API** for fast responses

```typescript
// Location: /src/app/components/ChatInterface.tsx
// Line: ~300
function generateMockResponse(input: string, model: "basic" | "deep"): string {
  // TODO: Replace with actual API call
  // if (model === "basic") {
  //   return await groqAPI.chat(input);
  // } else {
  //   return await geminiAPI.chat(input);
  // }
}
```

#### 2. PDF Processing (FileUploadHandler.tsx)
Replace `extractPDFText()` with PDF.js:

```typescript
// Location: /src/app/components/FileUploadHandler.tsx
// Install: npm install pdfjs-dist
export async function extractPDFText(file: File): Promise<string> {
  // TODO: Implement PDF.js text extraction
}
```

#### 3. Image Processing (FileUploadHandler.tsx)
Replace `extractImageText()` with Gemini Vision:

```typescript
export async function extractImageText(file: File): Promise<string> {
  // TODO: Use Gemini Vision API for OCR/analysis
}
```

#### 4. YouTube Transcripts (FileUploadHandler.tsx)
Replace `fetchYouTubeTranscript()`:

```typescript
export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  // TODO: Use YouTube Transcript API
}
```

## 💾 Local Storage Structure

### Chat Data
```json
{
  "pengu-chats": [
    {
      "id": "unique-id",
      "title": "Chat title",
      "messages": [
        {
          "id": "msg-id",
          "role": "user" | "assistant",
          "content": "Message text",
          "timestamp": 1234567890
        }
      ],
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  ],
  "pengu-current-chat-id": "active-chat-id",
  "pengu-welcome-seen": "true"
}
```

## ⌨️ Keyboard Shortcuts

- **Ctrl/Cmd + N**: Create new chat
- **Enter**: Send message
- **Shift + Enter**: New line in message input

## 🎯 Next Steps for Production

1. **Install PDF.js**: `npm install pdfjs-dist`
2. **Add API Keys**: Store in Settings (localStorage or env variables)
3. **Connect Gemini API**: For chat and vision features
4. **Connect Groq API**: For fast basic responses
5. **Add YouTube Transcript API**: For video analysis
6. **Implement Voice Input**: Use Web Speech API
7. **Add Rate Limiting**: Prevent API abuse
8. **Error Handling**: Better error messages and retry logic
9. **Testing**: Add unit tests for core functionality
10. **Analytics**: Optional usage tracking

## 🔒 Security Notes

- API keys stored in localStorage (browser-only, not transmitted)
- All data is client-side only
- No server-side storage by default
- User can export/clear data at any time
- Consider encrypting localStorage for sensitive data

## 📦 Dependencies

### Production
- React 18.3.1
- React Router 7.13.0
- Lucide React (icons)
- Mermaid (mind maps)
- Tailwind CSS 4.1.12

### To Add for Full Functionality
- `pdfjs-dist` - PDF text extraction
- Google Gemini SDK
- Groq SDK
- YouTube Transcript API client

## 🚀 Build & Deploy

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

## 💡 Tips

- Mock responses help test UI without API costs
- All features work offline except API-dependent ones
- localStorage is limited to ~5-10MB per domain
- Consider IndexedDB for larger data storage needs
- Mermaid diagrams can be customized in MindMap.tsx

## 📞 Support

For questions or issues:
1. Check the Quick Guide (Help button in app)
2. Review component documentation in code
3. All functions have inline comments

---

Built with ❤️ for students who need focus and efficiency.

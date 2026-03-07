# Pengu AI - API Integration Guide

## Overview
This guide will help you replace the mock functions with real API integrations. All the UI components are fully functional with localStorage - you just need to connect the backend services.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS v4
- **State Management**: React Context API + localStorage
- **Routing**: React Router v7
- **Styling**: Tailwind CSS with custom Pengu AI theme

## API Integration Points

### 1. Chat AI Integration (ChatInterface.tsx)

**Location**: `/src/app/components/ChatInterface.tsx`

**Function to Replace**: `generateMockResponse()`

**Recommended APIs**:
- **Google Gemini API** - For general chat responses
- **Groq Cloud API** - For fast inference

**Implementation Example**:
```typescript
async function sendToGeminiAPI(input: string, model: "basic" | "deep"): Promise<string> {
  const apiKey = localStorage.getItem("pengu-gemini-api-key");
  if (!apiKey) {
    throw new Error("API key not configured");
  }

  const modelName = model === "deep" ? "gemini-pro" : "gemini-flash";
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: input }] }]
      })
    }
  );

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
```

### 2. PDF Text Extraction (FileUploadHandler.tsx)

**Location**: `/src/app/components/FileUploadHandler.tsx`

**Function to Replace**: `extractPDFText()`

**Recommended Library**: PDF.js

**Installation**:
```bash
pnpm add pdfjs-dist
```

**Implementation Example**:
```typescript
import * as pdfjsLib from 'pdfjs-dist';

export async function extractPDFText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}
```

### 3. Image OCR / Vision (FileUploadHandler.tsx)

**Location**: `/src/app/components/FileUploadHandler.tsx`

**Function to Replace**: `extractImageText()`

**Recommended API**: Google Gemini Vision

**Implementation Example**:
```typescript
export async function extractImageText(file: File): Promise<string> {
  const apiKey = localStorage.getItem("pengu-gemini-api-key");
  const base64Image = await fileToBase64(file);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Extract all text from this image, including handwritten content and mathematical equations." },
            { inline_data: { mime_type: file.type, data: base64Image } }
          ]
        }]
      })
    }
  );

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### 4. YouTube Transcript (FileUploadHandler.tsx)

**Location**: `/src/app/components/FileUploadHandler.tsx`

**Function to Replace**: `fetchYouTubeTranscript()`

**Recommended API**: YouTube Transcript API (unofficial)

**Installation**:
```bash
pnpm add youtube-transcript
```

**Implementation Example**:
```typescript
import { YoutubeTranscript } from 'youtube-transcript';

export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map(item => item.text).join(' ');
  } catch (error) {
    throw new Error('Failed to fetch transcript. Video may not have captions available.');
  }
}
```

### 5. Voice Input (ChatInterface.tsx)

**Location**: `/src/app/components/ChatInterface.tsx`

**Function to Replace**: `handleVoiceInput()`

**Recommended API**: Web Speech API (built-in browser)

**Implementation Example**:
```typescript
const handleVoiceInput = () => {
  if (!('webkitSpeechRecognition' in window)) {
    showToast("Voice input not supported in this browser", "error");
    return;
  }

  const recognition = new (window as any).webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    setIsRecording(true);
    showToast("Listening...", "info");
  };

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    setInput(transcript);
    showToast("Voice transcribed successfully!", "success");
  };

  recognition.onerror = (event: any) => {
    showToast(`Voice recognition error: ${event.error}`, "error");
    setIsRecording(false);
  };

  recognition.onend = () => {
    setIsRecording(false);
  };

  if (isRecording) {
    recognition.stop();
  } else {
    recognition.start();
  }
};
```

### 6. Flashcard Generation

**Location**: `/src/app/components/ChatInterface.tsx`

**Function to Replace**: `generateFlashcards()`

**Recommended**: Use Gemini to generate structured flashcards

**Implementation Example**:
```typescript
async function generateFlashcards(content: string): Promise<string> {
  const apiKey = localStorage.getItem("pengu-gemini-api-key");
  
  const prompt = `Generate exactly 5 flashcards from this content. Format as JSON array with "front" and "back" properties. Content: ${content}`;
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await response.json();
  const flashcardsText = data.candidates[0].content.parts[0].text;
  
  // Extract JSON from markdown code block if present
  const jsonMatch = flashcardsText.match(/\[[\s\S]*\]/);
  return jsonMatch ? jsonMatch[0] : flashcardsText;
}
```

## Environment Setup

### API Keys Storage
API keys are stored in localStorage for privacy:
- `pengu-gemini-api-key` - Google Gemini API key
- `pengu-groq-api-key` - Groq Cloud API key

Users can set these in **Settings** (accessible from sidebar).

### Data Persistence
All chat data is stored in localStorage:
- `pengu-chats` - Array of all chat conversations
- `pengu-current-chat-id` - Currently active chat ID
- `pengu-welcome-seen` - Whether user has seen welcome splash

## Testing the Integration

1. **Start with Chat**: Replace `generateMockResponse()` first
2. **Add PDF Support**: Install PDF.js and replace `extractPDFText()`
3. **Enable Vision**: Integrate Gemini Vision for image analysis
4. **YouTube Integration**: Add YouTube transcript fetching
5. **Voice Input**: Implement Web Speech API

## Error Handling

Always wrap API calls with try-catch and use toast notifications:

```typescript
try {
  const response = await callAPI();
  showToast("Success!", "success");
} catch (error) {
  console.error(error);
  showToast("API call failed. Check your API key.", "error");
}
```

## Rate Limiting & Costs

- **Gemini API**: Free tier available, check quotas
- **Groq Cloud**: Fast inference, free tier available
- **YouTube Transcript**: No official API, use unofficial library
- **Web Speech API**: Free, browser-built-in

## Production Considerations

1. **Security**: Move API keys to environment variables for production
2. **Backend**: Consider using a backend proxy to hide API keys
3. **Caching**: Implement caching for repeated queries
4. **Error Boundaries**: Add React error boundaries for robust error handling
5. **Analytics**: Add usage tracking for API calls

## Useful Resources

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Groq Cloud API](https://console.groq.com/)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

## Support

All UI components are working perfectly with localStorage. If you have questions about integrating specific APIs, refer to their official documentation or create an issue in your repository.

---

**Built with ❤️ by the Pengu AI Team**

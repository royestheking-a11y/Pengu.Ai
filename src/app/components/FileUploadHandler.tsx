import { useRef } from "react";
import { FileText, Image as ImageIcon, Youtube } from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';
import { API_BASE_URL } from '../../config';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface FileUploadHandlerProps {
  onFileSelect: (file: File, type: "pdf" | "image") => void;
  onYouTubeUrl: (url: string) => void;
}

export function FileUploadHandler({ onFileSelect, onYouTubeUrl }: FileUploadHandlerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    if (fileType === "application/pdf") {
      onFileSelect(file, "pdf");
    } else if (fileType.startsWith("image/")) {
      onFileSelect(file, "image");
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    const text = e.clipboardData?.getData("text");
    if (text && isYouTubeUrl(text)) {
      onYouTubeUrl(text);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="hidden"
        id="file-upload-trigger"
      />
    </>
  );
}

function isYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
}

export function parseYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Real PDF text extraction using PDF.js
export async function extractPDFText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    const textParts: string[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      if (pageText.trim()) {
        textParts.push(`--- Page ${pageNum} ---\n${pageText}`);
      }
    }

    if (textParts.length === 0) {
      return `[PDF: ${file.name}] — This PDF appears to contain no extractable text (it may be a scanned/image PDF). Try uploading it as an image for OCR analysis.`;
    }

    return `[PDF: ${file.name}, ${totalPages} pages]\n\n${textParts.join('\n\n')}`;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return `[Error extracting text from ${file.name}]. The file may be corrupted or password-protected.`;
  }
}

// Image OCR is handled by Gemini Vision on the server side.
// When an image is uploaded, it goes to Cloudinary and the URL is sent to Gemini
// which can natively read text, handwriting, equations, diagrams, etc.
export async function extractImageText(file: File): Promise<string> {
  return `[Image: ${file.name}] — Image will be analyzed by our intelligent vision system for text extraction and analysis.`;
}

// Real YouTube transcript fetching via server API
export const fetchYouTubeTranscript = async (videoId: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/youtube/transcript?videoId=${videoId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to fetch transcript (status ${response.status})`);
  }

  const data = await response.json();
  return data.transcript || 'No transcript content available.';
};

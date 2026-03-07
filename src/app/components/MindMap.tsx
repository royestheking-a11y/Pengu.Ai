import { useEffect, useRef } from "react";
import mermaid from "mermaid";

interface MindMapProps {
  content: string;
}

export function MindMap({ content }: MindMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      themeVariables: {
        primaryColor: "#462D28",
        primaryTextColor: "#fff",
        primaryBorderColor: "#462D28",
        lineColor: "#462D28",
        secondaryColor: "#F5F2F1",
        tertiaryColor: "#fff",
      },
      flowchart: {
        padding: 20,
        nodeSpacing: 50,
        rankSpacing: 50,
      },
    });

    // Generate mind map diagram
    const renderDiagram = async () => {
      if (containerRef.current) {
        const mermaidCode = generateMermaidCode(content);
        
        // Clear previous content
        containerRef.current.innerHTML = "";
        
        try {
          // Create a unique ID for this diagram
          const id = `mermaid-${Date.now()}`;
          const { svg } = await mermaid.render(id, mermaidCode);
          containerRef.current.innerHTML = svg;
        } catch (error) {
          console.error("Error rendering mermaid diagram:", error);
          containerRef.current.innerHTML = `
            <div class="text-center p-8">
              <p class="text-gray-500 mb-4 text-sm">Mind map preview</p>
              <div class="bg-gray-100 p-6 rounded-lg max-w-2xl mx-auto">
                <div class="space-y-3 text-left">
                  <div class="flex items-center gap-3">
                    <div class="w-3 h-3 rounded-full bg-[#462D28]"></div>
                    <span class="text-sm text-gray-700">Main Topic: ${content.split('\n')[0] || 'Central Concept'}</span>
                  </div>
                  <div class="ml-6 space-y-2">
                    <div class="flex items-center gap-3">
                      <div class="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span class="text-sm text-gray-600">Subtopic 1</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span class="text-sm text-gray-600">Subtopic 2</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span class="text-sm text-gray-600">Subtopic 3</span>
                    </div>
                  </div>
                </div>
              </div>
              <p class="text-xs text-gray-400 mt-4">Connect API for full visualization</p>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [content]);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
      <div ref={containerRef} className="w-full max-w-4xl" />
    </div>
  );
}

function generateMermaidCode(content: string): string {
  // This is a simplified mind map generator
  // In production, you'd use AI to generate proper structure
  
  // Helper function to sanitize text for Mermaid
  const sanitizeText = (text: string): string => {
    return text
      .replace(/"/g, '') // Remove quotes
      .replace(/'/g, '') // Remove single quotes
      .replace(/\[/g, '(') // Replace brackets
      .replace(/\]/g, ')')
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\|/g, '-') // Replace pipes
      .replace(/[<>{}]/g, '') // Remove angle brackets and braces
      .substring(0, 40) // Limit length
      .trim();
  };
  
  // Try to extract key points from content
  const lines = content.split("\n").filter(line => line.trim() && line.length > 3);
  
  if (lines.length === 0) {
    return `graph TD
    A[Main Topic] --> B[Concept 1]
    A --> C[Concept 2]
    A --> D[Concept 3]
    B --> E[Detail 1]
    B --> F[Detail 2]
    C --> G[Detail 3]
    D --> H[Detail 4]
    
    style A fill:#462D28,stroke:#462D28,color:#fff
    style B fill:#F5F2F1,stroke:#462D28
    style C fill:#F5F2F1,stroke:#462D28
    style D fill:#F5F2F1,stroke:#462D28`;
  }

  // Generate a mind map structure
  let mermaidCode = "graph TD\n";
  const mainTopic = sanitizeText(lines[0]) || "Main Topic";
  mermaidCode += `    A["${mainTopic}"]\n`;

  const branches = Math.min(lines.length - 1, 6);
  for (let i = 0; i < branches; i++) {
    const branchText = sanitizeText(lines[i + 1]) || `Concept ${i + 1}`;
    const nodeId = String.fromCharCode(66 + i); // B, C, D, etc.
    mermaidCode += `    A --> ${nodeId}["${branchText}"]\n`;
    
    // Add sub-branches for some nodes
    if (i < 3 && lines[i + branches + 1]) {
      const subBranchText = sanitizeText(lines[i + branches + 1]) || `Detail ${i + 1}`;
      const subNodeId = nodeId + "1";
      mermaidCode += `    ${nodeId} --> ${subNodeId}["${subBranchText}"]\n`;
    }
  }

  // Add styling
  mermaidCode += `\n    style A fill:#462D28,stroke:#462D28,color:#fff\n`;
  for (let i = 0; i < branches; i++) {
    const nodeId = String.fromCharCode(66 + i);
    mermaidCode += `    style ${nodeId} fill:#F5F2F1,stroke:#462D28\n`;
  }

  return mermaidCode;
}
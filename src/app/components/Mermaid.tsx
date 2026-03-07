import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
    chart: string;
}

// Initialize mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'inherit',
});

let idCounter = 0;

export const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgContent, setSvgContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const renderGraph = async () => {
            if (!chart.trim()) return;

            try {
                idCounter++;
                const id = `mermaid-chart-${idCounter}`;
                const { svg } = await mermaid.render(id, chart);

                if (mounted) {
                    setSvgContent(svg);
                    setError(null);
                }
            } catch (err: any) {
                console.error("Mermaid parsing error:", err);
                if (mounted) {
                    setError(err?.message || "Failed to render mind map");
                    setSvgContent('');
                }
            }
        };

        renderGraph();

        return () => {
            mounted = false;
        };
    }, [chart]);

    if (error) {
        return (
            <div className="bg-red-50 text-red-500 p-4 rounded-lg text-sm my-2 font-mono whitespace-pre-wrap">
                <p className="font-semibold mb-2">Diagram Error:</p>
                {error}
            </div>
        );
    }

    if (!svgContent) {
        return <div className="text-gray-500 animate-pulse my-2">Rendering diagram...</div>;
    }

    return (
        <div
            ref={containerRef}
            className="mermaid-wrapper bg-white border border-gray-200 rounded-xl p-4 my-4 shadow-sm overflow-x-auto flex justify-center"
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />
    );
};

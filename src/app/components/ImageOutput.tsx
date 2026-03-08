import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, Info, Sparkles, Loader2, AlertCircle, X } from 'lucide-react';

interface ImageOutputProps {
    url?: string;
    status: 'loading' | 'finished' | 'error';
    prompt?: string;
    errorMessage?: string;
}

export const ImageOutput: React.FC<ImageOutputProps> = ({ url, status, prompt, errorMessage }) => {
    const [imgLoaded, setImgLoaded] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [dots, setDots] = useState('');

    // Animated "..." for loading state
    useEffect(() => {
        if (status !== 'loading') return;
        const interval = setInterval(() => {
            setDots(d => d.length >= 3 ? '' : d + '.');
        }, 500);
        return () => clearInterval(interval);
    }, [status]);

    const handleDownload = () => {
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.download = `pengu-gen-${Date.now()}.png`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // ── LOADING STATE ────────────────────────────────────────────────
    if (status === 'loading') {
        return (
            <div className="image-gen-card image-gen-loading">
                <div className="image-gen-shimmer" />
                <div className="image-gen-loading-inner">
                    <div className="image-gen-icon-ring">
                        <Loader2 className="image-gen-spin" size={28} />
                        <div className="image-gen-sparkle-badge">
                            <Sparkles size={12} />
                        </div>
                    </div>
                    <p className="image-gen-loading-title">Pengu is creating your image{dots}</p>
                    {prompt && (
                        <p className="image-gen-loading-prompt">"{prompt}"</p>
                    )}
                    <div className="image-gen-progress-bar">
                        <div className="image-gen-progress-fill" />
                    </div>
                </div>
            </div>
        );
    }

    // ── ERROR STATE ──────────────────────────────────────────────────
    if (status === 'error' || !url) {
        return (
            <div className="image-gen-card image-gen-error">
                <div className="image-gen-error-inner">
                    <AlertCircle size={24} className="image-gen-error-icon" />
                    <div>
                        <p className="image-gen-error-title">Image generation failed</p>
                        <p className="image-gen-error-sub">{errorMessage || 'Please try again in a moment.'}</p>
                    </div>
                </div>
            </div>
        );
    }

    // ── SUCCESS STATE ────────────────────────────────────────────────
    return (
        <div className="image-gen-card image-gen-success">
            {/* Info overlay */}
            {showInfo && (
                <div className="image-gen-info-overlay">
                    <div className="image-gen-info-header">
                        <span>Image Details</span>
                        <button onClick={() => setShowInfo(false)}><X size={14} /></button>
                    </div>
                    <div className="image-gen-info-body">
                        <div className="image-gen-info-row"><span>Render Engine</span><span>Pengu Premium Render</span></div>
                        <div className="image-gen-info-row"><span>Resolution</span><span>1024 × 1024</span></div>
                        <div className="image-gen-info-row"><span>Optimization</span><span>High-Res Digital Art</span></div>
                        {prompt && <div className="image-gen-info-prompt">"{prompt}"</div>}
                    </div>
                </div>
            )}

            {/* Image */}
            <div className="image-gen-img-wrap">
                {!imgLoaded && (
                    <div className="image-gen-img-placeholder">
                        <Loader2 className="image-gen-spin" size={24} />
                    </div>
                )}
                <img
                    src={url}
                    alt={prompt || 'AI Generated Image'}
                    className={`image-gen-img ${imgLoaded ? 'image-gen-img-visible' : 'image-gen-img-hidden'}`}
                    onLoad={() => setImgLoaded(true)}
                />

                {/* Hover overlay */}
                <div className="image-gen-hover-overlay">
                    <button
                        className="image-gen-hover-btn"
                        onClick={() => window.open(url, '_blank')}
                        title="Open full size"
                    >
                        <ExternalLink size={20} />
                    </button>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="image-gen-bar">
                <div className="image-gen-bar-meta">
                    <span className="image-gen-badge">AI Render</span>
                    <span className="image-gen-meta-text">1024 × 1024</span>
                </div>
                <div className="image-gen-bar-actions">
                    <button
                        className="image-gen-action-btn image-gen-action-ghost"
                        onClick={() => setShowInfo(!showInfo)}
                        title="Details"
                    >
                        <Info size={15} />
                    </button>
                    <button
                        className="image-gen-action-btn image-gen-action-ghost"
                        onClick={() => window.open(url, '_blank')}
                        title="View"
                    >
                        <ExternalLink size={15} />
                        <span>View</span>
                    </button>
                    <button
                        className="image-gen-action-btn image-gen-action-primary"
                        onClick={handleDownload}
                        title="Download"
                    >
                        <Download size={15} />
                        <span>Download</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

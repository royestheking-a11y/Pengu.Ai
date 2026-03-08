import { X, AlertTriangle, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info";
    icon?: "logout" | "warning";
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger",
    icon = "logout"
}: ConfirmationModalProps) {
    const [isRendered, setIsRendered] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
        } else {
            const timer = setTimeout(() => setIsRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isRendered) return null;

    return (
        <div
            className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
        >
            {/* Backdrop with heavy blur */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className={`relative w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-300 transform ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
                    }`}
            >
                {/* Glow Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[#462D28]/30 to-transparent" />

                <div className="p-8">
                    {/* Header Icon */}
                    <div className="flex justify-center mb-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${type === "danger"
                                ? "bg-red-50 text-red-600 shadow-[0_0_20px_rgba(220,38,38,0.1)]"
                                : "bg-orange-50 text-orange-600 shadow-[0_0_20px_rgba(234,88,12,0.1)]"
                            }`}>
                            {icon === "logout" ? <LogOut className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-center space-y-2 mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {title}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed px-4">
                            {message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold transition-all active:scale-[0.98] outline-none"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-6 py-3.5 text-white rounded-2xl font-semibold transition-all active:scale-[0.98] shadow-lg outline-none ${type === "danger"
                                    ? "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                                    : "bg-[#462D28] hover:bg-[#5a3a34] shadow-brown-500/20"
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>

                {/* Subtle Bottom Bar */}
                <div className="h-1.5 bg-gray-50/50 w-full" />
            </div>
        </div>
    );
}

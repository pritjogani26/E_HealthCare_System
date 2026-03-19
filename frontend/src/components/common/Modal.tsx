// frontend\src\components\common\Modal.tsx
import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "full";
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = "lg"
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-xl",
        lg: "max-w-4xl",
        xl: "max-w-6xl",
        full: "max-w-full m-4"
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(26, 60, 110, 0.35)" }}
        >
            <div
                ref={modalRef}
                className={`w-full max-h-[90vh] overflow-y-auto flex flex-col ${sizeClasses[size]}`}
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "10px",
                    boxShadow: "0 4px 24px rgba(26, 60, 110, 0.14)",
                    border: "1px solid #d0dff0",
                }}
            >
                {/* Header */}
                <div
                    className="sticky top-0 p-5 flex items-center justify-between z-10 shrink-0"
                    style={{
                        backgroundColor: "#e8f0f7",
                        borderBottom: "1px solid #d0dff0",
                    }}
                >
                    <h3
                        className="text-xl font-semibold"
                        style={{ color: "#1a3c6e" }}
                    >
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: "#555555" }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#d0dff0";
                            (e.currentTarget as HTMLButtonElement).style.color = "#1a3c6e";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                            (e.currentTarget as HTMLButtonElement).style.color = "#555555";
                        }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};
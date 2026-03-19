// frontend\src\components\common\LoadingState.tsx
import React from "react";

interface LoadingStateProps {
    message?: string;
    isOverlay?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
    message = "Loading...",
    isOverlay = false
}) => {
    const content = (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-sm" style={{ color: "#555555" }}>{message}</div>
        </div>
    );

    if (isOverlay) {
        return (
            <div
                className="absolute inset-0 backdrop-blur-sm flex items-center justify-center z-50"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.5)" }}
            >
                <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2"
                    style={{ borderColor: "#1a3c6e" }}
                ></div>
            </div>
        );
    }

    return content;
};
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
            <div className="text-sm text-slate-600">{message}</div>
        </div>
    );

    if (isOverlay) {
        return (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return content;
};

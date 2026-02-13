import React from "react";

interface ErrorStateProps {
    message: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message }) => {
    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
                {message}
            </div>
        </div>
    );
};

// frontend\src\components\common\PageHeader.tsx
import React from "react";

interface PageHeaderProps {
    title: string;
    description: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
    return (
        <div className="mb-6">
            <h2
                className="text-2xl font-semibold mb-1"
                style={{ color: "#1a3c6e" }}
            >
                {title}
            </h2>
            <p className="text-sm" style={{ color: "#555555" }}>{description}</p>
        </div>
    );
};
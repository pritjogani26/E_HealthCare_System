import React from "react";

interface PageHeaderProps {
    title: string;
    description: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
    return (
        <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-800 mb-1">{title}</h2>
            <p className="text-slate-600 text-sm">{description}</p>
        </div>
    );
};

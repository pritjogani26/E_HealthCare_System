import React from "react";
import { LucideIcon } from "lucide-react";

interface InfoRowProps {
    icon: LucideIcon;
    label: string;
    value: any;
    className?: string;
}

export const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value, className = "" }) => {
    if (!value && value !== 0) return null;
    return (
        <div className={`flex items-start gap-3 p-3 bg-slate-50 rounded-lg ${className}`}>
            <Icon className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
                <p className="text-sm text-slate-800 font-medium break-words">{value}</p>
            </div>
        </div>
    );
};

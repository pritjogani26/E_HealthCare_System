import React from "react";
import { AlertCircle } from "lucide-react";

interface StatusBadgeProps {
    status: string | boolean;
    type?: 'verification' | 'active';
    label?: string;
    showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    type = 'verification',
    label,
    showIcon = true
}) => {
    const getVerificationClass = (s: string) => {
        switch (s) {
            case 'VERIFIED': return 'bg-blue-100 text-blue-800';
            case 'PENDING': return 'bg-amber-100 text-amber-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getActiveClass = (active: boolean) => {
        return active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800";
    };

    const className = type === 'verification'
        ? getVerificationClass(status as string)
        : getActiveClass(status as boolean);

    const displayText = label || (typeof status === 'boolean' ? (status ? 'Active' : 'Inactive') : status);

    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
            {showIcon && type === 'verification' && status === 'PENDING' && <AlertCircle className="w-3 h-3" />}
            {displayText}
        </span>
    );
};

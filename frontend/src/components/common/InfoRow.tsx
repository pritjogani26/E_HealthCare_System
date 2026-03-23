// frontend\src\components\common\InfoRow.tsx
import React from "react";
import { LucideIcon } from "lucide-react";

interface InfoRowProps {
  icon: LucideIcon;
  label: string;
  value: any;
  className?: string;
}

export const InfoRow: React.FC<InfoRowProps> = ({
  icon: Icon,
  label,
  value,
  className = "",
}) => {
  if (!value && value !== 0) return null;
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg ${className}`}
      style={{ backgroundColor: "#e8f0f7" }}
    >
      <Icon
        className="w-5 h-5 mt-0.5 flex-shrink-0"
        style={{ color: "#36454F" }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium mb-0.5" style={{ color: "#555555" }}>
          {label}
        </p>
        <p
          className="text-sm font-medium break-words"
          style={{ color: "#1a3c6e" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
};

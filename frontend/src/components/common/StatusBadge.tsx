// frontend\src\components\common\StatusBadge.tsx
import React from "react";
import { AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string | boolean;
  type?: "verification" | "active";
  label?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = "verification",
  label,
  showIcon = true,
}) => {
  const getVerificationStyle = (s: string): React.CSSProperties => {
    switch (s) {
      case "VERIFIED":
        return { backgroundColor: "#e8f0f7", color: "#1a3c6e" };
      case "PENDING":
        return { backgroundColor: "#fef3c7", color: "#92400e" };
      case "REJECTED":
        return { backgroundColor: "#fee2e2", color: "#991b1b" };
      default:
        return { backgroundColor: "#e8f0f7", color: "#555555" };
    }
  };

  const getActiveStyle = (active: boolean): React.CSSProperties => {
    return active
      ? { backgroundColor: "#e8f0f7", color: "#1a3c6e" }
      : { backgroundColor: "#fee2e2", color: "#991b1b" };
  };

  const badgeStyle =
    type === "verification"
      ? getVerificationStyle(status as string)
      : getActiveStyle(status as boolean);

  const displayText =
    label ||
    (typeof status === "boolean" ? (status ? "Active" : "Inactive") : status);

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={badgeStyle}
    >
      {showIcon && type === "verification" && status === "PENDING" && (
        <AlertCircle className="w-3 h-3" />
      )}
      {displayText}
    </span>
  );
};
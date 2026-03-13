// src/components/common/FieldError.tsx

import React from "react";
import { AlertCircle } from "lucide-react";

interface FieldErrorProps {
  /** The error message to display. Renders nothing when undefined / empty. */
  message?: string;
}

export const FieldError: React.FC<FieldErrorProps> = React.memo(
  ({ message }) => {
    if (!message) return null;
    return (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 shrink-0" />
        {message}
      </p>
    );
  }
);

FieldError.displayName = "FieldError";
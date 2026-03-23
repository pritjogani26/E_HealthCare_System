import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  message: string;
  requireReason?: boolean;
  reasonLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export const ActionConfirmationModal: React.FC<
  ActionConfirmationModalProps
> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  requireReason = true,
  reasonLabel = "Reason",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
}) => {
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setStep(1);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleInitialConfirm = () => {
    if (requireReason) {
      setStep(2);
    } else {
      onConfirm("");
    }
  };

  const handleFinalConfirm = () => {
    onConfirm(reason);
  };

  const handleClose = () => {
    setReason("");
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-8 sm:pt-16 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity"
        style={{ backgroundColor: "rgba(26, 60, 110, 0.35)" }}
        onClick={!loading ? handleClose : undefined}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-md flex flex-col overflow-hidden"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #e8f0f7",
          boxShadow: "0 4px 20px rgba(26, 60, 110, 0.12)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{
            backgroundColor: "#e8f0f7",
            borderBottom: "1px solid #d0dff0",
          }}
        >
          <h3 className="text-base font-semibold" style={{ color: "#1a3c6e" }}>
            {step === 1 ? title : "Additional Details"}
          </h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-md transition-colors disabled:opacity-50"
            style={{ color: "#555555" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#d0dff0";
              (e.currentTarget as HTMLButtonElement).style.color = "#1a3c6e";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#555555";
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {step === 1 ? (
            <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>
              {message}
            </p>
          ) : (
            <div className="space-y-2">
              <label
                className="block text-sm font-medium"
                style={{ color: "#1a3c6e" }}
              >
                {reasonLabel} <span style={{ color: "#36454F" }}>*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 text-sm resize-none outline-none transition-shadow rounded-md"
                style={{
                  border: "1px solid #d0dff0",
                  color: "#1a3c6e",
                  backgroundColor: "#ffffff",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid #36454F";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(244, 121, 32, 0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid #d0dff0";
                  e.currentTarget.style.boxShadow = "none";
                }}
                rows={3}
                placeholder="Please provide a reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3.5 flex justify-end gap-2.5"
          style={{
            backgroundColor: "#e8f0f7",
            borderTop: "1px solid #d0dff0",
          }}
        >
          {step === 1 ? (
            <>
              <button
                className="px-4 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                style={{
                  color: "#1a3c6e",
                  backgroundColor: "#ffffff",
                  border: "1px solid #d0dff0",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#d0dff0";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#ffffff";
                }}
                onClick={handleClose}
                disabled={loading}
              >
                {cancelLabel}
              </button>
              <button
                className="px-4 py-1.5 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50"
                style={{ backgroundColor: "#1a3c6e" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#2e5fa3";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#1a3c6e";
                }}
                onClick={handleInitialConfirm}
                disabled={loading}
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <>
              <button
                className="px-4 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                style={{
                  color: "#1a3c6e",
                  backgroundColor: "#ffffff",
                  border: "1px solid #d0dff0",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#d0dff0";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#ffffff";
                }}
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back
              </button>
              <button
                className="px-4 py-1.5 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[70px]"
                style={{ backgroundColor: "#1a3c6e" }}
                onMouseEnter={(e) => {
                  if (!loading && reason.trim()) {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "#2e5fa3";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#1a3c6e";
                }}
                onClick={handleFinalConfirm}
                disabled={loading || !reason.trim()}
              >
                {loading ? "Saving..." : confirmLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

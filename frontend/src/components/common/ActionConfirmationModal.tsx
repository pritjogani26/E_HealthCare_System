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

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
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
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={!loading ? handleClose : undefined} 
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-base font-semibold text-slate-900">
            {step === 1 ? title : "Additional Details"}
          </h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {step === 1 ? (
            <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                {reasonLabel} <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none outline-none transition-shadow"
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
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
          {step === 1 ? (
            <>
              <button
                className="px-4 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                onClick={handleClose}
                disabled={loading}
              >
                {cancelLabel}
              </button>
              <button
                className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
                onClick={handleInitialConfirm}
                disabled={loading}
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <>
              <button
                className="px-4 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back
              </button>
              <button
                className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-w-[70px]"
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

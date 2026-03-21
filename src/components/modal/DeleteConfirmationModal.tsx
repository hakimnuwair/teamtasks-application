/**
 * components/modal/DeleteConfirmModal.tsx
 *
 * Reusable delete confirmation dialog.
 * Replaces window.confirm() across the entire app.
 *
 * Features:
 *   - Animated slide-up modal with red danger styling
 *   - Shows the item title so the user knows what they're deleting
 *   - Loading spinner on the confirm button during the async delete
 *   - Displays the real backend error message if the delete fails
 *   - Escape key and backdrop click to cancel
 *   - Fully dark-mode aware
 */
import { useEffect, useState } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "../ui";

interface Props {
  isOpen: boolean;
  title: string; // Item name shown in the dialog
  description?: string; // Optional extra context
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
      setError(null);
    }
  }, [isOpen]);

  // Escape key to cancel
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, isDeleting, onCancel]);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      // onConfirm is responsible for closing the modal on success
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not delete. Please try again.";
      setError(msg);
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-[3px] animate-[fadeIn_150ms_ease-out]"
        onClick={() => !isDeleting && onCancel()}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl p-6 space-y-5",
          "bg-white dark:bg-[#161B22]",
          "border border-[#E2E6ED] dark:border-[#21262D]",
          "shadow-[0_24px_60px_rgba(15,23,42,0.18)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.70)]",
          "animate-[slideUp_200ms_cubic-bezier(0.16,1,0.3,1)]",
        )}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F0F6FC] hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-[250ms] disabled:opacity-40"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)]",
              "shadow-[0_0_0_4px_rgba(244,63,94,0.08)] dark:shadow-[0_0_0_4px_rgba(244,63,94,0.12)]",
            )}
          >
            <Trash2 className="w-5 h-5 text-[#F43F5E]" />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide">
              Delete reminder?
            </h3>
            <p className="text-sm text-[#475569] dark:text-[#8B949E] mt-1 leading-relaxed">
              {description ?? (
                <>
                  <span className="font-medium text-[#0F172A] dark:text-[#F0F6FC]">
                    "{title}"
                  </span>{" "}
                  will be permanently deleted. This cannot be undone.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Error message from backend */}
        {error && (
          <div
            className={cn(
              "flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm",
              "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.10)]",
              "border border-[#FECDD3] dark:border-[rgba(244,63,94,0.25)]",
              "text-[#BE123C] dark:text-[#FDA4AF]",
              "animate-[fadeIn_150ms_ease-out]",
            )}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className={cn(
              "flex-1 h-10 px-4 rounded-xl text-sm font-medium",
              "flex items-center justify-center gap-2",
              "bg-gradient-to-r from-[#F43F5E] to-[#E11D48] text-white",
              "shadow-sm shadow-[rgba(244,63,94,0.30)]",
              "hover:brightness-110 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(244,63,94,0.40)]",
              "active:brightness-95 active:translate-y-0",
              "transition-all duration-[250ms]",
              "disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0",
            )}
          >
            {isDeleting ? (
              <>
                <svg
                  className="w-3.5 h-3.5 animate-spin shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}

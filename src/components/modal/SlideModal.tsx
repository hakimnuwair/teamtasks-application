/**
 * components/modal/SlideModal.tsx
 *
 * Reusable slide-in-from-right modal shell.
 * Used by: CreateReminderModal, CreateGroupModal, and any future panel.
 *
 * STYLE DECISIONS:
 *  Backdrop   → rgba(0,0,0,0.40) light / rgba(0,0,0,0.65) dark — §6
 *  Panel bg   → glass-strong §2.6: bg-white/96 dark:bg-[#161B22]/98 + backdrop-blur-xl
 *  Border     → left border only: border-l border-[#E2E6ED] dark:#21262D — §2.1/2.2
 *  Slide anim → translate-x-full → translate-x-0 via CSS transition 350ms ease-out — §7.2
 *  Width      → w-full max-w-[480px] — panel never wider than 480px
 *  z-index    → z-50 (above topbar z-40, below toasts)
 *  Close on backdrop click and Escape key
 */

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

interface SlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Extra classes on the panel (e.g. custom width override) */
  className?: string;
  /** Slot for header-right action (e.g. a secondary button) */
  headerAction?: ReactNode;
}

export function SlideModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className,
  headerAction,
}: SlideModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* ── Backdrop ───────────────────────────────────────────────────────── */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-50",
          // §6 backdrop: semi-transparent dark overlay
          "bg-black/40 dark:bg-black/65",
          "backdrop-blur-[2px]",
          // Fade transition — §7.1 250ms
          "transition-opacity duration-[250ms]",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        aria-hidden="true"
      />

      {/* ── Panel ──────────────────────────────────────────────────────────── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          // Position: fixed right edge, full height
          "fixed top-0 right-0 bottom-0 z-50",
          "w-full max-w-[480px]",
          "flex flex-col",

          // §2.6 glass surface (near-opaque for readability)
          "bg-white dark:bg-[#161B22]",

          // Left border only — §2.1/2.2 border-default
          "border-l border-[#E2E6ED] dark:border-[#21262D]",

          // §6 shadow-xl from left
          "shadow-[-12px_0_40px_rgba(15,23,42,0.12),_-1px_0_0_rgba(15,23,42,0.06)]",
          "dark:shadow-[-12px_0_40px_rgba(0,0,0,0.55),_-1px_0_0_rgba(255,255,255,0.03)]",

          // Slide animation — §7.2 panel slide-in
          "transition-transform duration-[350ms] ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",

          className,
        )}
      >
        {/* ── Modal header ─────────────────────────────────────────────────── */}
        <div
          className={cn(
            "flex items-start justify-between gap-4 px-6 py-5 shrink-0",
            // Divider below header — §14
            "border-b border-[#E2E6ED] dark:border-[#21262D]",
          )}
        >
          <div>
            {/* §3.2 H3 size — §3.3 text-primary */}
            <h2 className="text-lg font-semibold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            {headerAction}
            {/* Close button — §9.2 ghost icon */}
            <button
              onClick={onClose}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                "text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F0F6FC]",
                "hover:bg-black/5 dark:hover:bg-white/5",
                "transition-all duration-[250ms]",
              )}
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Scrollable content area ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {children}
        </div>
      </aside>
    </>
  );
}

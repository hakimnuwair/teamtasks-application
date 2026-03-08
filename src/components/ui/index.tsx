/**
 * ui/index.tsx — Shared UI Primitives
 *
 * Every component here is styled inline with Tailwind.
 * Refer to STYLES_README.md for design decisions.
 *
 * Exports:
 *   Button, Badge, Avatar, AvatarStack, Spinner,
 *   EmptyState, Card, SkeletonLine
 */

import { type ReactNode, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon-sm" | "icon-md";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const buttonBase = [
  "inline-flex items-center justify-center gap-2",
  "font-medium rounded-lg border border-transparent",
  "transition-all duration-200 ease-out",
  "cursor-pointer select-none whitespace-nowrap",
  "disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none",
  "focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2",
].join(" ");

const buttonVariants = {
  primary: [
    "bg-gradient-to-r from-indigo-600 to-teal-500 text-white",
    "shadow-sm shadow-indigo-500/20",
    "hover:brightness-110 hover:-translate-y-px hover:shadow-md hover:shadow-indigo-500/30",
    "active:brightness-95 active:translate-y-0",
  ].join(" "),

  secondary: [
    "bg-white/80 dark:bg-[#161B22]/80 backdrop-blur-sm",
    "text-[#0F172A] dark:text-[#F0F6FC]",
    "border-[#E2E6ED] dark:border-[#21262D]",
    "shadow-[0_1px_3px_rgba(15,23,42,0.08)]",
    "hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
    "hover:shadow-md hover:-translate-y-px",
  ].join(" "),

  ghost: [
    "bg-transparent text-[#475569] dark:text-[#8B949E]",
    "hover:bg-black/5 dark:hover:bg-white/5",
    "hover:text-[#0F172A] dark:hover:text-[#F0F6FC]",
  ].join(" "),

  danger: [
    "bg-gradient-to-r from-coral-500 to-orange-500 text-white",
    "shadow-sm",
    "hover:brightness-110 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(244,63,94,0.35)]",
    "active:brightness-95 active:translate-y-0",
  ].join(" "),

  outline: [
    "bg-transparent text-indigo-600 dark:text-indigo-400",
    "border-indigo-600 dark:border-indigo-400",
    "shadow-[0_0_8px_rgba(79,70,229,0.18)]",
    "hover:bg-indigo-50 dark:hover:bg-indigo-500/10",
    "hover:shadow-[0_0_16px_rgba(79,70,229,0.30)] hover:-translate-y-px",
  ].join(" "),
};

const buttonSizes = {
  sm: "h-8  px-3.5 text-[11px] gap-1.5 rounded-md",
  md: "h-10 px-4.5 text-[13px]",
  lg: "h-12 px-6   text-base rounded-xl",
  "icon-sm": "h-8  w-8  p-0 rounded-md",
  "icon-md": "h-10 w-10 p-0",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        buttonBase,
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────────────────────────────────────

interface BadgeProps {
  variant:
    | "pending"
    | "completed"
    | "overdue"
    | "high"
    | "medium"
    | "low"
    | "default";
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

const badgeVariants = {
  pending: {
    wrap: "bg-[#EEF2FF] dark:bg-indigo-500/14 text-[#4338CA] dark:text-[#A5B4FC] border border-[#C7D2FE] dark:border-indigo-500/30 shadow-[0_0_6px_rgba(79,70,229,0.18)] dark:shadow-[0_0_6px_rgba(99,102,241,0.28)]",
    dot: "bg-[#6366F1] dark:bg-[#818CF8]",
  },
  completed: {
    wrap: "bg-[#F0FDF4] dark:bg-emerald-500/12 text-[#16A34A] dark:text-[#86EFAC] border border-[#BBF7D0] dark:border-emerald-500/25 shadow-[0_0_6px_rgba(22,163,74,0.15)] dark:shadow-[0_0_6px_rgba(34,197,94,0.22)]",
    dot: "bg-[#22C55E] dark:bg-[#4ADE80]",
  },
  overdue: {
    wrap: "bg-[#FFF1F2] dark:bg-coral-500/14 text-[#BE123C] dark:text-[#FDA4AF] border border-[#FECDD3] dark:border-coral-500/28 shadow-[0_0_6px_rgba(244,63,94,0.18)] dark:shadow-[0_0_6px_rgba(244,63,94,0.28)]",
    dot: "bg-[#F43F5E] dark:bg-[#FB7185]",
  },
  high: {
    wrap: "bg-[#FFF1F2] dark:bg-coral-500/14 text-[#BE123C] dark:text-[#FDA4AF]",
    dot: "bg-[#F43F5E] dark:bg-[#FB7185]",
  },
  medium: {
    wrap: "bg-[#FFFBEB] dark:bg-amber-500/12 text-[#B45309] dark:text-[#FCD34D]",
    dot: "bg-[#F59E0B] dark:bg-[#FBBF24]",
  },
  low: {
    wrap: "bg-[#F8FAFC] dark:bg-slate-500/08 text-[#64748B] dark:text-[#64748B]",
    dot: "bg-[#94A3B8] dark:bg-[#475569]",
  },
  default: {
    wrap: "bg-black/5 dark:bg-white/8 text-[#475569] dark:text-[#8B949E]",
    dot: "bg-[#94A3B8]",
  },
};

export function Badge({
  variant,
  children,
  dot = true,
  className,
}: BadgeProps) {
  const v = badgeVariants[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full",
        "text-[11px] font-medium tracking-wide whitespace-nowrap",
        v.wrap,
        className,
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", v.dot)} />
      )}
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────────────────────

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}

const avatarSizes = {
  xs: "w-5 h-5 text-[8px]",
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-[13px]",
  lg: "w-11 h-11 text-[16px]",
  xl: "w-14 h-14 text-[20px]",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Consistent color from name
const AVATAR_COLORS = [
  "from-indigo-500 to-indigo-700",
  "from-teal-500 to-teal-700",
  "from-violet-500 to-violet-700",
  "from-fuchsia-500 to-pink-600",
  "from-orange-500 to-red-600",
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
];

function nameToColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function Avatar({ name, size = "md", online, className }: AvatarProps) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          avatarSizes[size],
          "rounded-full flex items-center justify-center font-semibold text-white",
          "bg-gradient-to-br",
          nameToColor(name),
        )}
      >
        {getInitials(name)}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-teal-500 border-2 border-white dark:border-[#161B22] shadow-[0_0_6px_rgba(20,184,166,0.60)]" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR STACK
// ─────────────────────────────────────────────────────────────────────────────

interface AvatarStackProps {
  users: { _id: string; name: string }[];
  max?: number;
  size?: "xs" | "sm" | "md";
}

export function AvatarStack({ users, max = 3, size = "sm" }: AvatarStackProps) {
  const visible = users.slice(0, max);
  const rest = users.length - max;

  return (
    <div className="flex flex-row-reverse items-center">
      {rest > 0 && (
        <div
          className={cn(
            avatarSizes[size],
            "rounded-full flex items-center justify-center text-[10px] font-semibold",
            "bg-[#EEF0F4] dark:bg-[#21262D] text-[#475569] dark:text-[#8B949E]",
            "border-2 border-white dark:border-[#161B22] -ml-2",
          )}
        >
          +{rest}
        </div>
      )}
      {[...visible].reverse().map((u) => (
        <div key={u._id} className="-ml-2">
          <Avatar
            name={u.name}
            size={size}
            className="border-2 border-white dark:border-[#161B22]"
          />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPINNER
// ─────────────────────────────────────────────────────────────────────────────

export function Spinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const s = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-7 h-7" }[size];
  return (
    <Loader2
      className={cn(
        s,
        "animate-spin text-indigo-600 dark:text-indigo-400",
        className,
      )}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-64">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-[#94A3B8]">Loading...</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] dark:bg-indigo-500/12 flex items-center justify-center text-indigo-400 dark:text-indigo-500 mb-4 shadow-[0_0_24px_rgba(79,70,229,0.12)]">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[#0F172A] dark:text-[#F0F6FC] mb-1.5 tracking-wide">
        {title}
      </h3>
      <p className="text-sm text-[#94A3B8] max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className,
  hover,
  glass,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border p-5",
        "transition-all duration-200",
        glass
          ? [
              "bg-white/60 dark:bg-[#161B22]/72",
              "backdrop-blur-xl",
              "border-white/45 dark:border-white/06",
              "shadow-[0_8px_32px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.60)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)]",
            ]
          : [
              "bg-white dark:bg-[#161B22]",
              "border-[#E2E6ED] dark:border-[#21262D]",
              "shadow-[0_2px_8px_rgba(15,23,42,0.06),0_0_1px_rgba(15,23,42,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35),0_0_1px_rgba(255,255,255,0.04)]",
            ],
        hover &&
          "hover:shadow-lg dark:hover:shadow-[0_10px_20px_rgba(0,0,0,0.40)] hover:-translate-y-0.5 hover:border-[#C8CDD8] dark:hover:border-[#30363D] cursor-pointer",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md animate-pulse",
        "bg-gradient-to-r from-[#EEF0F4] via-[#E2E6ED] to-[#EEF0F4]",
        "dark:from-[#161B22] dark:via-[#21262D] dark:to-[#161B22]",
        className,
      )}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card className="space-y-3">
      <SkeletonLine className="h-4 w-3/4" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonLine
          key={i}
          className={cn("h-3", i === lines - 2 ? "w-1/3" : "w-1/2")}
        />
      ))}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT (shared form input with icon slot)
// ─────────────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
}

export function Input({
  error,
  leftIcon,
  rightElement,
  className,
  ...props
}: InputProps) {
  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
          {leftIcon}
        </div>
      )}
      <input
        className={cn(
          "w-full h-11 text-sm font-[Poppins]",
          "bg-white/82 dark:bg-[#0D1117]/90",
          "backdrop-blur-sm",
          "text-[#0F172A] dark:text-[#F0F6FC]",
          "placeholder:text-[#94A3B8]",
          "border-[1.5px] rounded-lg",
          "transition-all duration-200 outline-none",
          error
            ? "border-coral-500 focus:border-coral-500 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.18)]"
            : "border-[#E2E6ED] dark:border-[#21262D] focus:border-indigo-600 dark:focus:border-[#818CF8] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] dark:focus:shadow-[0_0_0_3px_rgba(99,102,241,0.20)]",
          "hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
          leftIcon ? "pl-10 pr-4" : "px-3.5",
          rightElement && "pr-10",
          className,
        )}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD WRAPPER (label + input + error msg)
// ─────────────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
}

export function Field({ label, error, children, required }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-[#0F172A] dark:text-[#F0F6FC] tracking-wide">
        {label}
        {required && <span className="text-coral-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-coral-500 dark:text-coral-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="text-lg font-semibold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAB
// ─────────────────────────────────────────────────────────────────────────────

export function FAB({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: ReactNode;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "fixed bottom-20 right-5 md:bottom-7 md:right-7 z-30",
        "w-14 h-14 rounded-full",
        "bg-gradient-to-br from-indigo-600 to-teal-500",
        "text-white flex items-center justify-center",
        "shadow-xl shadow-indigo-500/35 dark:shadow-indigo-500/50",
        "hover:scale-110 hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(79,70,229,0.55)]",
        "active:scale-95",
        "transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
      )}
    >
      {icon}
    </button>
  );
}

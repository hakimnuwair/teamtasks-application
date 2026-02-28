import { cn } from "../../utils/cn";

// ─── SPINNER ──────────────────────────────────────────────────────────────────

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Spinner = ({ size = "md", className }: SpinnerProps) => {
  const sizes = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-8 h-8" };
  return (
    <svg
      className={cn("animate-spin text-current", sizes[size], className)}
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
  );
};

// ─── BADGE ────────────────────────────────────────────────────────────────────

type BadgeVariant =
  | "pending"
  | "completed"
  | "overdue"
  | "low"
  | "medium"
  | "high"
  | "admin"
  | "member"
  | "default";

const badgeStyles: Record<BadgeVariant, string> = {
  pending:
    "bg-blue-50   text-blue-700   dark:bg-blue-900/40 dark:text-blue-300",
  completed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  overdue: "bg-red-50    text-red-700    dark:bg-red-900/40  dark:text-red-300",
  low: "bg-zinc-100  text-zinc-600   dark:bg-zinc-800    dark:text-zinc-400",
  medium:
    "bg-amber-50  text-amber-700  dark:bg-amber-900/40 dark:text-amber-300",
  high: "bg-red-50    text-red-700    dark:bg-red-900/40  dark:text-red-300",
  admin:
    "bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  member: "bg-zinc-100  text-zinc-600   dark:bg-zinc-800    dark:text-zinc-400",
  default:
    "bg-zinc-100  text-zinc-600   dark:bg-zinc-800    dark:text-zinc-400",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge = ({
  variant = "default",
  children,
  className,
}: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
      badgeStyles[variant],
      className,
    )}
  >
    {children}
  </span>
);

// ─── AVATAR ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const avatarColors = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

const getColor = (name: string) =>
  avatarColors[name.charCodeAt(0) % avatarColors.length];

export const Avatar = ({ name, size = "md", className }: AvatarProps) => {
  const sizes = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-semibold shrink-0",
        getColor(name),
        sizes[size],
        className,
      )}
    >
      {initials}
    </div>
  );
};

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && (
      <div className="text-zinc-300 dark:text-zinc-600 mb-4">{icon}</div>
    )}
    <p className="text-zinc-700 dark:text-zinc-300 font-medium text-base">
      {title}
    </p>
    {description && (
      <p className="text-zinc-500 text-sm mt-1 max-w-xs">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

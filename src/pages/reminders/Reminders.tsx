import { useState } from "react";
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useReminders } from "../../hooks/useReminders";
import { Button } from "../../components/ui/Button";
import {
  Badge,
  EmptyState,
  Avatar,
  Spinner,
} from "../../components/ui/Spinner";
import { cn } from "../../utils/cn";
import { formatDueDate, isOverdue } from "../../utils/formatDate";
import type { Reminder, ReminderStatus, Priority } from "../../types/types";

// ─── Status filter tabs ───────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: ReminderStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Overdue", value: "OVERDUE" },
];

const PRIORITY_OPTIONS: { label: string; value: Priority | "ALL" }[] = [
  { label: "All Priority", value: "ALL" },
  { label: "High", value: "HIGH" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Low", value: "LOW" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const PriorityDot = ({ priority }: { priority: Priority }) => {
  const colors = {
    HIGH: "bg-red-500",
    MEDIUM: "bg-amber-400",
    LOW: "bg-zinc-400",
  };
  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full shrink-0",
        colors[priority],
      )}
    />
  );
};

const StatusBadge = ({ status }: { status: ReminderStatus }) => {
  const map: Record<
    ReminderStatus,
    { variant: "pending" | "completed" | "overdue"; label: string }
  > = {
    PENDING: { variant: "pending", label: "Pending" },
    COMPLETED: { variant: "completed", label: "Completed" },
    OVERDUE: { variant: "overdue", label: "Overdue" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
};

// ─── Single reminder card ─────────────────────────────────────────────────────

interface ReminderCardProps {
  reminder: Reminder;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  isCompleting: boolean;
  isDeleting: boolean;
}

const ReminderCard = ({
  reminder,
  onComplete,
  onDelete,
  isCompleting,
  isDeleting,
}: ReminderCardProps) => {
  const overdue = isOverdue(reminder.dueDateTime, reminder.status);

  return (
    <article
      className={cn(
        "group relative flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900",
        "border transition-all duration-200",
        "hover:shadow-md dark:hover:shadow-zinc-900",
        overdue
          ? "border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
      )}
    >
      {/* Complete toggle */}
      <button
        onClick={() =>
          reminder.status !== "COMPLETED" && onComplete(reminder._id)
        }
        disabled={reminder.status === "COMPLETED" || isCompleting}
        className={cn(
          "mt-0.5 shrink-0 transition-colors",
          reminder.status === "COMPLETED"
            ? "text-emerald-500 cursor-default"
            : "text-zinc-300 dark:text-zinc-600 hover:text-violet-500 dark:hover:text-violet-400",
          "disabled:opacity-50",
        )}
        title={reminder.status === "COMPLETED" ? "Completed" : "Mark complete"}
      >
        {isCompleting ? (
          <Spinner size="sm" />
        ) : reminder.status === "COMPLETED" ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={cn(
              "font-medium text-zinc-900 dark:text-white text-sm leading-snug",
              reminder.status === "COMPLETED" &&
                "line-through text-zinc-400 dark:text-zinc-600",
            )}
          >
            {reminder.title}
          </h3>
          <StatusBadge status={reminder.status} />
        </div>

        {reminder.description && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
            {reminder.description}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-3 flex items-center gap-4 flex-wrap">
          {/* Due date */}
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              overdue
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-500 dark:text-zinc-400",
            )}
          >
            {overdue ? (
              <AlertTriangle className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {formatDueDate(reminder.dueDateTime)}
          </span>

          {/* Priority */}
          <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <PriorityDot priority={reminder.priority} />
            {reminder.priority}
          </span>

          {/* Group */}
          {reminder.groupId && (
            <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">
              {reminder.groupId.name}
            </span>
          )}

          {/* Assignees (stacked avatars) */}
          {reminder.assignedUsers.length > 0 && (
            <div className="flex -space-x-2 ml-auto">
              {reminder.assignedUsers.slice(0, 3).map((u) => (
                <Avatar
                  key={u._id}
                  name={u.name}
                  size="sm"
                  className="ring-2 ring-white dark:ring-zinc-900"
                />
              ))}
              {reminder.assignedUsers.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs text-zinc-600 dark:text-zinc-400 ring-2 ring-white dark:ring-zinc-900">
                  +{reminder.assignedUsers.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete button — appears on hover */}
      <button
        onClick={() => onDelete(reminder._id)}
        disabled={isDeleting}
        className={cn(
          "shrink-0 mt-0.5 p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600",
          "opacity-0 group-hover:opacity-100 transition-all duration-150",
          "hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500",
          "disabled:opacity-50",
        )}
        title="Delete reminder"
      >
        {isDeleting ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </article>
  );
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────

const ReminderSkeleton = () => (
  <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-pulse">
    <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 mt-0.5 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
      <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
      <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4 mt-2" />
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const RemindersPage = () => {
  // Local UI state — confirm dialog before delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<ReminderStatus | "ALL">(
    "ALL",
  );
  const [activePriority, setActivePriority] = useState<Priority | "ALL">("ALL");

  /**
   * useReminders hook:
   * 1. Reads current filters from reminderStore
   * 2. Fetches from API via reminder.service
   * 3. Writes result back into reminderStore
   * 4. Exposes actions: complete(), remove(), setFilters()
   */
  const {
    reminders,
    pagination,
    isLoading,
    error,
    setFilters,
    complete,
    remove,
  } = useReminders();

  // ── Filter handlers ────────────────────────────────────────────────────────
  const handleStatusChange = (status: ReminderStatus | "ALL") => {
    setActiveStatus(status);
    setFilters({ status: status === "ALL" ? undefined : status, page: 1 });
  };

  const handlePriorityChange = (priority: Priority | "ALL") => {
    setActivePriority(priority);
    setFilters({
      priority: priority === "ALL" ? undefined : priority,
      page: 1,
    });
  };

  // ── Complete handler ───────────────────────────────────────────────────────
  const handleComplete = async (id: string) => {
    setCompletingId(id);
    await complete(id);
    setCompletingId(null);
  };

  // ── Delete handler ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    // Simple window.confirm — replace with ConfirmDialog component for production
    if (!window.confirm("Delete this reminder? This cannot be undone.")) return;
    setDeletingId(id);
    await remove(id);
    setDeletingId(null);
  };

  // ── Pagination ─────────────────────────────────────────────────────────────
  const handlePageChange = (newPage: number) => {
    setFilters({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {pagination
              ? `${pagination.total} reminder${pagination.total !== 1 ? "s" : ""}`
              : ""}
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} size="md">
          New Reminder
        </Button>
      </div>

      {/* ── Filters bar ── */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Status tabs */}
        <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 gap-0.5">
          {STATUS_TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleStatusChange(value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150",
                activeStatus === value
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={activePriority}
            onChange={(e) =>
              handlePriorityChange(e.target.value as Priority | "ALL")
            }
            className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {PRIORITY_OPTIONS.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Content area ── */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        /* Skeleton while loading */
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <ReminderSkeleton key={i} />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-12 h-12" />}
          title="No reminders found"
          description={
            activeStatus === "ALL"
              ? "You're all caught up! Create your first reminder."
              : `No ${activeStatus.toLowerCase()} reminders.`
          }
          action={
            <Button leftIcon={<Plus className="w-4 h-4" />} size="sm">
              Create Reminder
            </Button>
          }
        />
      ) : (
        /* Reminder list */
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder._id}
              reminder={reminder}
              onComplete={handleComplete}
              onDelete={handleDelete}
              isCompleting={completingId === reminder._id}
              isDeleting={deletingId === reminder._id}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              disabled={pagination.page === 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

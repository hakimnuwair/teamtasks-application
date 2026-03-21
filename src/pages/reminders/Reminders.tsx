/**
 * pages/reminders/Reminders.tsx
 *
 * Architecture: RemindersPage → useReminders + useGroups (hooks) → stores → services
 *
 * Fix: ReminderCard shows per-user completion state correctly:
 *   - Top-level status COMPLETED = all members done → grey strikethrough
 *   - Current user completed but others haven't → teal checkmark + "You completed" badge
 *   - Not completed yet → interactive circle toggle
 *
 * Group filter: ALL | personal | specific group
 * Clear filters: single button resets all filters to defaults.
 */
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
  SlidersHorizontal,
  Tag,
  Users,
  X,
} from "lucide-react";
import { useReminders } from "../../hooks/useReminders";
import { useGroups } from "../../hooks/useGroups";
import { useAuthStore } from "../../store/authStore";
import {
  Button,
  Badge,
  AvatarStack,
  Spinner,
  EmptyState,
  Card,
  FAB,
} from "../../components/ui";
import { CreateReminderModal } from "../../components/modal/CreateReminderModal";
import { cn } from "../../utils/cn";
import { formatDueDate, isOverdue } from "../../utils/formatDate";
import type { Reminder, ReminderStatus, Priority } from "../../types/types";
import { DeleteConfirmModal } from "../../components/modal/DeleteConfirmationModal";
import { parseApiError } from "../../config/axios";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// REMINDER CARD
// Per-user completion logic:
//   iDone     = current user already completed this reminder
//   globalDone = top-level status is COMPLETED (ALL members done)
//   isGroup   = reminder belongs to a group (has userCompletions)
// ─────────────────────────────────────────────────────────────────────────────

interface ReminderCardProps {
  reminder: Reminder;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  isCompleting: boolean;
  isDeleting: boolean;
}

function ReminderCard({
  reminder,
  onComplete,
  onDelete,
  isCompleting,
  isDeleting,
}: ReminderCardProps) {
  const { user } = useAuthStore();
  const myId = user?.id ?? user?._id ?? "";
  const overdue = isOverdue(reminder.dueDateTime, reminder.status);
  const globalDone = reminder.status === "COMPLETED";
  const isGroup = !!reminder.groupId;

  // Per-user completion — only meaningful for group reminders
  const iDone = isGroup
    ? (reminder.userCompletions ?? []).some((uc) => {
        const uid =
          typeof uc.userId === "string"
            ? uc.userId
            : (uc.userId as { _id: string })._id;
        return uid === myId;
      })
    : globalDone;

  const completedIds = new Set(
    (reminder.userCompletions ?? []).map((uc) =>
      typeof uc.userId === "string"
        ? uc.userId
        : (uc.userId as { _id: string })._id,
    ),
  );

  const statusVariant: Record<
    ReminderStatus,
    "pending" | "completed" | "overdue"
  > = {
    PENDING: "pending",
    COMPLETED: "completed",
    OVERDUE: "overdue",
  };
  const priorityVariant: Record<Priority, "high" | "medium" | "low"> = {
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-0 rounded-xl border transition-all duration-[250ms] ease-in-out overflow-hidden",
        !overdue &&
          "bg-white dark:bg-[#161B22] border-[#E2E6ED] dark:border-[#21262D]",
        overdue &&
          "bg-[#FFF8F8] dark:bg-[rgba(244,63,94,0.05)] border-[#FECDD3] dark:border-[rgba(244,63,94,0.25)]",
        "shadow-[0_2px_8px_rgba(15,23,42,0.06),0_0_1px_rgba(15,23,42,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.30)]",
        !globalDone &&
          !overdue &&
          "hover:-translate-y-0.5 hover:border-[#C8CDD8] dark:hover:border-[#30363D] hover:shadow-[0_6px_16px_rgba(15,23,42,0.09)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.45)]",
        overdue &&
          !globalDone &&
          "hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(244,63,94,0.12)] dark:hover:shadow-[0_6px_16px_rgba(244,63,94,0.20)]",
      )}
    >
      {/* Main row */}
      <div className="flex items-start gap-4 p-5">
        {/* Complete toggle */}
        <button
          onClick={() => !iDone && onComplete(reminder._id)}
          disabled={iDone || isCompleting}
          title={
            iDone
              ? globalDone
                ? "Everyone completed"
                : "You completed this"
              : "Mark as complete"
          }
          className={cn(
            "mt-0.5 shrink-0 transition-all duration-[250ms]",
            globalDone
              ? "text-emerald-500 cursor-default"
              : iDone
                ? "text-teal-500 cursor-default"
                : "text-[#C8CDD8] dark:text-[#30363D] hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-110",
            "disabled:opacity-50",
          )}
        >
          {isCompleting ? (
            <Spinner size="sm" />
          ) : globalDone || iDone ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h3
              className={cn(
                "font-medium text-sm leading-snug tracking-wide",
                globalDone
                  ? "line-through text-[#94A3B8] dark:text-[#484F58]"
                  : iDone
                    ? "text-[#94A3B8] dark:text-[#484F58]"
                    : "text-[#0F172A] dark:text-[#F0F6FC]",
              )}
            >
              {reminder.title}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* "You done" badge — only shown for group reminders where I'm done but not all */}
              {isGroup && iDone && !globalDone && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F0FDF4] dark:bg-[rgba(34,197,94,0.12)] text-[#16A34A] dark:text-[#86EFAC]">
                  <CheckCircle2 className="w-2.5 h-2.5" /> You done
                </span>
              )}
              <Badge variant={statusVariant[reminder.status]}>
                {reminder.status.charAt(0) +
                  reminder.status.slice(1).toLowerCase()}
              </Badge>
            </div>
          </div>

          {reminder.description && (
            <p className="mt-1.5 text-xs text-[#475569] dark:text-[#8B949E] leading-relaxed line-clamp-2">
              {reminder.description}
            </p>
          )}

          {/* Meta row */}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium",
                overdue
                  ? "text-[#BE123C] dark:text-[#FDA4AF]"
                  : "text-[#94A3B8]",
              )}
            >
              {overdue ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              {formatDueDate(reminder.dueDateTime)}
            </span>
            <Badge variant={priorityVariant[reminder.priority]} dot={false}>
              {reminder.priority}
            </Badge>
            {reminder.groupId && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)] px-2 py-0.5 rounded-full">
                <Tag className="w-2.5 h-2.5" />
                {reminder.groupId.name}
              </span>
            )}
            {reminder.assignedUsers.length > 0 && (
              <div className="ml-auto">
                <AvatarStack users={reminder.assignedUsers} max={3} size="xs" />
              </div>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(reminder._id)}
          disabled={isDeleting}
          className={cn(
            "shrink-0 mt-0.5 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-[250ms]",
            "text-[#C8CDD8] dark:text-[#30363D] hover:bg-[#FFF1F2] dark:hover:bg-[rgba(244,63,94,0.10)] hover:text-[#F43F5E] disabled:opacity-50",
          )}
        >
          {isDeleting ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Per-member completion strip — only for group reminders with assigned users */}
      {isGroup && reminder.assignedUsers.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1.5 border-t border-[#F1F5F9] dark:border-[#21262D] pt-2.5">
          {reminder.assignedUsers.map((u) => {
            const done = completedIds.has(u._id);
            const isMe = u._id === myId;
            return (
              <span
                key={u._id}
                title={`${u.name}${isMe ? " (you)" : ""}: ${done ? "completed" : "pending"}`}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                  done
                    ? "bg-[#F0FDF4] dark:bg-[rgba(34,197,94,0.12)] text-[#16A34A] dark:text-[#86EFAC]"
                    : "bg-[#EEF0F4] dark:bg-[#21262D] text-[#64748B] dark:text-[#8B949E]",
                  isMe && "ring-1 ring-indigo-300 dark:ring-indigo-700",
                )}
              >
                {done ? (
                  <CheckCircle2 className="w-2.5 h-2.5" />
                ) : (
                  <Circle className="w-2.5 h-2.5 opacity-50" />
                )}
                {u.name.split(" ")[0]}
                {isMe ? " (you)" : ""}
              </span>
            );
          })}
        </div>
      )}
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function ReminderSkeleton() {
  return (
    <div className="flex items-start gap-4 p-5 rounded-xl border bg-white dark:bg-[#161B22] border-[#E2E6ED] dark:border-[#21262D]">
      <div className="w-5 h-5 rounded-full mt-0.5 shrink-0 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
      <div className="flex-1 space-y-2.5">
        <div className="h-3.5 rounded-md w-3/4 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
        <div className="h-2.5 rounded-md w-1/2 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
        <div className="flex gap-3 pt-0.5">
          <div className="h-2.5 rounded-md w-24 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
          <div className="h-2.5 rounded-full w-14 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export const RemindersPage = () => {
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<ReminderStatus | "ALL">(
    "ALL",
  );
  const [activePriority, setActivePriority] = useState<Priority | "ALL">("ALL");
  const [activeGroup, setActiveGroup] = useState<string>("ALL");
  const [createOpen, setCreateOpen] = useState(false);

  const {
    reminders,
    pagination,
    isLoading,
    error,
    setFilters,
    complete,
    remove,
  } = useReminders();
  const { groups } = useGroups();

  // Check if any filter is active
  const hasActiveFilters =
    activeStatus !== "ALL" || activePriority !== "ALL" || activeGroup !== "ALL";

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

  const handleGroupChange = (groupId: string) => {
    setActiveGroup(groupId);
    const storeGroupId =
      groupId === "ALL" || groupId === "personal" ? undefined : groupId;
    setFilters({ groupId: storeGroupId, page: 1 });
  };

  const handleClearFilters = () => {
    setActiveStatus("ALL");
    setActivePriority("ALL");
    setActiveGroup("ALL");
    setFilters({
      status: undefined,
      priority: undefined,
      groupId: undefined,
      page: 1,
    });
  };

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    await complete(id);
    setCompletingId(null);
  };

  const handleDelete = (id: string) => {
    const reminder = reminders.find((r) => r._id === id);
    setDeleteTarget({ id, title: reminder?.title ?? "this reminder" });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
    } catch (err: unknown) {
      // Re-throw with the real backend error message so DeleteConfirmModal can display it
      throw new Error(parseApiError(err, "Could not delete reminder"));
    }
    setDeleteTarget(null);
  };

  const handlePageChange = (page: number) => {
    setFilters({ page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const displayedReminders =
    activeGroup === "personal"
      ? reminders.filter((r) => !r.groupId)
      : reminders;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] md:text-[28px] font-semibold tracking-wide leading-snug text-[#0F172A] dark:text-[#F0F6FC]">
            My Reminders
          </h2>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            {pagination
              ? `${pagination.total} reminder${pagination.total !== 1 ? "s" : ""} total`
              : "Manage your tasks and deadlines"}
          </p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          size="md"
          onClick={() => setCreateOpen(true)}
        >
          New Reminder
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status tabs */}
        <div
          className={cn(
            "flex items-center p-1 gap-0.5 rounded-xl bg-white dark:bg-[#161B22] border border-[#E2E6ED] dark:border-[#21262D] shadow-[0_1px_3px_rgba(15,23,42,0.06)]",
          )}
        >
          {STATUS_TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleStatusChange(value)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-[250ms] ease-in-out",
                activeStatus === value
                  ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-sm shadow-indigo-500/20"
                  : "text-[#475569] dark:text-[#8B949E] hover:text-[#0F172A] dark:hover:text-[#F0F6FC] hover:bg-black/5 dark:hover:bg-white/5",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Priority select */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
          <select
            value={activePriority}
            onChange={(e) =>
              handlePriorityChange(e.target.value as Priority | "ALL")
            }
            className={cn(
              "h-9 px-3 text-xs rounded-lg appearance-none cursor-pointer",
              "bg-white dark:bg-[#161B22] border border-[#E2E6ED] dark:border-[#21262D]",
              "text-[#475569] dark:text-[#8B949E]",
              "focus:outline-none focus:border-indigo-600 dark:focus:border-[#818CF8] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]",
              "hover:border-[#C8CDD8] dark:hover:border-[#30363D] transition-all duration-[250ms]",
              activePriority !== "ALL" &&
                "border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400",
            )}
          >
            {PRIORITY_OPTIONS.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Group filter */}
        {groups.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <select
              value={activeGroup}
              onChange={(e) => handleGroupChange(e.target.value)}
              className={cn(
                "h-9 px-3 text-xs rounded-lg appearance-none cursor-pointer",
                "bg-white dark:bg-[#161B22] border border-[#E2E6ED] dark:border-[#21262D]",
                "text-[#475569] dark:text-[#8B949E]",
                "focus:outline-none focus:border-indigo-600 dark:focus:border-[#818CF8] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]",
                "hover:border-[#C8CDD8] dark:hover:border-[#30363D] transition-all duration-[250ms]",
                activeGroup !== "ALL" &&
                  "border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400",
              )}
            >
              <option value="ALL">All Groups</option>
              <option value="personal">Personal only</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className={cn(
              "flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium",
              "border border-[#E2E6ED] dark:border-[#21262D]",
              "text-[#475569] dark:text-[#8B949E] bg-white dark:bg-[#161B22]",
              "hover:border-[#F43F5E] hover:text-[#F43F5E] dark:hover:border-[rgba(244,63,94,0.50)] dark:hover:text-[#FDA4AF]",
              "transition-all duration-[250ms]",
            )}
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}

        {/* Count pill */}
        {!isLoading && displayedReminders.length > 0 && (
          <span className="ml-auto text-[11px] font-medium uppercase tracking-widest text-[#94A3B8] bg-[#EEF0F4] dark:bg-[#21262D] px-2.5 py-1 rounded-full">
            {displayedReminders.length} shown
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl text-sm bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.10)] border border-[#FECDD3] dark:border-[rgba(244,63,94,0.25)] text-[#BE123C] dark:text-[#FDA4AF]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <ReminderSkeleton key={i} />
          ))}
        </div>
      ) : displayedReminders.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CheckCircle2 className="w-8 h-8" />}
            title="No reminders found"
            description={
              hasActiveFilters
                ? "Try clearing some filters to see more reminders."
                : "You're all caught up! Create your first reminder to get started."
            }
            action={
              hasActiveFilters ? (
                <Button
                  variant="secondary"
                  leftIcon={<X className="w-4 h-4" />}
                  size="sm"
                  onClick={handleClearFilters}
                >
                  Clear filters
                </Button>
              ) : (
                <Button
                  leftIcon={<Plus className="w-4 h-4" />}
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                >
                  Create Reminder
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedReminders.map((reminder) => (
            <ReminderCard
              key={reminder._id}
              reminder={reminder}
              onComplete={handleComplete}
              onDelete={handleDelete}
              isCompleting={completingId === reminder._id}
              isDeleting={false}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#E2E6ED] dark:border-[#21262D] pt-4 mt-2">
          <p className="text-xs text-[#94A3B8]">
            Page{" "}
            <span className="font-medium text-[#475569] dark:text-[#8B949E]">
              {pagination.page}
            </span>{" "}
            of{" "}
            <span className="font-medium text-[#475569] dark:text-[#8B949E]">
              {pagination.totalPages}
            </span>
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
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              disabled={pagination.page === pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <FAB
        onClick={() => setCreateOpen(true)}
        icon={<Plus className="w-6 h-6" />}
        label="New Reminder"
      />
      <CreateReminderModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        title={deleteTarget?.title ?? ""}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

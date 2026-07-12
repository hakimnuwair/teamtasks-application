/**
 * pages/reminders/ReminderDetails.tsx
 *
 * Architecture: ReminderDetailPage → useReminderDetail (hook) → reminderService
 *
 * The single place to view a reminder, manage its execution plan
 * (sub-reminders), view progress, complete it, and delete it — mirrors
 * GroupDetailPage's structure (header + stat/body cards), minus tabs.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  AlertTriangle,
  Tag,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { Button, Badge, AvatarStack, Spinner, EmptyState, Card } from "../../components/ui";
import { SubRemindersSection } from "../../components/reminders/SubRemindersSection";
import { DeleteConfirmModal } from "../../components/modal/DeleteConfirmationModal";
import { useReminderDetail } from "../../hooks/useReminderDetail";
import { useAuthStore } from "../../store/authStore";
import { formatDueDate, isOverdue } from "../../utils/formatDate";
import { parseApiError } from "../../config/axios";
import type { ReminderStatus, Priority } from "../../types/types";

const STATUS_VARIANT: Record<ReminderStatus, "pending" | "completed" | "overdue"> = {
  PENDING: "pending",
  COMPLETED: "completed",
  OVERDUE: "overdue",
};
const PRIORITY_VARIANT: Record<Priority, "high" | "medium" | "low"> = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export const ReminderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const myId = user?.id ?? user?._id ?? "";

  const { reminder, isLoading, error, isCompleting, isDeleting, load, complete, remove } =
    useReminderDetail(id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeleteConfirm = async () => {
    try {
      await remove();
    } catch (err: unknown) {
      throw new Error(parseApiError(err, "Could not delete reminder"));
    }
    navigate("/reminders");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-[#94A3B8]">Loading reminder...</p>
        </div>
      </div>
    );
  }

  if (error || !reminder) {
    return (
      <Card>
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8" />}
          title="Reminder not found"
          description={error ?? "This reminder may have been deleted."}
          action={
            <Button
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              size="sm"
              onClick={() => navigate("/reminders")}
            >
              Back to Reminders
            </Button>
          }
        />
      </Card>
    );
  }

  const isCreator = reminder.createdBy._id === myId;
  const isGroup = !!reminder.groupId;
  const globalDone = reminder.status === "COMPLETED";
  const iDone = isGroup
    ? (reminder.userCompletions ?? []).some((uc) => {
        const uid =
          typeof uc.userId === "string" ? uc.userId : (uc.userId as { _id: string })._id;
        return uid === myId;
      })
    : globalDone;
  const isAssignedToMe =
    reminder.assignedUsers.length === 0 ||
    reminder.assignedUsers.some((u) => u._id === myId);
  const overdue = isOverdue(reminder.dueDateTime, reminder.status);

  const completedIds = new Set(
    (reminder.userCompletions ?? []).map((uc) =>
      typeof uc.userId === "string" ? uc.userId : (uc.userId as { _id: string })._id,
    ),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate("/reminders")}
          className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F0F6FC] hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-[250ms]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h2
              className={cn(
                "text-[20px] md:text-[24px] font-semibold tracking-wide leading-snug",
                globalDone
                  ? "line-through text-[#94A3B8] dark:text-[#484F58]"
                  : "text-[#0F172A] dark:text-[#F0F6FC]",
              )}
            >
              {reminder.title}
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                leftIcon={
                  globalDone || iDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Circle className="w-3.5 h-3.5" />
                  )
                }
                disabled={iDone || isCompleting || !isAssignedToMe}
                isLoading={isCompleting}
                onClick={complete}
              >
                {globalDone ? "Completed" : iDone ? "You completed this" : "Mark Complete"}
              </Button>
              {isCreator && (
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  isLoading={isDeleting}
                  onClick={() => setConfirmOpen(true)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Badge variant={STATUS_VARIANT[reminder.status]}>
              {reminder.status.charAt(0) + reminder.status.slice(1).toLowerCase()}
            </Badge>
            <Badge variant={PRIORITY_VARIANT[reminder.priority]} dot={false}>
              {reminder.priority}
            </Badge>
            {reminder.groupId && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)] px-2 py-0.5 rounded-full">
                <Tag className="w-2.5 h-2.5" />
                {reminder.groupId.name}
              </span>
            )}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium",
                overdue ? "text-[#BE123C] dark:text-[#FDA4AF]" : "text-[#94A3B8]",
              )}
            >
              {overdue ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {formatDueDate(reminder.dueDateTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <Card className="space-y-4">
        {reminder.description && (
          <p className="text-sm text-[#475569] dark:text-[#8B949E] leading-relaxed">
            {reminder.description}
          </p>
        )}
        <div className="flex items-center gap-3 flex-wrap text-xs text-[#94A3B8]">
          <span>Created by {reminder.createdBy.name}</span>
          {reminder.assignedUsers.length > 0 && (
            <AvatarStack users={reminder.assignedUsers} max={5} size="xs" />
          )}
        </div>

        {/* Per-member completion strip — only for group reminders with assigned users */}
        {isGroup && reminder.assignedUsers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-[#F1F5F9] dark:border-[#21262D] pt-3">
            {reminder.assignedUsers.map((u) => {
              const done = completedIds.has(u._id);
              const isMe = u._id === myId;
              return (
                <span
                  key={u._id}
                  title={`${u.name ?? "Unknown"}${isMe ? " (you)" : ""}: ${done ? "completed" : "pending"}`}
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
                  {(u.name ?? "?").split(" ")[0]}
                  {isMe ? " (you)" : ""}
                </span>
              );
            })}
          </div>
        )}
      </Card>

      <SubRemindersSection reminder={reminder} />

      <DeleteConfirmModal
        isOpen={confirmOpen}
        title={reminder.title}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

/**
 * components/reminders/SubRemindersSection.tsx
 *
 * Shows a parent reminder's sub-reminders (its execution plan) and lets the
 * creator add/delete items while assignees can view and complete them.
 * Rendered inline on the Reminder Details page — not a modal.
 *
 * Add form submits one sub-reminder at a time and appends to the list
 * immediately — this is the same mechanic a future "review AI suggestions"
 * flow will reuse by calling create() once per accepted suggestion, so no
 * batch/draft abstraction is built here.
 */
import { useState, useEffect } from "react";
import { Circle, CheckCircle2, Trash2, Clock, Plus } from "lucide-react";
import { DeleteConfirmModal } from "../modal/DeleteConfirmationModal";
import {
  Button,
  Field,
  Input,
  Badge,
  EmptyState,
  SkeletonLine,
  Card,
  SectionHeader,
} from "../ui";
import { cn } from "../../utils/cn";
import { formatDueDate } from "../../utils/formatDate";
import { useSubReminders } from "../../hooks/useSubReminders";
import { useAuthStore } from "../../store/authStore";
import { parseForm, createSubReminderSchema } from "../../lib/validations";
import type { Reminder, Priority } from "../../types/types";

interface Props {
  reminder: Reminder;
}

const PRIORITIES: { value: Priority; label: string; dot: string }[] = [
  { value: "HIGH", label: "High", dot: "bg-[#F43F5E]" },
  { value: "MEDIUM", label: "Medium", dot: "bg-[#F59E0B]" },
  { value: "LOW", label: "Low", dot: "bg-[#94A3B8]" },
];

const INIT_FORM = {
  title: "",
  description: "",
  dueDateTime: "",
  priority: "MEDIUM" as Priority,
};

type FormErrors = Partial<Record<keyof typeof INIT_FORM, string>>;

export function SubRemindersSection({ reminder }: Props) {
  const { subReminders, isLoading, fetch, create, complete, remove } =
    useSubReminders(reminder._id);
  const { user } = useAuthStore();
  const myId = user?.id ?? user?._id ?? "";

  const [form, setForm] = useState(INIT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    fetch();
    setForm(INIT_FORM);
    setErrors({});
  }, [reminder._id]);

  // Sub-reminders are the reminder's execution plan — only the creator plans it
  // (creates/deletes items); assignees execute it (view + complete only).
  // Any other active group member gets read-only access (view only).
  const isCreator = reminder.createdBy._id === myId;
  const isAssignedToMe = reminder.assignedUsers.some((u) => u._id === myId);
  const canComplete = isCreator || isAssignedToMe;
  const parentCompleted = reminder.status === "COMPLETED";
  const doneCount = subReminders.filter((s) => s.status === "COMPLETED").length;

  const setField = <K extends keyof typeof INIT_FORM>(
    key: K,
    value: string,
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleAdd = async () => {
    const { data, errors: zodErrors } = parseForm(createSubReminderSchema, {
      title: form.title,
      description: form.description || undefined,
      dueDateTime: form.dueDateTime,
      priority: form.priority,
    });

    if (zodErrors) {
      setErrors(zodErrors as FormErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await create(data);
      setForm(INIT_FORM);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    setDeleteTarget(null);
  };

  const inputCls = (hasError?: boolean) =>
    cn(
      "w-full h-11 px-3.5 text-sm rounded-lg",
      "bg-white dark:bg-[#0D1117] text-[#0F172A] dark:text-[#F0F6FC] placeholder:text-[#94A3B8]",
      "border-[1.5px] focus:outline-none transition-all duration-[250ms]",
      "hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
      hasError
        ? "border-[#F43F5E] focus:border-[#F43F5E] focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]"
        : "border-[#E2E6ED] dark:border-[#21262D] focus:border-indigo-600 dark:focus:border-[#818CF8] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]",
    );

  return (
    <>
      <Card className="space-y-5">
        <SectionHeader
          title="Sub-reminders"
          subtitle={
            subReminders.length > 0
              ? `${doneCount} of ${subReminders.length} completed`
              : "Break this reminder down into smaller steps"
          }
        />

        {subReminders.length > 0 && (
          <div className="h-1.5 rounded-full bg-[#EEF0F4] dark:bg-[#21262D] -mt-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-teal-500 transition-all duration-700"
              style={{
                width: `${Math.round((doneCount / subReminders.length) * 100)}%`,
              }}
            />
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <SkeletonLine key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : subReminders.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-7 h-7" />}
            title="No sub-reminders yet"
            description="Break this reminder down into smaller steps below."
          />
        ) : (
          <div className="space-y-2">
            {subReminders.map((sub) => {
              const done = sub.status === "COMPLETED";
              return (
                <div
                  key={sub._id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border",
                    "bg-white dark:bg-[#161B22] border-[#E2E6ED] dark:border-[#21262D]",
                  )}
                >
                  <button
                    onClick={() => !done && canComplete && complete(sub._id)}
                    disabled={done || !canComplete}
                    title={
                      !canComplete && !done
                        ? "Only the creator or assignees can complete this"
                        : undefined
                    }
                    className={cn(
                      "mt-0.5 shrink-0 transition-all duration-[250ms]",
                      done
                        ? "text-emerald-500 cursor-default"
                        : canComplete
                          ? "text-[#C8CDD8] dark:text-[#30363D] hover:text-indigo-600 dark:hover:text-indigo-400"
                          : "text-[#C8CDD8] dark:text-[#30363D] opacity-50 cursor-not-allowed",
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        done
                          ? "line-through text-[#94A3B8] dark:text-[#484F58]"
                          : "text-[#0F172A] dark:text-[#F0F6FC]",
                      )}
                    >
                      {sub.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#94A3B8]">
                        <Clock className="w-3 h-3" />
                        {formatDueDate(sub.dueDateTime)}
                      </span>
                      <Badge
                        variant={
                          sub.priority === "HIGH"
                            ? "high"
                            : sub.priority === "MEDIUM"
                              ? "medium"
                              : "low"
                        }
                        dot={false}
                      >
                        {sub.priority}
                      </Badge>
                    </div>
                  </div>

                  {isCreator && (
                    <button
                      onClick={() =>
                        setDeleteTarget({ id: sub._id, title: sub.title })
                      }
                      className="shrink-0 p-1.5 rounded-lg text-[#C8CDD8] dark:text-[#30363D] hover:bg-[#FFF1F2] dark:hover:bg-[rgba(244,63,94,0.10)] hover:text-[#F43F5E] transition-all duration-[250ms]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add form — only the creator plans the execution plan */}
        <div className="h-px bg-[#E2E6ED] dark:bg-[#21262D]" />

        {!isCreator ? (
          <p className="text-xs text-[#94A3B8]">
            Only the reminder creator can add or remove sub-reminders.
          </p>
        ) : parentCompleted ? (
          <p className="text-xs text-[#94A3B8]">
            This reminder is already completed — sub-reminders can no longer
            be added.
          </p>
        ) : (
          <div className="space-y-4">
            <Field label="Title" error={errors.title} required>
              <Input
                placeholder="e.g. Learn Express"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                error={!!errors.title}
              />
            </Field>

            <Field label="Description">
              <textarea
                placeholder="Add more details (optional)..."
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={2}
                className={cn(
                  "w-full px-3.5 py-3 text-sm rounded-lg resize-none",
                  "bg-white dark:bg-[#0D1117] text-[#0F172A] dark:text-[#F0F6FC] placeholder:text-[#94A3B8]",
                  "border-[1.5px] border-[#E2E6ED] dark:border-[#21262D]",
                  "focus:outline-none focus:border-indigo-600 dark:focus:border-[#818CF8] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]",
                  "hover:border-[#C8CDD8] dark:hover:border-[#30363D] transition-all duration-[250ms]",
                )}
              />
            </Field>

            <Field label="Due Date & Time" error={errors.dueDateTime} required>
              <input
                type="datetime-local"
                value={form.dueDateTime}
                onChange={(e) => setField("dueDateTime", e.target.value)}
                className={cn(
                  inputCls(!!errors.dueDateTime),
                  "[color-scheme:light] dark:[color-scheme:dark]",
                )}
              />
            </Field>

            <Field label="Priority">
              <div className="grid grid-cols-3 gap-2">
                {PRIORITIES.map(({ value, label, dot }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setField("priority", value)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all duration-[250ms]",
                      form.priority === value
                        ? "border-indigo-600 dark:border-indigo-500 bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.12)] text-indigo-600 dark:text-indigo-400"
                        : "border-[#E2E6ED] dark:border-[#21262D] text-[#475569] dark:text-[#8B949E] hover:border-[#C8CDD8] dark:hover:border-[#30363D] bg-white dark:bg-[#161B22]",
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <Button
              variant="secondary"
              className="w-full"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleAdd}
              isLoading={isSubmitting}
            >
              Add Sub-reminder
            </Button>
          </div>
        )}
      </Card>

      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        title={deleteTarget?.title ?? ""}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

/**
 * components/modal/CreateReminderModal.tsx
 *
 * Slide-in modal for creating a reminder.
 *
 * When a group is selected two assignment modes appear:
 *   "Everyone" — assignedUsers is omitted (backend resolves to all members).
 *   "Specific"  — user picks individual members; their IDs are sent in assignedUsers[].
 *
 * Per-user completion: each assigned user tracks their own completion independently.
 * The reminder's top-level status becomes COMPLETED only when ALL complete.
 */

import { useState, useEffect } from "react";
import { SlideModal } from "./SlideModal";
import { Button, Field, Input, Avatar } from "../ui";
import { cn } from "../../utils/cn";
import { useReminders } from "../../hooks/useReminders";
import { useGroupStore } from "../../store/groupStore";
import { parseForm, createReminderSchema } from "../../lib/validations";
import * as groupService from "../../services/group";
import toast from "react-hot-toast";
import type { Priority, Recurrence, Group } from "../../types/types";
import { Users, User } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultGroupId?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const PRIORITIES: {
  value: Priority;
  label: string;
  dot: string;
  activeBg: string;
  activeText: string;
}[] = [
  {
    value: "HIGH",
    label: "High",
    dot: "bg-[#F43F5E]",
    activeBg:
      "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)] border-[#FECDD3] dark:border-[rgba(244,63,94,0.30)]",
    activeText: "text-[#BE123C] dark:text-[#FDA4AF]",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    dot: "bg-[#F59E0B]",
    activeBg:
      "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.12)] border-[#FDE68A] dark:border-[rgba(245,158,11,0.30)]",
    activeText: "text-[#B45309] dark:text-[#FCD34D]",
  },
  {
    value: "LOW",
    label: "Low",
    dot: "bg-[#94A3B8]",
    activeBg:
      "bg-[#F8FAFC] dark:bg-[rgba(148,163,184,0.08)] border-[#E2E8F0] dark:border-[rgba(148,163,184,0.20)]",
    activeText: "text-[#64748B] dark:text-[#64748B]",
  },
];

const RECURRENCES: { value: Recurrence; label: string }[] = [
  { value: "NONE", label: "Once" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
];

// ── Form state ────────────────────────────────────────────────────────────────

const INIT = {
  title: "",
  description: "",
  dueDateTime: "",
  priority: "MEDIUM" as Priority,
  recurrence: "NONE" as Recurrence,
  groupId: "", // "" = personal
  assignMode: "everyone" as "everyone" | "specific",
};

type FormErrors = Partial<Record<keyof typeof INIT | "assignedUsers", string>>;

// ─────────────────────────────────────────────────────────────────────────────

export function CreateReminderModal({
  isOpen,
  onClose,
  defaultGroupId,
}: Props) {
  const [form, setForm] = useState({ ...INIT, groupId: defaultGroupId ?? "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupDetail, setGroupDetail] = useState<Group | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { create } = useReminders();
  const { groups } = useGroupStore();

  // When groupId changes, fetch group members for the picker
  useEffect(() => {
    if (!form.groupId) {
      setGroupDetail(null);
      setSelectedUsers([]);
      return;
    }
    groupService
      .getGroupById(form.groupId)
      .then((g) => setGroupDetail(g))
      .catch(() => setGroupDetail(null));
  }, [form.groupId]);

  const setField = <K extends keyof typeof INIT>(key: K, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const reset = () => {
    setForm({ ...INIT, groupId: defaultGroupId ?? "" });
    setErrors({});
    setSelectedUsers([]);
    setGroupDetail(null);
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
    setErrors((e) => ({ ...e, assignedUsers: undefined }));
  };

  // ── Shared input className ──────────────────────────────────────────────────
  const inputCls = (hasError?: boolean) =>
    cn(
      "w-full h-11 px-3.5 text-sm rounded-lg",
      "bg-white dark:bg-[#0D1117]",
      "text-[#0F172A] dark:text-[#F0F6FC] placeholder:text-[#94A3B8]",
      "border-[1.5px] focus:outline-none transition-all duration-[250ms]",
      "hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
      hasError
        ? "border-[#F43F5E] focus:border-[#F43F5E] focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]"
        : "border-[#E2E6ED] dark:border-[#21262D] focus:border-indigo-600 dark:focus:border-[#818CF8] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]",
    );

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const { data, errors: zodErrors } = parseForm(createReminderSchema, {
      title: form.title,
      description: form.description || undefined,
      dueDateTime: form.dueDateTime,
      priority: form.priority,
      recurrence: form.recurrence,
      groupId: form.groupId || null,
    });

    if (zodErrors) {
      setErrors(zodErrors as FormErrors);
      return;
    }

    // Validate specific assignment
    if (
      form.groupId &&
      form.assignMode === "specific" &&
      selectedUsers.length === 0
    ) {
      setErrors((e) => ({ ...e, assignedUsers: "Select at least one member" }));
      return;
    }

    setIsSubmitting(true);
    try {
      await create({
        title: data.title,
        description: data.description,
        dueDateTime: data.dueDateTime,
        priority: data.priority,
        recurrence: data.recurrence,
        groupId: data.groupId,
        // "everyone" → omit assignedUsers (backend assigns all members)
        // "specific" → pass selected IDs
        assignedUsers:
          form.groupId && form.assignMode === "specific"
            ? selectedUsers
            : undefined,
      });
      toast.success("Reminder created!");
      reset();
      onClose();
    } catch {
      toast.error("Failed to create reminder");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <SlideModal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Reminder"
      subtitle="Set a task or deadline for yourself or your team"
    >
      {/* Title */}
      <Field label="Title" error={errors.title} required>
        <Input
          placeholder="What needs to be done?"
          value={form.title}
          onChange={(e) => setField("title", e.target.value)}
          error={!!errors.title}
          autoFocus
        />
      </Field>

      {/* Description */}
      <Field label="Description">
        <textarea
          placeholder="Add more details (optional)..."
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          rows={3}
          className={cn(
            "w-full px-3.5 py-3 text-sm rounded-lg resize-none",
            "bg-white dark:bg-[#0D1117]",
            "text-[#0F172A] dark:text-[#F0F6FC] placeholder:text-[#94A3B8]",
            "border-[1.5px] border-[#E2E6ED] dark:border-[#21262D]",
            "focus:outline-none focus:border-indigo-600 dark:focus:border-[#818CF8]",
            "focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]",
            "hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
            "transition-all duration-[250ms]",
          )}
        />
      </Field>

      {/* Due date & time */}
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

      {/* Priority */}
      <Field label="Priority">
        <div className="grid grid-cols-3 gap-2">
          {PRIORITIES.map(({ value, label, dot, activeBg, activeText }) => (
            <button
              key={value}
              type="button"
              onClick={() => setField("priority", value)}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-medium",
                "transition-all duration-[250ms]",
                form.priority === value
                  ? [activeBg, activeText, "shadow-sm"]
                  : "border-[#E2E6ED] dark:border-[#21262D] text-[#475569] dark:text-[#8B949E] hover:border-[#C8CDD8] dark:hover:border-[#30363D] bg-white dark:bg-[#161B22]",
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
              {label}
            </button>
          ))}
        </div>
      </Field>

      {/* Recurrence */}
      <Field label="Repeat">
        <div className="grid grid-cols-4 gap-2">
          {RECURRENCES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setField("recurrence", value)}
              className={cn(
                "py-2 rounded-lg border text-xs font-medium transition-all duration-[250ms]",
                form.recurrence === value
                  ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white border-transparent shadow-sm"
                  : "border-[#E2E6ED] dark:border-[#21262D] text-[#475569] dark:text-[#8B949E] hover:border-[#C8CDD8] dark:hover:border-[#30363D] bg-white dark:bg-[#161B22]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      {/* Group selector */}
      <Field label="Group" error={errors.groupId}>
        <select
          value={form.groupId}
          onChange={(e) => {
            setField("groupId", e.target.value);
            setForm((f) => ({ ...f, assignMode: "everyone" }));
            setSelectedUsers([]);
          }}
          className={cn(
            inputCls(!!errors.groupId),
            "appearance-none cursor-pointer",
          )}
        >
          <option value="">Personal reminder (no group)</option>
          {groups.map((g) => (
            <option key={g._id} value={g._id}>
              {g.name}
            </option>
          ))}
        </select>
      </Field>

      {/* Assignment — only shown when a group is selected */}
      {form.groupId && (
        <div className="space-y-3">
          {/* Divider */}
          <div className="h-px bg-[#E2E6ED] dark:bg-[#21262D]" />

          {/* Mode toggle */}
          <div>
            <p className="text-xs font-medium text-[#475569] dark:text-[#8B949E] mb-2 uppercase tracking-widest">
              Assign to
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  mode: "everyone" as const,
                  icon: Users,
                  label: "All Members",
                  desc: "Everyone completes independently",
                },
                {
                  mode: "specific" as const,
                  icon: User,
                  label: "Specific Members",
                  desc: "Only selected people are responsible",
                },
              ].map(({ mode, icon: Icon, label, desc }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, assignMode: mode }));
                    setSelectedUsers([]);
                  }}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 rounded-xl border text-left",
                    "transition-all duration-[250ms]",
                    form.assignMode === mode
                      ? "border-indigo-600 dark:border-indigo-500 bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.12)] shadow-[0_0_0_1px_rgba(79,70,229,0.15)]"
                      : "border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#161B22] hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon
                      className={cn(
                        "w-3.5 h-3.5",
                        form.assignMode === mode
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-[#94A3B8]",
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        form.assignMode === mode
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-[#475569] dark:text-[#8B949E]",
                      )}
                    >
                      {label}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#94A3B8] leading-snug">
                    {desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Member picker — shown only in "specific" mode */}
          {form.assignMode === "specific" && (
            <div>
              {errors.assignedUsers && (
                <p className="text-xs text-[#F43F5E] mb-1.5">
                  {errors.assignedUsers}
                </p>
              )}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {groupDetail ? (
                  groupDetail.members.map((m) => {
                    const uid = m.userId._id;
                    const selected = selectedUsers.includes(uid);
                    return (
                      <button
                        key={uid}
                        type="button"
                        onClick={() => toggleUser(uid)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left",
                          "transition-all duration-[250ms]",
                          selected
                            ? "border-indigo-600 dark:border-indigo-500 bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.12)]"
                            : "border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#161B22] hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
                        )}
                      >
                        <Avatar name={m.userId.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#0F172A] dark:text-[#F0F6FC] truncate">
                            {m.userId.name}
                          </p>
                          <p className="text-[10px] text-[#94A3B8] truncate">
                            {m.userId.email}
                          </p>
                        </div>
                        {/* Checkbox */}
                        <div
                          className={cn(
                            "w-4 h-4 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-all duration-[150ms]",
                            selected
                              ? "bg-indigo-600 border-indigo-600"
                              : "border-[#C8CDD8] dark:border-[#30363D]",
                          )}
                        >
                          {selected && (
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="none"
                              viewBox="0 0 10 10"
                            >
                              <path
                                d="M1.5 5L4 7.5L8.5 2.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  // Loading skeleton
                  <div className="space-y-1.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-12 rounded-lg animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]"
                      />
                    ))}
                  </div>
                )}
              </div>
              {selectedUsers.length > 0 && (
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1.5 font-medium">
                  {selectedUsers.length} member
                  {selectedUsers.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          {/* Info hint */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.10)] border border-[#C7D2FE] dark:border-[rgba(99,102,241,0.25)] text-[11px] text-[#4338CA] dark:text-[#A5B4FC]">
            <span className="mt-0.5">ℹ️</span>
            <span className="leading-relaxed">
              Each person tracks their own completion. Completing a reminder
              doesn't complete it for others.
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className={cn(
          "sticky bottom-0 -mx-6 -mb-5 px-6 py-4 mt-2 flex items-center gap-3",
          "bg-white dark:bg-[#161B22] border-t border-[#E2E6ED] dark:border-[#21262D]",
        )}
      >
        <Button
          variant="secondary"
          className="flex-1"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          isLoading={isSubmitting}
        >
          Create Reminder
        </Button>
      </div>
    </SlideModal>
  );
}

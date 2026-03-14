/**
 * Slide-in modal for creating a new reminder.
 * `scope` is UI-only — controls whether groupId is sent to the API.
 */

import { useState } from "react";
import { SlideModal } from "./SlideModal";
import { Button, Field, Input } from "../ui";
import { cn } from "../../utils/cn";
import { useReminders } from "../../hooks/useReminders";
import { useGroupStore } from "../../store/groupStore";
import toast from "react-hot-toast";
import type { Priority, ReminderScope } from "../../types/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITIES: {
  value: Priority;
  label: string;
  color: string;
  bg: string;
}[] = [
  {
    value: "HIGH",
    label: "High",
    color: "text-[#BE123C] dark:text-[#FDA4AF]",
    bg: "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)] border-[#FECDD3] dark:border-[rgba(244,63,94,0.30)]",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    color: "text-[#B45309] dark:text-[#FCD34D]",
    bg: "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.12)] border-[#FDE68A] dark:border-[rgba(245,158,11,0.30)]",
  },
  {
    value: "LOW",
    label: "Low",
    color: "text-[#64748B] dark:text-[#64748B]",
    bg: "bg-[#F8FAFC] dark:bg-[rgba(148,163,184,0.08)] border-[#E2E8F0] dark:border-[rgba(148,163,184,0.20)]",
  },
];

const INIT = {
  title: "",
  description: "",
  dueDateTime: "",
  priority: "MEDIUM" as Priority,
  scope: "PERSONAL" as ReminderScope,
  groupId: "",
};

type FormErrors = Partial<Record<keyof typeof INIT, string>>;

export function CreateReminderModal({ isOpen, onClose }: Props) {
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { create } = useReminders();
  const { groups } = useGroupStore();

  const set = (k: keyof typeof INIT, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e: FormErrors = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.dueDateTime) e.dueDateTime = "Due date & time is required";
    if (form.scope === "GROUP" && !form.groupId)
      e.groupId = "Please select a group";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      // `scope` is stripped here — only groupId reaches the API
      await create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        dueDateTime: form.dueDateTime,
        priority: form.priority,
        groupId: form.scope === "GROUP" ? form.groupId : undefined,
      });
      toast.success("Reminder created!");
      setForm(INIT);
      setErrors({});
      onClose();
    } catch {
      toast.error("Failed to create reminder");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm(INIT);
    setErrors({});
    onClose();
  };

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
          onChange={(e) => set("title", e.target.value)}
          error={!!errors.title}
          autoFocus
        />
      </Field>

      {/* Description */}
      <Field label="Description">
        <textarea
          placeholder="Add more details (optional)..."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className={cn(
            "w-full px-3.5 py-3 text-sm rounded-lg resize-none",
            "bg-white/82 dark:bg-[#0D1117]/90 backdrop-blur-sm",
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
          onChange={(e) => set("dueDateTime", e.target.value)}
          className={cn(
            "w-full h-11 px-3.5 text-sm rounded-lg",
            "bg-white/82 dark:bg-[#0D1117]/90",
            "text-[#0F172A] dark:text-[#F0F6FC]",
            "border-[1.5px]",
            errors.dueDateTime
              ? "border-[#F43F5E] focus:border-[#F43F5E] focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]"
              : "border-[#E2E6ED] dark:border-[#21262D] focus:border-indigo-600 dark:focus:border-[#818CF8] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]",
            "focus:outline-none",
            "hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
            "transition-all duration-[250ms]",
            "[color-scheme:light] dark:[color-scheme:dark]",
          )}
        />
      </Field>

      {/* Priority */}
      <Field label="Priority">
        <div className="grid grid-cols-3 gap-2">
          {PRIORITIES.map(({ value, label, color, bg }) => (
            <button
              key={value}
              type="button"
              onClick={() => set("priority", value)}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-medium",
                "transition-all duration-[250ms]",
                form.priority === value
                  ? [bg, color, "shadow-sm"]
                  : "border-[#E2E6ED] dark:border-[#21262D] text-[#475569] dark:text-[#8B949E] hover:border-[#C8CDD8] dark:hover:border-[#30363D] bg-white dark:bg-[#161B22]",
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  value === "HIGH" && "bg-[#F43F5E]",
                  value === "MEDIUM" && "bg-[#F59E0B]",
                  value === "LOW" && "bg-[#94A3B8]",
                )}
              />
              {label}
            </button>
          ))}
        </div>
      </Field>

      {/* Scope */}
      <Field label="Scope">
        <div className="grid grid-cols-2 gap-2">
          {(["PERSONAL", "GROUP"] as ReminderScope[]).map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => set("scope", scope)}
              className={cn(
                "py-2.5 rounded-lg border text-xs font-medium",
                "transition-all duration-[250ms]",
                form.scope === scope
                  ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white border-transparent shadow-sm shadow-indigo-500/20"
                  : "border-[#E2E6ED] dark:border-[#21262D] text-[#475569] dark:text-[#8B949E] hover:border-[#C8CDD8] dark:hover:border-[#30363D] bg-white dark:bg-[#161B22]",
              )}
            >
              {scope === "PERSONAL" ? "Personal" : "Group"}
            </button>
          ))}
        </div>
      </Field>

      {/* Group selector — visible only when scope is GROUP */}
      {form.scope === "GROUP" && (
        <Field label="Group" error={errors.groupId} required>
          <select
            value={form.groupId}
            onChange={(e) => set("groupId", e.target.value)}
            className={cn(
              "w-full h-11 px-3.5 text-sm rounded-lg appearance-none",
              "bg-white/82 dark:bg-[#0D1117]/90",
              "text-[#0F172A] dark:text-[#F0F6FC]",
              "border-[1.5px]",
              errors.groupId
                ? "border-[#F43F5E]"
                : "border-[#E2E6ED] dark:border-[#21262D]",
              "focus:outline-none focus:border-indigo-600 dark:focus:border-[#818CF8]",
              "focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]",
              "transition-all duration-[250ms]",
            )}
          >
            <option value="">Select a group...</option>
            {groups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {/* Footer */}
      <div
        className={cn(
          "sticky bottom-0 -mx-6 -mb-5 px-6 py-4 mt-2",
          "flex items-center gap-3",
          "bg-white dark:bg-[#161B22]",
          "border-t border-[#E2E6ED] dark:border-[#21262D]",
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

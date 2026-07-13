/**
 * components/modal/CreateGroupModal.tsx
 *
 * Slide-in-from-right modal for creating a new group.
 */

import { useState } from "react";
import { SlideModal } from "./SlideModal";
import { Button, Field, Input } from "../ui";
import { cn } from "../../utils/cn";
import { useGroups } from "../../hooks/useGroups";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const INIT = { name: "", description: "" };
type FormErrors = Partial<Record<keyof typeof INIT, string>>;

export function CreateGroupModal({ isOpen, onClose }: Props) {
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { create } = useGroups();

  const set = (k: keyof typeof INIT, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Group name is required";
    if (form.name.trim().length > 60)
      e.name = "Name must be under 60 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await create({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      });
      setForm(INIT);
      setErrors({});
      onClose();
    } catch {
      // toast already shown inside create()
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
      title="Create Group"
      subtitle="Collaborate with your team on shared tasks"
    >
      {/* Group name */}
      <Field label="Group Name" error={errors.name} required>
        <Input
          placeholder="e.g. Design Team, Engineering..."
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          error={!!errors.name}
          autoFocus
        />
        {/* Character count */}
        <p
          className={cn(
            "text-[11px] mt-1 text-right",
            form.name.length > 55 ? "text-[#F43F5E]" : "text-[#94A3B8]",
          )}
        >
          {form.name.length}/60
        </p>
      </Field>

      {/* Description */}
      <Field label="Description">
        <textarea
          placeholder="What is this group for? (optional)"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          className={cn(
            "w-full px-3.5 py-3 text-sm rounded-lg resize-none",
            "bg-white/82 dark:bg-[#0D1117]/90",
            "text-[#0F172A] dark:text-[#F0F6FC] placeholder:text-[#94A3B8]",
            "border-[1.5px] border-[#E2E6ED] dark:border-[#21262D]",
            "focus:outline-none focus:border-indigo-600 dark:focus:border-[#818CF8]",
            "focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]",
            "hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
            "transition-all duration-[250ms]",
          )}
        />
      </Field>

      {/* Info banner */}
      <div
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl text-xs",
          "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.10)]",
          "border border-[#C7D2FE] dark:border-[rgba(99,102,241,0.25)]",
          "text-[#4338CA] dark:text-[#A5B4FC]",
        )}
      >
        <span className="text-base leading-none mt-0.5">💡</span>
        <p className="leading-relaxed">
          After creating the group, you can invite members by email and assign
          tasks to the whole team.
        </p>
      </div>

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
          Create Group
        </Button>
      </div>
    </SlideModal>
  );
}

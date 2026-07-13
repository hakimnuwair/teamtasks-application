/**
 * components/reminders/GenerateSubtasksModal.tsx
 *
 * Review step for AI-generated subtasks. Nothing here is persisted — the
 * draft list (useAiSubtaskDraft) is pure client state. Only clicking
 * "Save Subtasks" calls the batch-create endpoint; closing the modal any
 * other way discards everything generated/edited so far.
 */
import { useEffect } from "react";
import { Sparkles, Trash2, Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { SlideModal } from "../modal/SlideModal";
import { Button, Input, Spinner, EmptyState } from "../ui";
import { cn } from "../../utils/cn";
import { useAiSubtaskDraft } from "../../hooks/useAiSubtaskDraft";
import type { Reminder, Priority } from "../../types/types";

interface Props {
  reminder: Reminder;
  isOpen: boolean;
  onClose: () => void;
  /** Called after the batch is successfully saved, so the caller can refresh its list. */
  onConfirmed: () => void;
}

const PRIORITIES: { value: Priority; label: string; dot: string }[] = [
  { value: "HIGH", label: "High", dot: "bg-[#F43F5E]" },
  { value: "MEDIUM", label: "Medium", dot: "bg-[#F59E0B]" },
  { value: "LOW", label: "Low", dot: "bg-[#94A3B8]" },
];

export function GenerateSubtasksModal({
  reminder,
  isOpen,
  onClose,
  onConfirmed,
}: Props) {
  const {
    suggestions,
    isGenerating,
    isConfirming,
    error,
    generate,
    updateSuggestion,
    removeSuggestion,
    addBlankSuggestion,
    confirm,
    reset,
  } = useAiSubtaskDraft(reminder._id);

  // Kick off generation the first time the modal opens; reset the draft when it closes.
  useEffect(() => {
    if (isOpen) {
      generate();
    } else {
      reset();
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    const created = await confirm();
    if (created) {
      onConfirmed();
      onClose();
    }
  };

  const inputCls =
    "w-full h-10 px-3 text-sm rounded-lg bg-white dark:bg-[#0D1117] text-[#0F172A] dark:text-[#F0F6FC] " +
    "placeholder:text-[#94A3B8] border-[1.5px] border-[#E2E6ED] dark:border-[#21262D] focus:outline-none " +
    "focus:border-indigo-600 dark:focus:border-[#818CF8] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] " +
    "hover:border-[#C8CDD8] dark:hover:border-[#30363D] transition-all duration-[250ms]";

  return (
    <SlideModal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Subtasks with AI"
      subtitle={reminder.title}
    >
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Spinner size="lg" />
          <p className="text-sm text-[#94A3B8]">Generating subtasks...</p>
        </div>
      ) : error && suggestions.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-7 h-7" />}
          title="Couldn't generate subtasks"
          description={error}
          action={
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={generate}
            >
              Try Again
            </Button>
          }
        />
      ) : suggestions.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-7 h-7" />}
          title="No suggestions yet"
          description="Click Generate to let AI draft an execution plan for this task."
          action={
            <Button size="sm" leftIcon={<Sparkles className="w-4 h-4" />} onClick={generate}>
              Generate
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-[#94A3B8]">
            Review the suggestions below — edit, remove, or add your own before saving.
            Nothing is created until you confirm.
          </p>

          <div className="space-y-3">
            {suggestions.map((s) => (
              <div
                key={s.tempId}
                className="p-3 rounded-xl border border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#161B22] space-y-2.5"
              >
                <div className="flex items-start gap-2">
                  <Input
                    className="flex-1"
                    placeholder="Subtask title"
                    value={s.title}
                    onChange={(e) =>
                      updateSuggestion(s.tempId, { title: e.target.value })
                    }
                  />
                  <button
                    onClick={() => removeSuggestion(s.tempId)}
                    className="shrink-0 mt-0.5 p-2 rounded-lg text-[#C8CDD8] dark:text-[#30363D] hover:bg-[#FFF1F2] dark:hover:bg-[rgba(244,63,94,0.10)] hover:text-[#F43F5E] transition-all duration-[250ms]"
                    title="Remove suggestion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  placeholder="Description (optional)"
                  value={s.description}
                  onChange={(e) =>
                    updateSuggestion(s.tempId, { description: e.target.value })
                  }
                  rows={2}
                  className={cn(
                    "w-full px-3 py-2 text-sm rounded-lg resize-none",
                    "bg-white dark:bg-[#0D1117] text-[#0F172A] dark:text-[#F0F6FC] placeholder:text-[#94A3B8]",
                    "border-[1.5px] border-[#E2E6ED] dark:border-[#21262D]",
                    "focus:outline-none focus:border-indigo-600 dark:focus:border-[#818CF8] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]",
                    "hover:border-[#C8CDD8] dark:hover:border-[#30363D] transition-all duration-[250ms]",
                  )}
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="datetime-local"
                    value={s.dueDateTime}
                    onChange={(e) =>
                      updateSuggestion(s.tempId, { dueDateTime: e.target.value })
                    }
                    className={cn(
                      inputCls,
                      "flex-1 min-w-[180px] [color-scheme:light] dark:[color-scheme:dark]",
                    )}
                  />
                  <div className="flex items-center gap-1.5">
                    {PRIORITIES.map(({ value, label, dot }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateSuggestion(s.tempId, { priority: value })}
                        title={label}
                        className={cn(
                          "flex items-center gap-1 px-2.5 h-10 rounded-lg border text-xs font-medium transition-all duration-[250ms]",
                          s.priority === value
                            ? "border-indigo-600 dark:border-indigo-500 bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.12)] text-indigo-600 dark:text-indigo-400"
                            : "border-[#E2E6ED] dark:border-[#21262D] text-[#475569] dark:text-[#8B949E] hover:border-[#C8CDD8] dark:hover:border-[#30363D] bg-white dark:bg-[#161B22]",
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="secondary"
            className="w-full"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={addBlankSuggestion}
          >
            Add Another
          </Button>

          <div
            className={cn(
              "sticky bottom-0 -mx-6 -mb-5 px-6 py-4 mt-2 flex items-center gap-3",
              "bg-white dark:bg-[#161B22] border-t border-[#E2E6ED] dark:border-[#21262D]",
            )}
          >
            <Button
              variant="ghost"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={generate}
              disabled={isConfirming}
            >
              Regenerate
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              isLoading={isConfirming}
              disabled={suggestions.length === 0}
            >
              Save Subtasks
            </Button>
          </div>
        </div>
      )}
    </SlideModal>
  );
}

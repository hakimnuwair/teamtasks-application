/**
 * hooks/useAiSubtaskDraft.ts
 *
 * Ephemeral, client-only draft list for the "Generate Subtasks with AI"
 * review flow. Deliberately separate from useSubReminders (which is scoped
 * to the *persisted* list and always reconciles against the server) — items
 * here are not real sub-reminders until confirm() succeeds, and nothing is
 * written to the database before that.
 */
import { useState } from "react";
import * as subReminderService from "../services/subReminder";
import { parseForm, createSubReminderSchema } from "../lib/validations";
import { parseApiError } from "../config/axios";
import toast from "react-hot-toast";
import type { DraftSubtask, Reminder } from "../types/types";

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in local time, not a raw ISO string
const toDatetimeLocal = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const makeTempId = () =>
  `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const BLANK_DRAFT: Omit<DraftSubtask, "tempId"> = {
  title: "",
  description: "",
  dueDateTime: "",
  priority: "MEDIUM",
};

export const useAiSubtaskDraft = (parentId: string | undefined) => {
  const [suggestions, setSuggestions] = useState<DraftSubtask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!parentId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await subReminderService.generateSubtasks(parentId);
      setSuggestions(
        result.map((s) => ({
          ...s,
          dueDateTime: toDatetimeLocal(s.dueDateTime),
          tempId: makeTempId(),
        })),
      );
    } catch (err: unknown) {
      const msg = parseApiError(err, "Could not generate subtasks");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSuggestion = (
    tempId: string,
    patch: Partial<Omit<DraftSubtask, "tempId">>,
  ) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, ...patch } : s)),
    );
  };

  const removeSuggestion = (tempId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.tempId !== tempId));
  };

  const addBlankSuggestion = () => {
    setSuggestions((prev) => [
      ...prev,
      { ...BLANK_DRAFT, tempId: makeTempId() },
    ]);
  };

  const reset = () => {
    setSuggestions([]);
    setError(null);
  };

  const confirm = async (): Promise<Reminder[] | null> => {
    if (!parentId || suggestions.length === 0) return null;

    // Validate every row with the exact same schema the manual add form
    // already uses — no new validation logic, just reused per-item.
    const items = [];
    for (const s of suggestions) {
      const { data, errors } = parseForm(createSubReminderSchema, {
        title: s.title,
        description: s.description || undefined,
        dueDateTime: s.dueDateTime,
        priority: s.priority,
      });
      if (errors) {
        toast.error(
          `"${s.title || "Untitled"}": ${Object.values(errors)[0]}`,
        );
        return null;
      }
      items.push(data);
    }

    setIsConfirming(true);
    try {
      const created = await subReminderService.createSubRemindersBatch(
        parentId,
        items,
      );
      toast.success(
        `${created.length} sub-reminder${created.length !== 1 ? "s" : ""} added`,
      );
      setSuggestions([]);
      return created;
    } catch (err: unknown) {
      toast.error(parseApiError(err, "Could not save sub-reminders"));
      return null;
    } finally {
      setIsConfirming(false);
    }
  };

  return {
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
  };
};

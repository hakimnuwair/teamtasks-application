/**
 * hooks/useSubReminders.ts
 *
 * Local-state hook for a single parent reminder's sub-reminders (not a Zustand store —
 * sub-reminders are only ever viewed scoped to one open Reminder Details page, mirroring
 * how useGroupDetail.tsx keeps its parent-scoped reminder data local rather than global).
 *
 * fetch() is not auto-triggered on mount; the caller (SubRemindersSection) decides when to
 * load, same responsibility split CreateReminderModal uses for its own reset-on-open effect.
 */
import { useState, useCallback } from "react";
import * as subReminderService from "../services/subReminder";
import { parseApiError } from "../config/axios";
import toast from "react-hot-toast";
import type { Reminder, CreateSubReminderPayload } from "../types/types";

export const useSubReminders = (parentId: string | undefined) => {
  const [subReminders, setSubReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!parentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await subReminderService.getSubReminders(parentId);
      setSubReminders(result);
    } catch (err: unknown) {
      setError(parseApiError(err, "Failed to load sub-reminders"));
    } finally {
      setIsLoading(false);
    }
  }, [parentId]);

  const create = async (payload: CreateSubReminderPayload) => {
    if (!parentId) return;
    const subReminder = await subReminderService.createSubReminder(
      parentId,
      payload,
    );
    toast.success("Sub-reminder added");
    await fetch();
    return subReminder;
  };

  const complete = async (subId: string) => {
    if (!parentId) return;
    try {
      await subReminderService.completeSubReminder(parentId, subId);
      toast.success("Marked complete!");
      await fetch();
    } catch (err: unknown) {
      toast.error(parseApiError(err, "Could not complete sub-reminder"));
    }
  };

  const remove = async (subId: string) => {
    if (!parentId) return;
    try {
      await subReminderService.deleteSubReminder(parentId, subId);
      toast.success("Sub-reminder deleted");
      await fetch();
    } catch (err: unknown) {
      toast.error(parseApiError(err, "Could not delete sub-reminder"));
    }
  };

  return { subReminders, isLoading, error, fetch, create, complete, remove };
};

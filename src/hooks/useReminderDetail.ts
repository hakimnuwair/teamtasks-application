/**
 * hooks/useReminderDetail.ts
 *
 * Single-reminder fetch-by-id hook backing the Reminder Details page.
 * Modeled on useGroupDetail.tsx but for one entity, not a list.
 */
import { useState, useCallback } from "react";
import * as reminderService from "../services/reminder";
import { SUB_REMINDER_BLOCK_MESSAGE } from "../services/subReminder";
import { parseApiError } from "../config/axios";
import toast from "react-hot-toast";
import type { Reminder } from "../types/types";

export const useReminderDetail = (id: string | undefined) => {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const r = await reminderService.getReminderById(id);
      setReminder(r);
    } catch (err: unknown) {
      setError(parseApiError(err, "Reminder not found"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const complete = useCallback(async () => {
    if (!id) return;
    setIsCompleting(true);
    try {
      const updated = await reminderService.completeReminder(id);
      setReminder(updated);
      toast.success("Marked complete!");
    } catch (err: unknown) {
      const msg = parseApiError(err, "Could not complete reminder");
      toast.error(
        msg,
        msg === SUB_REMINDER_BLOCK_MESSAGE ? { duration: 6000 } : undefined,
      );
    } finally {
      setIsCompleting(false);
    }
  }, [id]);

  const remove = useCallback(async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await reminderService.deleteReminder(id);
      toast.success("Reminder deleted");
    } finally {
      setIsDeleting(false);
    }
  }, [id]);

  return { reminder, isLoading, error, isCompleting, isDeleting, load, complete, remove };
};

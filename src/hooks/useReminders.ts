/**
 * hooks/useReminders.ts
 *
 * Reminders data hook. Re-fetches after every mutation.
 * create() now accepts assignedUsers[] for group reminder assignment.
 */
import { useEffect, useCallback } from "react";
import { useReminderStore } from "../store/reminderStore";
import * as reminderService from "../services/reminder";
import toast from "react-hot-toast";
import type { CreateReminderPayload } from "../types/types";

export const useReminders = () => {
  const {
    reminders,
    filters,
    pagination,
    isLoading,
    error,
    setReminders,
    setFilters,
    setLoading,
    setError,
  } = useReminderStore();

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await reminderService.getReminders(filters);
      setReminders(result.reminders, result.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  }, [filters, setReminders, setLoading, setError]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const complete = async (id: string) => {
    try {
      await reminderService.completeReminder(id);
      toast.success("Marked complete!");
      await fetchReminders();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not complete reminder";
      toast.error(msg);
    }
  };

  const remove = async (id: string) => {
    try {
      await reminderService.deleteReminder(id);
      toast.success("Reminder deleted");
      await fetchReminders();
    } catch {
      toast.error("Could not delete reminder");
    }
  };

  const create = async (payload: CreateReminderPayload) => {
    const reminder = await reminderService.createReminder(payload);
    await fetchReminders();
    return reminder;
  };

  return {
    reminders,
    filters,
    pagination,
    isLoading,
    error,
    setFilters,
    fetchReminders,
    complete,
    remove,
    create,
  };
};

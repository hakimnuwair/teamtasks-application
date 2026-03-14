import { useEffect, useCallback } from "react";
import { useReminderStore } from "../store/reminderStore";
import * as reminderService from "../services/reminder";
import toast from "react-hot-toast";

/**
 * Reminders data hook.
 * Reads filters from store, fetches from API, writes back to store.
 * Re-fetches after every mutation to get fully-populated documents.
 */
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
      const msg =
        err instanceof Error ? err.message : "Failed to load reminders";
      setError(msg);
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
      toast.success("Reminder marked complete!");
      await fetchReminders();
    } catch {
      toast.error("Could not complete reminder");
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

  const create = async (
    payload: Parameters<typeof reminderService.createReminder>[0],
  ) => {
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

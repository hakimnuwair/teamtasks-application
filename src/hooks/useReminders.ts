import { useEffect, useCallback } from "react";
import { useReminderStore } from "../store/reminderStore";
import * as reminderService from "../services/reminder";
import toast from "react-hot-toast";

/**
 * Primary hook for the Reminders page.
 * - Reads filters from store, fetches from API, writes back to store.
 * - Re-fetches automatically whenever filters change.
 */
export const useReminders = () => {
  const {
    reminders,
    filters,
    pagination,
    isLoading,
    error,
    setReminders,
    addReminder,
    updateReminder,
    removeReminder,
    setFilters,
    setLoading,
    setError,
  } = useReminderStore();

  // ── Fetch ──────────────────────────────────────────────────────────────────
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

  // Re-fetch whenever filters (status, priority, page) change
  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // ── Complete ───────────────────────────────────────────────────────────────
  const complete = async (id: string) => {
    try {
      const updated = await reminderService.completeReminder(id);
      updateReminder(updated);
      toast.success("Reminder marked complete!");
    } catch {
      toast.error("Could not complete reminder");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const remove = async (id: string) => {
    try {
      await reminderService.deleteReminder(id);
      removeReminder(id);
      toast.success("Reminder deleted");
    } catch {
      toast.error("Could not delete reminder");
    }
  };

  // ── Create (called by modal, updates store optimistically) ─────────────────
  const create = async (
    payload: Parameters<typeof reminderService.createReminder>[0],
  ) => {
    const reminder = await reminderService.createReminder(payload);
    addReminder(reminder);
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

/**
 * hooks/useReminders.ts
 *
 * Single source of truth for reminder data.
 * Components never call reminderService directly — they call this hook.
 *
 * Architecture: Component → useReminders → reminderStore ← reminderService
 *
 * When filters.groupId is set → GET /groups/:id/reminders (group-scoped)
 * Otherwise                   → GET /reminders (all for current user)
 */
import { useEffect, useCallback } from "react";
import { useReminderStore } from "../store/reminderStore";
import * as reminderService from "../services/reminder";
import { parseApiError } from "../config/axios";
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
      const result = filters.groupId
        ? await reminderService.getGroupReminders(filters.groupId, {
            status: filters.status,
            priority: filters.priority,
            page: filters.page,
            limit: filters.limit,
          })
        : await reminderService.getReminders(filters);
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
      toast.error(parseApiError(err, "Could not complete reminder"));
    }
  };

  const remove = async (id: string) => {
    // Throws on failure so callers (e.g. DeleteConfirmModal) can display the error.
    // On success, re-fetches and shows a toast.
    await reminderService.deleteReminder(id);
    toast.success("Reminder deleted");
    await fetchReminders();
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

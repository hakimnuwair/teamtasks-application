/**
 * hooks/useReminders.ts
 *
 * Fix: fetchReminders reads filters via getState() instead of closing over
 * the memoized `filters` value — this eliminates the stale-closure race where
 * setFilters updates Zustand but the in-flight useCallback still holds the
 * previous filters snapshot.
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
    setFilters: storeSetFilters,
    setReminders,
    setLoading,
    setError,
  } = useReminderStore();

  // ✅ No dependency on `filters` — always reads the latest value via getState()
  const fetchReminders = useCallback(async () => {
    // Read the current filters snapshot at call-time, not at memo-creation-time
    const currentFilters = useReminderStore.getState().filters;

    setLoading(true);
    setError(null);
    try {
      const result = currentFilters.groupId
        ? await reminderService.getGroupReminders(currentFilters.groupId, {
            status: currentFilters.status,
            priority: currentFilters.priority,
            page: currentFilters.page,
            limit: currentFilters.limit,
          })
        : await reminderService.getReminders(currentFilters);
      setReminders(result.reminders, result.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  }, [setReminders, setLoading, setError]); // ✅ stable deps only — never re-created on filter change

  // ✅ setFilters now updates the store AND immediately triggers a fresh fetch
  // with the merged filters in one atomic step, eliminating the timing gap.
  const setFilters = useCallback(
    async (partial: Parameters<typeof storeSetFilters>[0]) => {
      storeSetFilters(partial);
      // Merge manually so we can pass the complete new filters to the fetch
      // instead of waiting for Zustand's async re-render to propagate.
      const merged = { ...useReminderStore.getState().filters, ...partial };
      setLoading(true);
      setError(null);
      try {
        const result = merged.groupId
          ? await reminderService.getGroupReminders(merged.groupId, {
              status: merged.status,
              priority: merged.priority,
              page: merged.page,
              limit: merged.limit,
            })
          : await reminderService.getReminders(merged);
        setReminders(result.reminders, result.pagination);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load reminders",
        );
      } finally {
        setLoading(false);
      }
    },
    [storeSetFilters, setReminders, setLoading, setError],
  );

  useEffect(() => {
    fetchReminders();
    // fetchReminders is stable (no filter deps), so this only runs on mount.
    // All subsequent fetches are triggered explicitly via setFilters or action callbacks.
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
    setFilters, // now the wrapped version that fetches immediately
    fetchReminders,
    complete,
    remove,
    create,
  };
};

/**
 * hooks/useTasks.ts
 *
 * Fix: fetchTasks reads filters via getState() instead of closing over
 * the memoized `filters` value — this eliminates the stale-closure race where
 * setFilters updates Zustand but the in-flight useCallback still holds the
 * previous filters snapshot.
 */
import { useEffect, useCallback } from "react";
import { useTaskStore } from "../store/taskStore";
import * as taskService from "../services/task";
import type { CreateTaskPayload } from "../types/types";

export const useTasks = () => {
  const {
    tasks,
    filters,
    pagination,
    isLoading,
    error,
    setFilters: storeSetFilters,
    setTasks,
    setLoading,
    setError,
  } = useTaskStore();

  // ✅ No dependency on `filters` — always reads the latest value via getState()
  const fetchTasks = useCallback(async () => {
    // Read the current filters snapshot at call-time, not at memo-creation-time
    const currentFilters = useTaskStore.getState().filters;

    setLoading(true);
    setError(null);
    try {
      const result = currentFilters.groupId
        ? await taskService.getGroupTasks(currentFilters.groupId, {
            status: currentFilters.status,
            priority: currentFilters.priority,
            page: currentFilters.page,
            limit: currentFilters.limit,
          })
        : await taskService.getTasks(currentFilters);
      setTasks(result.tasks, result.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [setTasks, setLoading, setError]); // ✅ stable deps only — never re-created on filter change

  // ✅ setFilters now updates the store AND immediately triggers a fresh fetch
  // with the merged filters in one atomic step, eliminating the timing gap.
  const setFilters = useCallback(
    async (partial: Parameters<typeof storeSetFilters>[0]) => {
      storeSetFilters(partial);
      // Merge manually so we can pass the complete new filters to the fetch
      // instead of waiting for Zustand's async re-render to propagate.
      const merged = { ...useTaskStore.getState().filters, ...partial };
      setLoading(true);
      setError(null);
      try {
        const result = merged.groupId
          ? await taskService.getGroupTasks(merged.groupId, {
              status: merged.status,
              priority: merged.priority,
              page: merged.page,
              limit: merged.limit,
            })
          : await taskService.getTasks(merged);
        setTasks(result.tasks, result.pagination);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    },
    [storeSetFilters, setTasks, setLoading, setError],
  );

  useEffect(() => {
    fetchTasks();
    // fetchTasks is stable (no filter deps), so this only runs on mount.
    // All subsequent fetches are triggered explicitly via setFilters or action callbacks.
  }, [fetchTasks]);

  const create = async (payload: CreateTaskPayload) => {
    const task = await taskService.createTask(payload);
    await fetchTasks();
    return task;
  };

  return {
    tasks,
    filters,
    pagination,
    isLoading,
    error,
    setFilters, // now the wrapped version that fetches immediately
    fetchTasks,
    create,
  };
};

/**
 * hooks/useActivity.ts — Activity log data hook
 */
import { useCallback } from "react";
import { useActivityStore } from "../store/activityStore";
import * as activityService from "../services/activity";

export const useActivity = () => {
  const { logs, pagination, isLoading, error, setLogs, setLoading, setError } =
    useActivityStore();

  const fetchActivity = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const result = await activityService.getUserActivity({
          page,
          limit: 30,
        });
        console.log("logs: ", result.logs);
        setLogs(result.logs, result.pagination);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load activity",
        );
      } finally {
        setLoading(false);
      }
    },
    [setLogs, setLoading, setError],
  );

  const fetchGroupActivity = useCallback(
    async (groupId: string, page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const result = await activityService.getGroupActivity(groupId, {
          page,
          limit: 30,
        });
        setLogs(result.logs, result.pagination);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load group activity",
        );
      } finally {
        setLoading(false);
      }
    },
    [setLogs, setLoading, setError],
  );

  return {
    logs,
    pagination,
    isLoading,
    error,
    fetchActivity,
    fetchGroupActivity,
  };
};

/**
 * hooks/useSubTasks.ts
 *
 * Local-state hook for a single parent task's sub-tasks (not a Zustand store —
 * sub-tasks are only ever viewed scoped to one open Task Details page, mirroring
 * how useGroupDetail.tsx keeps its parent-scoped task data local rather than global).
 *
 * fetch() is not auto-triggered on mount; the caller (SubTasksSection) decides when to
 * load, same responsibility split CreateTaskModal uses for its own reset-on-open effect.
 */
import { useState, useCallback } from "react";
import * as subTaskService from "../services/subTask";
import { parseApiError } from "../config/axios";
import toast from "react-hot-toast";
import type { Task, CreateSubTaskPayload } from "../types/types";

export const useSubTasks = (parentId: string | undefined) => {
  const [subTasks, setSubTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!parentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await subTaskService.getSubTasks(parentId);
      setSubTasks(result);
    } catch (err: unknown) {
      setError(parseApiError(err, "Failed to load sub-tasks"));
    } finally {
      setIsLoading(false);
    }
  }, [parentId]);

  const create = async (payload: CreateSubTaskPayload) => {
    if (!parentId) return;
    const subTask = await subTaskService.createSubTask(parentId, payload);
    toast.success("Sub-task added");
    await fetch();
    return subTask;
  };

  const complete = async (subId: string) => {
    if (!parentId) return;
    try {
      await subTaskService.completeSubTask(parentId, subId);
      toast.success("Marked complete!");
      await fetch();
    } catch (err: unknown) {
      toast.error(parseApiError(err, "Could not complete sub-task"));
    }
  };

  const remove = async (subId: string) => {
    if (!parentId) return;
    try {
      await subTaskService.deleteSubTask(parentId, subId);
      toast.success("Sub-task deleted");
      await fetch();
    } catch (err: unknown) {
      toast.error(parseApiError(err, "Could not delete sub-task"));
    }
  };

  return { subTasks, isLoading, error, fetch, create, complete, remove };
};

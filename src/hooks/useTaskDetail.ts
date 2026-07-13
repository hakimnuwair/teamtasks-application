/**
 * hooks/useTaskDetail.ts
 *
 * Single-task fetch-by-id hook backing the Task Details page.
 * Modeled on useGroupDetail.tsx but for one entity, not a list.
 */
import { useState, useCallback } from "react";
import * as taskService from "../services/task";
import { SUB_TASK_BLOCK_MESSAGE } from "../services/subTask";
import { parseApiError } from "../config/axios";
import toast from "react-hot-toast";
import type { Task } from "../types/types";

export const useTaskDetail = (id: string | undefined) => {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const t = await taskService.getTaskById(id);
      setTask(t);
    } catch (err: unknown) {
      setError(parseApiError(err, "Task not found"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const complete = useCallback(async () => {
    if (!id) return;
    setIsCompleting(true);
    try {
      const updated = await taskService.completeTask(id);
      setTask(updated);
      toast.success("Marked complete!");
    } catch (err: unknown) {
      const msg = parseApiError(err, "Could not complete task");
      toast.error(
        msg,
        msg === SUB_TASK_BLOCK_MESSAGE ? { duration: 6000 } : undefined,
      );
    } finally {
      setIsCompleting(false);
    }
  }, [id]);

  const remove = useCallback(async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await taskService.deleteTask(id);
      toast.success("Task deleted");
    } finally {
      setIsDeleting(false);
    }
  }, [id]);

  return { task, isLoading, error, isCompleting, isDeleting, load, complete, remove };
};

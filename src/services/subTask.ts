/**
 * services/subTask.ts
 *
 * GET /tasks/:id/sub-tasks                        → { success, message, subTasks: [] }
 * POST /tasks/:id/sub-tasks                        → { success, message, ...taskFields }
 * POST /tasks/:id/sub-tasks/:subId/complete        → { success, message, ...taskFields }
 * DELETE /tasks/:id/sub-tasks/:subId                → { success, message }
 * POST /tasks/:id/sub-tasks/generate                → { success, message, suggestions: [] }
 * POST /tasks/:id/sub-tasks/batch                   → { success, message, subTasks: [] }
 *
 * Sub-tasks are plain Task documents with parentId set; groupId/assignedUsers/recurrence
 * are inherited from the parent on the backend and are not accepted here.
 */
import api from "../config/axios";
import type {
  Task,
  CreateSubTaskPayload,
  AiSubTaskSuggestion,
} from "../types/types";

interface ListResponse {
  success: boolean;
  message: string;
  subTasks: Task[];
}
interface SingleResponse extends Task {
  success: boolean;
  message: string;
}
interface SuggestResponse {
  success: boolean;
  message: string;
  suggestions: AiSubTaskSuggestion[];
}

export const SUB_TASK_BLOCK_MESSAGE =
  "Complete or delete all sub-tasks before marking this task complete";

export const getSubTasks = async (parentId: string): Promise<Task[]> => {
  const { data } = await api.get<ListResponse>(`/tasks/${parentId}/sub-tasks`);
  return data.subTasks ?? [];
};

export const createSubTask = async (
  parentId: string,
  payload: CreateSubTaskPayload,
): Promise<Task> => {
  const { data } = await api.post<SingleResponse>(
    `/tasks/${parentId}/sub-tasks`,
    payload,
  );
  return data;
};

export const completeSubTask = async (
  parentId: string,
  subId: string,
): Promise<Task> => {
  const { data } = await api.post<SingleResponse>(
    `/tasks/${parentId}/sub-tasks/${subId}/complete`,
  );
  return data;
};

export const deleteSubTask = async (
  parentId: string,
  subId: string,
): Promise<void> => {
  await api.delete(`/tasks/${parentId}/sub-tasks/${subId}`);
};

export const generateSubTasks = async (
  parentId: string,
): Promise<AiSubTaskSuggestion[]> => {
  const { data } = await api.post<SuggestResponse>(
    `/tasks/${parentId}/sub-tasks/generate`,
  );
  return data.suggestions ?? [];
};

export const createSubTasksBatch = async (
  parentId: string,
  subTasks: CreateSubTaskPayload[],
): Promise<Task[]> => {
  const { data } = await api.post<ListResponse>(
    `/tasks/${parentId}/sub-tasks/batch`,
    { subTasks },
  );
  return data.subTasks ?? [];
};

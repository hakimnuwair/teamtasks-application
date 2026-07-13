/**
 * services/task.ts
 *
 * GET /tasks           → { success, message, tasks: [], pagination: {} }
 * GET /groups/:id/tasks → same shape
 * GET /tasks/:id       → { success, message, ...taskFields }
 * POST /tasks          → { success, message, ...taskFields }
 * PATCH /tasks/:id     → { success, message, ...taskFields }
 * POST /tasks/:id/complete → { success, message, ...taskFields }
 * DELETE /tasks/:id    → { success, message }
 *
 * createTask accepts assignedUsers[] for group tasks.
 */
import api from "../config/axios";
import type { Task, CreateTaskPayload, Pagination } from "../types/types";

interface GetParams {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}
interface ListResponse {
  success: boolean;
  message: string;
  tasks: Task[];
  pagination: Pagination;
}
interface SingleResponse extends Task {
  success: boolean;
  message: string;
}

export const getTasks = async (params: GetParams = {}) => {
  const { data } = await api.get<ListResponse>("/tasks", { params });
  return { tasks: data.tasks ?? [], pagination: data.pagination };
};

export const getGroupTasks = async (
  groupId: string,
  params: GetParams = {},
) => {
  const { data } = await api.get<ListResponse>(`/groups/${groupId}/tasks`, {
    params,
  });
  return { tasks: data.tasks ?? [], pagination: data.pagination };
};

export const getTaskById = async (id: string): Promise<Task> => {
  const { data } = await api.get<SingleResponse>(`/tasks/${id}`);
  return data;
};

export const createTask = async (payload: CreateTaskPayload): Promise<Task> => {
  const { data } = await api.post<SingleResponse>("/tasks", payload);
  return data;
};

export const updateTask = async (
  id: string,
  payload: Partial<CreateTaskPayload>,
): Promise<Task> => {
  const { data } = await api.patch<SingleResponse>(`/tasks/${id}`, payload);
  return data;
};

export const completeTask = async (id: string): Promise<Task> => {
  const { data } = await api.post<SingleResponse>(`/tasks/${id}/complete`);
  return data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

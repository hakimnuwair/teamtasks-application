/**
 * services/reminder.ts
 *
 * GET /reminders           → { success, message, reminders: [], pagination: {} }
 * GET /groups/:id/reminders → same shape
 * GET /reminders/:id       → { success, message, ...reminderFields }
 * POST /reminders          → { success, message, ...reminderFields }
 * PATCH /reminders/:id     → { success, message, ...reminderFields }
 * POST /reminders/:id/complete → { success, message, ...reminderFields }
 * DELETE /reminders/:id    → { success, message }
 *
 * createReminder accepts assignedUsers[] for group reminders.
 */
import api from "../config/axios";
import type {
  Reminder,
  CreateReminderPayload,
  Pagination,
} from "../types/types";

interface GetParams {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}
interface ListResponse {
  success: boolean;
  message: string;
  reminders: Reminder[];
  pagination: Pagination;
}
interface SingleResponse extends Reminder {
  success: boolean;
  message: string;
}

export const getReminders = async (params: GetParams = {}) => {
  const { data } = await api.get<ListResponse>("/reminders", { params });
  return { reminders: data.reminders ?? [], pagination: data.pagination };
};

export const getGroupReminders = async (
  groupId: string,
  params: GetParams = {},
) => {
  const { data } = await api.get<ListResponse>(`/groups/${groupId}/reminders`, {
    params,
  });
  return { reminders: data.reminders ?? [], pagination: data.pagination };
};

export const getReminderById = async (id: string): Promise<Reminder> => {
  const { data } = await api.get<SingleResponse>(`/reminders/${id}`);
  return data;
};

export const createReminder = async (
  payload: CreateReminderPayload,
): Promise<Reminder> => {
  const { data } = await api.post<SingleResponse>("/reminders", payload);
  return data;
};

export const updateReminder = async (
  id: string,
  payload: Partial<CreateReminderPayload>,
): Promise<Reminder> => {
  const { data } = await api.patch<SingleResponse>(`/reminders/${id}`, payload);
  return data;
};

export const completeReminder = async (id: string): Promise<Reminder> => {
  const { data } = await api.post<SingleResponse>(`/reminders/${id}/complete`);
  return data;
};

export const deleteReminder = async (id: string): Promise<void> => {
  await api.delete(`/reminders/${id}`);
};

import api from "../config/axios";
import type {
  Reminder,
  CreateReminderPayload,
  PaginatedResponse,
  ApiResponse,
} from "../types/types";

interface GetRemindersParams {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

// ─── Fetch my reminders (paginated + filterable) ──────────────────────────────

export const getReminders = async (params: GetRemindersParams = {}) => {
  const { data } = await api.get<PaginatedResponse<Reminder>>("/reminders", {
    params,
  });
  return {
    reminders: data.reminders ?? [],
    pagination: data.pagination,
  };
};

// ─── Fetch reminders for a specific group ────────────────────────────────────

export const getGroupReminders = async (
  groupId: string,
  params: GetRemindersParams = {},
) => {
  const { data } = await api.get<PaginatedResponse<Reminder>>(
    `/groups/${groupId}/reminders`,
    { params },
  );
  return {
    reminders: data.reminders ?? [],
    pagination: data.pagination,
  };
};

// ─── Get single reminder ─────────────────────────────────────────────────────

export const getReminderById = async (id: string): Promise<Reminder> => {
  const { data } = await api.get<ApiResponse<Reminder>>(`/reminders/${id}`);
  return data.data;
};

// ─── Create ──────────────────────────────────────────────────────────────────

export const createReminder = async (
  payload: CreateReminderPayload,
): Promise<Reminder> => {
  const { data } = await api.post<ApiResponse<Reminder>>("/reminders", payload);
  return data.data;
};

// ─── Update ──────────────────────────────────────────────────────────────────

export const updateReminder = async (
  id: string,
  payload: Partial<CreateReminderPayload>,
): Promise<Reminder> => {
  const { data } = await api.put<ApiResponse<Reminder>>(
    `/reminders/${id}`,
    payload,
  );
  return data.data;
};

// ─── Complete ────────────────────────────────────────────────────────────────

export const completeReminder = async (id: string): Promise<Reminder> => {
  const { data } = await api.post<ApiResponse<Reminder>>(
    `/reminders/${id}/complete`,
  );
  return data.data;
};

// ─── Delete ──────────────────────────────────────────────────────────────────

export const deleteReminder = async (id: string): Promise<void> => {
  await api.delete(`/reminders/${id}`);
};

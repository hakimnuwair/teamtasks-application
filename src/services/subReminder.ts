/**
 * services/subReminder.ts
 *
 * GET /reminders/:id/sub-reminders                        → { success, message, subReminders: [] }
 * POST /reminders/:id/sub-reminders                        → { success, message, ...reminderFields }
 * POST /reminders/:id/sub-reminders/:subId/complete        → { success, message, ...reminderFields }
 * DELETE /reminders/:id/sub-reminders/:subId                → { success, message }
 *
 * Sub-reminders are plain Reminder documents with parentId set; groupId/assignedUsers/recurrence
 * are inherited from the parent on the backend and are not accepted here.
 */
import api from "../config/axios";
import type { Reminder, CreateSubReminderPayload } from "../types/types";

interface ListResponse {
  success: boolean;
  message: string;
  subReminders: Reminder[];
}
interface SingleResponse extends Reminder {
  success: boolean;
  message: string;
}

export const SUB_REMINDER_BLOCK_MESSAGE =
  "Complete or delete all sub-reminders before marking this reminder complete";

export const getSubReminders = async (parentId: string): Promise<Reminder[]> => {
  const { data } = await api.get<ListResponse>(
    `/reminders/${parentId}/sub-reminders`,
  );
  return data.subReminders ?? [];
};

export const createSubReminder = async (
  parentId: string,
  payload: CreateSubReminderPayload,
): Promise<Reminder> => {
  const { data } = await api.post<SingleResponse>(
    `/reminders/${parentId}/sub-reminders`,
    payload,
  );
  return data;
};

export const completeSubReminder = async (
  parentId: string,
  subId: string,
): Promise<Reminder> => {
  const { data } = await api.post<SingleResponse>(
    `/reminders/${parentId}/sub-reminders/${subId}/complete`,
  );
  return data;
};

export const deleteSubReminder = async (
  parentId: string,
  subId: string,
): Promise<void> => {
  await api.delete(`/reminders/${parentId}/sub-reminders/${subId}`);
};

/**
 * services/notification.ts
 *
 * GET /notifications → { success, message, notifications: [], total, unreadCount, pagination }
 *   (notificationService returns { notifications, total, unreadCount, pagination }
 *    which gets Object.assign'd flat into the response)
 * PATCH /notifications/read     → { success, message, modifiedCount }
 * PATCH /notifications/read-all → { success, message, modifiedCount }
 * DELETE /notifications/:id     → { success, message }
 */
import api from "../config/axios";
import type { Notification, Pagination } from "../types/types";

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}
export interface GetNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  pagination: Pagination | undefined;
}

interface NotificationsResponse {
  success: boolean;
  message: string;
  notifications: Notification[];
  total: number;
  unreadCount: number;
  pagination: Pagination;
}

export const getNotifications = async (
  params: GetNotificationsParams = {},
): Promise<GetNotificationsResult> => {
  const { data } = await api.get<NotificationsResponse>("/notifications", {
    params,
  });
  return {
    notifications: data.notifications ?? [],
    unreadCount: data.unreadCount ?? 0,
    pagination: data.pagination,
  };
};

export const markAsRead = async (notificationIds: string[]): Promise<void> => {
  await api.patch("/notifications/read", { notificationIds });
};

export const markAllAsRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all");
};

export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};

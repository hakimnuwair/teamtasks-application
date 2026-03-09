/**
 * services/notification.ts — Notification API calls
 */
import api from "../config/axios";
import type {
  Notification,
  PaginatedResponse,
  ApiResponse,
} from "../types/types";

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface GetNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  pagination: PaginatedResponse<Notification>["pagination"];
}

export const getNotifications = async (
  params: GetNotificationsParams = {},
): Promise<GetNotificationsResult> => {
  const { data } = await api.get<
    PaginatedResponse<Notification> & { unreadCount: number }
  >("/notifications", { params });
  return {
    notifications: data.notifications ?? data.data ?? [],
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

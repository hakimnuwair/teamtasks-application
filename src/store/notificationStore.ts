import { create } from "zustand";
import type { Notification } from "../types/types";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  setNotifications: (
    notifications: Notification[],
    unreadCount: number,
  ) => void;
  prependNotification: (notification: Notification) => void; // real-time push
  markRead: (ids: string[]) => void;
  markAllRead: () => void;
  setLoading: (loading: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  setNotifications: (notifications, unreadCount) =>
    set({ notifications, unreadCount }),

  prependNotification: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    })),

  markRead: (ids) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        ids.includes(n._id) ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(
        0,
        s.unreadCount -
          ids.filter((id) =>
            s.notifications.find((n) => n._id === id && !n.isRead),
          ).length,
      ),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  setLoading: (isLoading) => set({ isLoading }),
}));

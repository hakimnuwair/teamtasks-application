/**
 * store/notificationStore.ts — Zustand store for notifications
 * Replaces the old placeholder version with real Notification type.
 */
import { create } from "zustand";
import type { Notification } from "../types/types";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (n: Notification[], unreadCount?: number) => void;
  prependNotification: (n: Notification) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  setUnreadCount: (c: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications, unreadCount) =>
    set({
      notifications,
      unreadCount: unreadCount ?? notifications.filter((n) => !n.isRead).length,
    }),

  prependNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + (n.isRead ? 0 : 1),
    })),

  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n._id === id
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n,
      ),
      unreadCount: Math.max(
        0,
        s.unreadCount -
          (s.notifications.find((n) => n._id === id && !n.isRead) ? 1 : 0),
      ),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: new Date().toISOString(),
      })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n._id !== id),
      unreadCount: Math.max(
        0,
        s.unreadCount -
          (s.notifications.find((n) => n._id === id && !n.isRead) ? 1 : 0),
      ),
    })),

  setUnreadCount: (unreadCount) => set({ unreadCount }),
}));

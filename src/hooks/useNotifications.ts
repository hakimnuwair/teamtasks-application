/**
 * hooks/useNotifications.ts
 *
 * Single source of truth for notification data.
 * Components never call notificationService directly — they call this hook.
 *
 * Architecture: Component → useNotifications → notificationStore ← notificationService
 *
 * fetchNotifications() is called explicitly by the page that needs it (Notifications page).
 * The unreadCount is bootstrapped by AppLayout via this hook on mount (not via the service directly).
 */
import { useCallback } from "react";
import { useNotificationStore } from "../store/notificationStore";
import * as notificationService from "../services/notification";
import toast from "react-hot-toast";

export const useNotifications = () => {
  const {
    notifications,
    unreadCount,
    setNotifications,
    markAsRead,
    markAllRead,
    removeNotification,
    setUnreadCount,
  } = useNotificationStore();

  /** Full fetch — loads all notifications and updates unreadCount in the store. */
  const fetchNotifications = useCallback(
    async (unreadOnly = false) => {
      try {
        const result = await notificationService.getNotifications({
          unreadOnly,
          limit: 50,
        });
        setNotifications(result.notifications, result.unreadCount);
      } catch {
        // Fail silently — store keeps previous state, badge stays visible
      }
    },
    [setNotifications],
  );

  /** Lightweight fetch — only refreshes the unreadCount badge (no full list). */
  const refreshUnreadCount = useCallback(async () => {
    try {
      const result = await notificationService.getNotifications({ limit: 1 });
      setUnreadCount(result.unreadCount);
    } catch {
      // Fail silently
    }
  }, [setUnreadCount]);

  const handleMarkAsRead = async (id: string) => {
    markAsRead(id); // optimistic
    try {
      await notificationService.markAsRead([id]);
    } catch {
      // Optimistic update is fine — read state doesn't need to revert
    }
  };

  const handleMarkAllAsRead = async () => {
    markAllRead(); // optimistic
    try {
      await notificationService.markAllAsRead();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Could not mark all as read");
    }
  };

  const handleDelete = async (id: string) => {
    removeNotification(id); // optimistic
    try {
      await notificationService.deleteNotification(id);
    } catch {
      toast.error("Could not delete notification");
    }
  };

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    refreshUnreadCount,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDelete,
  };
};

/**
 * hooks/useNotifications.ts — Notifications data hook
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
  } = useNotificationStore();

  const [isLoading, setIsLoading] = [false, (_: boolean) => {}]; // local loading handled by caller

  const fetchNotifications = useCallback(
    async (unreadOnly = false) => {
      try {
        const result = await notificationService.getNotifications({
          unreadOnly,
          limit: 50,
        });
        setNotifications(result.notifications, result.unreadCount);
      } catch {
        // fail silently — store keeps previous state
      }
    },
    [setNotifications],
  );

  const handleMarkAsRead = async (id: string) => {
    markAsRead(id); // optimistic
    try {
      await notificationService.markAsRead([id]);
    } catch {
      // optimistic update is fine — no need to revert for read state
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
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDelete,
  };
};

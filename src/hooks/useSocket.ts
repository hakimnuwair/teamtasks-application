import { useEffect } from "react";
import { getSocket } from "../config/socket";
import { useNotificationStore } from "../store/notificationStore";
import { useReminderStore } from "../store/reminderStore";
import { useAuthStore } from "../store/authStore";
import type { Notification, Reminder } from "../types/types";
import toast from "react-hot-toast";

/**
 * Wire up all Socket.io event listeners.
 * Mount once inside AppLayout so listeners live for the full authenticated session.
 */
export const useSocket = () => {
  const { user } = useAuthStore();
  const { prependNotification } = useNotificationStore();
  const { updateReminder, addReminder } = useReminderStore();

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    // ── Real-time notification from scheduler ──────────────────────────────
    socket.on(
      "notificationTriggered",
      (data: { message: string; reminderId: string; title: string }) => {
        toast(`⏰ ${data.title}`, { duration: 5000 });
        // The full notification object will be fetched next time notifications load
      },
    );

    // ── Reminder assigned to me ────────────────────────────────────────────
    socket.on("notificationTriggered", (notification: Notification) => {
      prependNotification(notification);
    });

    // ── Reminder created in a group I'm in ────────────────────────────────
    socket.on("reminderCreated", ({ reminder }: { reminder: Reminder }) => {
      // Only add if it's assigned to me and not already in store
      if (reminder.assignedUsers.some((u) => u._id === user.id)) {
        addReminder(reminder);
      }
    });

    // ── Reminder updated ──────────────────────────────────────────────────
    socket.on("reminderUpdated", ({ reminder }: { reminder: Reminder }) => {
      updateReminder(reminder);
    });

    // ── Reminder completed ────────────────────────────────────────────────
    socket.on("reminderCompleted", ({ reminderId }: { reminderId: string }) => {
      // Fetch updated reminder or optimistically update status
      const { reminders } = useReminderStore.getState();
      const existing = reminders.find((r) => r._id === reminderId);
      if (existing) updateReminder({ ...existing, status: "COMPLETED" });
    });

    // ── Group member added ────────────────────────────────────────────────
    socket.on("groupMemberAdded", ({ groupId }: { groupId: string }) => {
      toast(`You were added to a group`, { icon: "👥" });
      // Group store would refetch here
      console.log("[Socket] groupMemberAdded", groupId);
    });

    return () => {
      socket.off("notificationTriggered");
      socket.off("reminderCreated");
      socket.off("reminderUpdated");
      socket.off("reminderCompleted");
      socket.off("groupMemberAdded");
    };
  }, [user, prependNotification, updateReminder, addReminder]);
};

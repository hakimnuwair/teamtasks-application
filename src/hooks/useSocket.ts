/**
 * src/hooks/useSocket.ts
 *
 * Registers ALL real-time event listeners for the authenticated user.
 * Called ONCE inside AppLayout — mounts with the app, unmounts on logout.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  EVENTS RECEIVED FROM BACKEND                                        │
 * ├──────────────────────────────┬───────────────────────────────────────┤
 * │  notificationTriggered       │ Reminder overdue / group invite / etc │
 * │  reminderCreated             │ Group member created a reminder        │
 * │  reminderUpdated             │ Reminder was edited                    │
 * │  reminderCompleted           │ A member completed a reminder          │
 * │  reminderOverdue             │ Scheduler marked reminder overdue      │
 * │  groupMemberAdded            │ Current user was added to a group      │
 * └──────────────────────────────┴───────────────────────────────────────┘
 *
 * Architecture: AppLayout → useSocket → getSocket() → stores (no service calls in UI)
 */
import { useEffect, useRef } from "react";
import { getSocket } from "../config/socket";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { useReminderStore } from "../store/reminderStore";
import { useGroupStore } from "../store/groupStore";
import * as notificationService from "../services/notification";
import * as groupService from "../services/group";
import toast from "react-hot-toast";
import type { Reminder, Notification } from "../types/types";

// ── Payload shapes ────────────────────────────────────────────────────────────

interface NotifPayload {
  notification?: Notification;
  message?: string;
  title?: string;
  type?: string;
}
interface ReminderPayload {
  reminder: Reminder;
}
interface ReminderDonePayload {
  reminderId: string;
  reminder?: Reminder;
}
interface ReminderOverduePayload {
  reminderId: string;
  reminder?: Reminder;
}
interface GroupAddedPayload {
  groupId: string;
}

// ── Toast per notification type ───────────────────────────────────────────────

function showNotifToast(n: Notification): void {
  const icons: Record<string, string> = {
    REMINDER_DUE: "⏰",
    GROUP_INVITE: "👥",
    REMINDER_ASSIGNED: "📋",
    SYSTEM: "🔔",
  };
  const icon = icons[n.type] ?? "🔔";
  toast(`${icon} ${n.message}`, { duration: 6000 });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useSocket = (): void => {
  const user = useAuthStore((s) => s.user);

  // Stable ref — handlers close over this so they never go stale
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!user) return; // not authenticated — do nothing

    const socket = getSocket();

    // ── notificationTriggered ──────────────────────────────────────────────
    // The backend can send either a full Notification object or a simple shape.
    // Normalise both, update the store, show a toast, and refresh the unread count.
    const onNotification = (payload: NotifPayload): void => {
      if (payload.notification) {
        useNotificationStore
          .getState()
          .prependNotification(payload.notification);
        showNotifToast(payload.notification);
      } else {
        // Simplified payload from scheduler — just show toast + bump badge
        const msg =
          payload.title ?? payload.message ?? "You have a new notification";
        toast(`🔔 ${msg}`, { duration: 6000 });
        const prev = useNotificationStore.getState().unreadCount;
        useNotificationStore.getState().setUnreadCount(prev + 1);
      }
      // Always re-fetch unread count to keep badge accurate
      notificationService
        .getNotifications({ limit: 1 })
        .then((r) =>
          useNotificationStore.getState().setUnreadCount(r.unreadCount),
        )
        .catch(() => {
          /* silent */
        });
    };

    // ── reminderCreated ────────────────────────────────────────────────────
    // Only add to local store if the reminder is assigned to me.
    // This prevents group reminders for other members polluting my list.
    const onReminderCreated = ({ reminder }: ReminderPayload): void => {
      const me = userRef.current;
      if (!me) return;
      const myId = me.id ?? me._id ?? "";
      const assigned = reminder.assignedUsers.some(
        (u) => (typeof u === "string" ? u : u._id) === myId,
      );
      if (assigned) {
        useReminderStore.getState().addReminder(reminder);
        toast(`📋 New reminder: "${reminder.title}"`, { duration: 4000 });
      }
    };

    // ── reminderUpdated ────────────────────────────────────────────────────
    // Patch the reminder in-place. If it doesn't exist in the store yet,
    // addReminder adds it so the view stays consistent.
    const onReminderUpdated = ({ reminder }: ReminderPayload): void => {
      const exists = useReminderStore
        .getState()
        .reminders.some((r) => r._id === reminder._id);
      if (exists) {
        useReminderStore.getState().updateReminder(reminder);
      } else {
        useReminderStore.getState().addReminder(reminder);
      }
    };

    // ── reminderCompleted ──────────────────────────────────────────────────
    // Backend sends the full reminder object OR just the ID.
    // Optimistically patch status in the store without a network round-trip.
    const onReminderCompleted = ({
      reminderId,
      reminder,
    }: ReminderDonePayload): void => {
      if (reminder) {
        useReminderStore.getState().updateReminder(reminder);
        return;
      }
      const existing = useReminderStore
        .getState()
        .reminders.find((r) => r._id === reminderId);
      if (existing) {
        useReminderStore.getState().updateReminder({
          ...existing,
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
        });
      }
    };

    // ── reminderOverdue ────────────────────────────────────────────────────
    // Scheduler fires this when a reminder passes its due date.
    // Patch status to OVERDUE so the card immediately turns red.
    const onReminderOverdue = ({
      reminderId,
      reminder,
    }: ReminderOverduePayload): void => {
      if (reminder) {
        useReminderStore.getState().updateReminder(reminder);
        return;
      }
      const existing = useReminderStore
        .getState()
        .reminders.find((r) => r._id === reminderId);
      if (existing) {
        useReminderStore
          .getState()
          .updateReminder({ ...existing, status: "OVERDUE" });
      }
    };

    // ── groupMemberAdded ───────────────────────────────────────────────────
    // Current user was added to a group. Refresh the groups list silently.
    const onGroupMemberAdded = ({ groupId }: GroupAddedPayload): void => {
      toast("👥 You were added to a group!", { duration: 5000 });
      groupService
        .getGroups()
        .then((groups) => useGroupStore.getState().setGroups(groups))
        .catch(() => {
          /* silent */
        });
      console.info("[Socket] groupMemberAdded", groupId);
    };

    // ── Register all listeners ─────────────────────────────────────────────
    socket.on("notificationTriggered", onNotification);
    socket.on("reminderCreated", onReminderCreated);
    socket.on("reminderUpdated", onReminderUpdated);
    socket.on("reminderCompleted", onReminderCompleted);
    socket.on("reminderOverdue", onReminderOverdue);
    socket.on("groupMemberAdded", onGroupMemberAdded);

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      socket.off("notificationTriggered", onNotification);
      socket.off("reminderCreated", onReminderCreated);
      socket.off("reminderUpdated", onReminderUpdated);
      socket.off("reminderCompleted", onReminderCompleted);
      socket.off("reminderOverdue", onReminderOverdue);
      socket.off("groupMemberAdded", onGroupMemberAdded);
    };
  }, [user]); // re-register when user changes (login/logout)
};

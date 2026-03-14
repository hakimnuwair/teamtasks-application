/**
 * hooks/useSocket.ts — Wire ALL Socket.io events for the authenticated session.
 *
 * Mount order: AppLayout calls this once. Listeners are registered when
 * user is present and torn down on unmount or user change.
 *
 * Backend emits these events to the client's personal room (userId):
 *
 *   notificationTriggered  { notification: Notification }
 *     → A REMINDER_DUE notification was created by the scheduler.
 *       The full Notification object is attached.
 *
 *   reminderCreated   { reminder: Reminder }
 *     → A group reminder was created that I'm assigned to.
 *
 *   reminderUpdated   { reminder: Reminder }
 *     → A reminder I own or am assigned to was updated.
 *
 *   reminderCompleted { reminderId: string }  — backend sends ID only
 *     → A reminder was marked complete. We optimistically update status.
 *
 *   groupMemberAdded  { groupId: string, userId: string }
 *     → I was added to a group (via old direct-add route).
 *       We invalidate the group store so the list refreshes.
 */

import { useEffect, useRef } from "react";
import { getSocket } from "../config/socket";
import { useNotificationStore } from "../store/notificationStore";
import { useReminderStore } from "../store/reminderStore";
import { useGroupStore } from "../store/groupStore";
import { useAuthStore } from "../store/authStore";
import * as groupService from "../services/group";
import * as notificationService from "../services/notification";
import toast from "react-hot-toast";
import type { Notification, Reminder } from "../types/types";

// ─── Typed socket payloads ────────────────────────────────────────────────────

interface NotificationPayload {
  notification?: Notification;
  // Scheduler might send a simpler shape — handle both
  message?: string;
  reminderId?: string;
  title?: string;
}

interface ReminderCreatedPayload {
  reminder: Reminder;
}
interface ReminderUpdatedPayload {
  reminder: Reminder;
}
interface ReminderCompletedPayload {
  reminderId: string;
  reminder?: Reminder;
}
interface GroupMemberAddedPayload {
  groupId: string;
  userId?: string;
}

// ─── Toast helpers ────────────────────────────────────────────────────────────

function showNotifToast(n: Notification) {
  switch (n.type) {
    case "REMINDER_DUE":
      toast(`⏰ Reminder due: ${n.message}`, {
        duration: 6000,
        style: { fontWeight: 500 },
      });
      break;
    case "GROUP_INVITE":
      toast(`👥 ${n.message}`, { duration: 6000 });
      break;
    case "REMINDER_ASSIGNED":
      toast(`📋 ${n.message}`, { duration: 4000 });
      break;
    default:
      toast(n.message, { duration: 4000 });
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useSocket = () => {
  const { user } = useAuthStore();
  const { prependNotification } = useNotificationStore();
  const { updateReminder, addReminder } = useReminderStore();
  const { setGroups } = useGroupStore();

  // Stable ref so handlers don't go stale on re-render
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!user) return; // not logged in — don't register listeners

    const socket = getSocket();

    // ── notificationTriggered ────────────────────────────────────────────────
    // Backend sends this from the scheduler AND from group invite flow.
    // The payload shape varies slightly — normalise it.
    const onNotification = (payload: NotificationPayload) => {
      if (payload.notification) {
        // Full notification object (invitation flow)
        prependNotification(payload.notification);
        showNotifToast(payload.notification);
      } else {
        // Scheduler sends simplified shape — show a toast only
        const title =
          payload.title ?? payload.message ?? "You have a new notification";
        toast(`⏰ ${title}`, { duration: 6000 });
        // Increment unread badge without a full notification object
        useNotificationStore
          .getState()
          .setUnreadCount(useNotificationStore.getState().unreadCount + 1);
        // Silently refresh notifications to hydrate the panel correctly
        notificationService
          .getNotifications({ limit: 1 })
          .then((r) => {
            useNotificationStore.getState().setUnreadCount(r.unreadCount);
          })
          .catch(() => {
            /* silent */
          });
      }
    };

    // ── reminderCreated ──────────────────────────────────────────────────────
    // Only add to store if the reminder is assigned to me
    const onReminderCreated = ({ reminder }: ReminderCreatedPayload) => {
      const me = userRef.current;
      if (!me) return;
      const myId = me.id ?? me._id;
      const isAssigned = reminder.assignedUsers.some(
        (u) => (typeof u === "string" ? u : u._id) === myId,
      );
      if (isAssigned) {
        addReminder(reminder);
        toast(`📋 New reminder: "${reminder.title}"`, { duration: 4000 });
      }
    };

    // ── reminderUpdated ──────────────────────────────────────────────────────
    const onReminderUpdated = ({ reminder }: ReminderUpdatedPayload) => {
      updateReminder(reminder);
    };

    // ── reminderCompleted ────────────────────────────────────────────────────
    // Backend sends { reminderId } — optimistically patch status in store
    const onReminderCompleted = ({
      reminderId,
      reminder,
    }: ReminderCompletedPayload) => {
      if (reminder) {
        updateReminder(reminder);
        return;
      }
      const existing = useReminderStore
        .getState()
        .reminders.find((r) => r._id === reminderId);
      if (existing) {
        updateReminder({
          ...existing,
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
        });
      }
    };

    // ── groupMemberAdded ─────────────────────────────────────────────────────
    // Refresh the groups list so the new group appears immediately
    const onGroupMemberAdded = ({ groupId }: GroupMemberAddedPayload) => {
      toast(`👥 You were added to a group`, { duration: 5000 });
      // Re-fetch groups silently so list is up-to-date
      groupService
        .getGroups()
        .then((groups) => setGroups(groups))
        .catch(() => {
          /* silent */
        });
      console.log("[Socket] groupMemberAdded", groupId);
    };

    // ── Register ─────────────────────────────────────────────────────────────
    socket.on("notificationTriggered", onNotification);
    socket.on("reminderCreated", onReminderCreated);
    socket.on("reminderUpdated", onReminderUpdated);
    socket.on("reminderCompleted", onReminderCompleted);
    socket.on("groupMemberAdded", onGroupMemberAdded);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      socket.off("notificationTriggered", onNotification);
      socket.off("reminderCreated", onReminderCreated);
      socket.off("reminderUpdated", onReminderUpdated);
      socket.off("reminderCompleted", onReminderCompleted);
      socket.off("groupMemberAdded", onGroupMemberAdded);
    };
  }, [user, prependNotification, updateReminder, addReminder, setGroups]);
};

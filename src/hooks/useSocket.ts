/**
 * src/hooks/useSocket.ts
 *
 * Registers ALL real-time event listeners for the authenticated user.
 * Called ONCE inside AppLayout — mounts with the app, unmounts on logout.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  EVENTS RECEIVED FROM BACKEND                                        │
 * ├──────────────────────────────┬───────────────────────────────────────┤
 * │  notificationTriggered       │ Task overdue / group invite / etc     │
 * │  taskCreated                 │ Group member created a task           │
 * │  taskUpdated                 │ Task was edited                       │
 * │  taskCompleted               │ A member completed a task             │
 * │  taskOverdue                 │ Scheduler marked task overdue         │
 * │  groupMemberAdded            │ Current user was added to a group      │
 * └──────────────────────────────┴───────────────────────────────────────┘
 *
 * Architecture: AppLayout → useSocket → getSocket() → stores (no service calls in UI)
 */
import { useEffect, useRef } from "react";
import { getSocket } from "../config/socket";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { useTaskStore } from "../store/taskStore";
import { useGroupStore } from "../store/groupStore";
import * as notificationService from "../services/notification";
import * as groupService from "../services/group";
import toast from "react-hot-toast";
import type { Task, Notification } from "../types/types";

// ── Payload shapes ────────────────────────────────────────────────────────────

interface NotifPayload {
  notification?: Notification;
  message?: string;
  title?: string;
  type?: string;
}
interface TaskPayload {
  task: Task;
}
interface TaskDonePayload {
  taskId: string;
  task?: Task;
}
interface TaskOverduePayload {
  taskId: string;
  task?: Task;
}
interface GroupAddedPayload {
  groupId: string;
}

// ── Toast per notification type ───────────────────────────────────────────────

function showNotifToast(n: Notification): void {
  const icons: Record<string, string> = {
    TASK_DUE: "⏰",
    GROUP_INVITE: "👥",
    TASK_ASSIGNED: "📋",
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

    // ── taskCreated ────────────────────────────────────────────────────────
    // Only add to local store if the task is assigned to me.
    // This prevents group tasks for other members polluting my list.
    const onTaskCreated = ({ task }: TaskPayload): void => {
      const me = userRef.current;
      if (!me) return;
      const myId = me.id ?? me._id ?? "";
      const assigned = task.assignedUsers.some(
        (u) => (typeof u === "string" ? u : u._id) === myId,
      );
      if (assigned) {
        useTaskStore.getState().addTask(task);
        toast(`📋 New task: "${task.title}"`, { duration: 4000 });
      }
    };

    // ── taskUpdated ────────────────────────────────────────────────────────
    // Patch the task in-place. If it doesn't exist in the store yet,
    // addTask adds it so the view stays consistent.
    const onTaskUpdated = ({ task }: TaskPayload): void => {
      const exists = useTaskStore
        .getState()
        .tasks.some((t) => t._id === task._id);
      if (exists) {
        useTaskStore.getState().updateTask(task);
      } else {
        useTaskStore.getState().addTask(task);
      }
    };

    // ── taskCompleted ──────────────────────────────────────────────────────
    // Backend sends the full task object OR just the ID.
    // Optimistically patch status in the store without a network round-trip.
    const onTaskCompleted = ({
      taskId,
      task,
    }: TaskDonePayload): void => {
      if (task) {
        useTaskStore.getState().updateTask(task);
        return;
      }
      const existing = useTaskStore
        .getState()
        .tasks.find((t) => t._id === taskId);
      if (existing) {
        useTaskStore.getState().updateTask({
          ...existing,
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
        });
      }
    };

    // ── taskOverdue ────────────────────────────────────────────────────────
    // Scheduler fires this when a task passes its due date.
    // Patch status to OVERDUE so the card immediately turns red.
    const onTaskOverdue = ({
      taskId,
      task,
    }: TaskOverduePayload): void => {
      if (task) {
        useTaskStore.getState().updateTask(task);
        return;
      }
      const existing = useTaskStore
        .getState()
        .tasks.find((t) => t._id === taskId);
      if (existing) {
        useTaskStore
          .getState()
          .updateTask({ ...existing, status: "OVERDUE" });
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
    socket.on("taskCreated", onTaskCreated);
    socket.on("taskUpdated", onTaskUpdated);
    socket.on("taskCompleted", onTaskCompleted);
    socket.on("taskOverdue", onTaskOverdue);
    socket.on("groupMemberAdded", onGroupMemberAdded);

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      socket.off("notificationTriggered", onNotification);
      socket.off("taskCreated", onTaskCreated);
      socket.off("taskUpdated", onTaskUpdated);
      socket.off("taskCompleted", onTaskCompleted);
      socket.off("taskOverdue", onTaskOverdue);
      socket.off("groupMemberAdded", onGroupMemberAdded);
    };
  }, [user]); // re-register when user changes (login/logout)
};

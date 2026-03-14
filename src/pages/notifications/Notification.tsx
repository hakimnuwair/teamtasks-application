/**
 * pages/notifications/Notifications.tsx
 *
 * GROUP_INVITE notifications show Accept / Decline buttons.
 * The invitationId lives in notification.metadata.invitationId
 * (set by the backend when creating the notification in invitationService.js).
 *
 * All invitation API calls go through services/invitation.ts.
 */

import { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  Clock,
  UserPlus,
  CheckSquare,
  Info,
  Check,
  X,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { Button, EmptyState, Card } from "../../components/ui";
import { useNotifications } from "../../hooks/useNotifications";
import * as invitationService from "../../services/invitation";
import toast from "react-hot-toast";
import type { Notification, NotificationType } from "../../types/types";

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CFG: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  REMINDER_DUE: {
    icon: Clock,
    color: "text-[#B45309] dark:text-[#FCD34D]",
    bg: "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.14)]",
  },
  GROUP_INVITE: {
    icon: UserPlus,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)]",
  },
  REMINDER_ASSIGNED: {
    icon: CheckSquare,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)]",
  },
  SYSTEM: {
    icon: Info,
    color: "text-[#64748B] dark:text-[#64748B]",
    bg: "bg-[#F8FAFC] dark:bg-[rgba(148,163,184,0.08)]",
  },
};

// ── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Inline spinner ────────────────────────────────────────────────────────────

function Spin() {
  return (
    <svg
      className="w-3.5 h-3.5 animate-spin shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ── Invite action buttons ─────────────────────────────────────────────────────

function InviteActions({
  invitationId,
  onDone,
}: {
  invitationId: string;
  onDone: (accepted: boolean) => void;
}) {
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  const handle = async (accept: boolean) => {
    setBusy(accept ? "accept" : "decline");
    try {
      await invitationService.respondToInvitation(invitationId, accept);
      toast.success(accept ? "You joined the group!" : "Invitation declined");
      onDone(accept);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not respond to invitation";
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-2 pt-0.5">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handle(true);
        }}
        disabled={busy !== null}
        className={cn(
          "flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-medium",
          "bg-gradient-to-r from-teal-500 to-teal-600 text-white",
          "shadow-sm shadow-[rgba(20,184,166,0.28)]",
          "hover:from-teal-400 hover:to-teal-500",
          "active:scale-[0.97] transition-all duration-[250ms]",
          busy !== null && "opacity-60 pointer-events-none",
        )}
      >
        {busy === "accept" ? <Spin /> : <Check className="w-3 h-3" />}
        Accept
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handle(false);
        }}
        disabled={busy !== null}
        className={cn(
          "flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-medium",
          "border border-[#FECDD3] dark:border-[rgba(244,63,94,0.30)]",
          "text-[#BE123C] dark:text-[#FDA4AF] bg-white dark:bg-[#161B22]",
          "hover:bg-[#FFF1F2] dark:hover:bg-[rgba(244,63,94,0.08)]",
          "active:scale-[0.97] transition-all duration-[250ms]",
          busy !== null && "opacity-60 pointer-events-none",
        )}
      >
        {busy === "decline" ? <Spin /> : <X className="w-3 h-3" />}
        Decline
      </button>
    </div>
  );
}

// ── Notification row ──────────────────────────────────────────────────────────

function NotificationRow({
  n,
  onMarkRead,
}: {
  n: Notification;
  onMarkRead: (id: string) => void;
}) {
  const cfg = TYPE_CFG[n.type] ?? TYPE_CFG.SYSTEM;
  const Icon = cfg.icon;
  const isInvite = n.type === "GROUP_INVITE";

  // Backend stores invitationId in notification.metadata.invitationId
  const invitationId = isInvite
    ? ((n.metadata?.invitationId as string | undefined) ?? "")
    : "";

  const handleClick = () => {
    if (!isInvite && !n.isRead) onMarkRead(n._id);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border transition-all duration-[250ms]",
        n.isRead
          ? "bg-white dark:bg-[#161B22] border-[#E2E6ED] dark:border-[#21262D]"
          : [
              "bg-[#FAFBFF] dark:bg-[rgba(99,102,241,0.06)]",
              "border-[#C7D2FE] dark:border-[rgba(99,102,241,0.22)]",
              !isInvite &&
                "cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500",
            ],
      )}
    >
      {/* Type icon */}
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
          cfg.bg,
          cfg.color,
        )}
      >
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Message */}
        <p
          className={cn(
            "text-sm leading-snug",
            n.isRead
              ? "text-[#475569] dark:text-[#8B949E]"
              : "text-[#0F172A] dark:text-[#F0F6FC] font-medium",
          )}
        >
          {n.message}
        </p>

        {/* Linked context */}
        {(n.reminderId || n.groupId) && (
          <p className="text-xs text-[#94A3B8]">
            {n.reminderId && (
              <span className="text-indigo-500 dark:text-indigo-400">
                "{n.reminderId.title}"
              </span>
            )}
            {n.groupId && (
              <span>
                {" "}
                in{" "}
                <span className="text-teal-500 dark:text-teal-400 font-medium">
                  {n.groupId.name}
                </span>
              </span>
            )}
          </p>
        )}

        {/* Accept / Decline — only for unread GROUP_INVITE with a valid invitationId */}
        {isInvite && !n.isRead && invitationId && (
          <InviteActions
            invitationId={invitationId}
            onDone={() => onMarkRead(n._id)}
          />
        )}

        <p className="text-xs text-[#94A3B8]">{relativeTime(n.createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!n.isRead && (
        <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-1.5 shadow-[0_0_6px_rgba(79,70,229,0.50)]" />
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function NotifSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#161B22]">
      <div className="w-9 h-9 rounded-xl shrink-0 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3.5 rounded-md w-4/5 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
        <div className="h-2.5 rounded-md w-1/4 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const NotificationsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    setIsLoading(true);
    fetchNotifications().finally(() => setIsLoading(false));
  }, [fetchNotifications]);

  const displayed =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] md:text-[28px] font-semibold tracking-wide leading-snug text-[#0F172A] dark:text-[#F0F6FC]">
            Notifications
          </h2>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
            onClick={markAllAsRead}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center p-1 gap-0.5 rounded-xl w-fit bg-white dark:bg-[#161B22] border border-[#E2E6ED] dark:border-[#21262D] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-[250ms]",
              filter === f
                ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-sm shadow-indigo-500/20"
                : "text-[#475569] dark:text-[#8B949E] hover:text-[#0F172A] dark:hover:text-[#F0F6FC] hover:bg-black/5 dark:hover:bg-white/5",
            )}
          >
            {f === "all" ? "All" : "Unread"}
            {f === "unread" && unreadCount > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                  filter === "unread"
                    ? "bg-white/20"
                    : "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
                )}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <NotifSkeleton key={i} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Bell className="w-8 h-8" />}
            title={
              filter === "unread" ? "No unread notifications" : "All caught up!"
            }
            description={
              filter === "unread"
                ? "You've read everything."
                : "Notifications will appear here when something happens."
            }
          />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {displayed.map((n) => (
            <NotificationRow key={n._id} n={n} onMarkRead={markAsRead} />
          ))}
        </div>
      )}
    </div>
  );
};

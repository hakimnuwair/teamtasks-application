/**
 * pages/notifications/Notifications.tsx
 *
 * Architecture:
 *   NotificationsPage → useNotifications (hook) → notificationStore → notificationService
 *   NotificationsPage → useInvitations   (hook) → invitationService
 *   NotificationsPage → useGroups        (hook) → groupStore → groupService
 *
 * Filters: All | Unread | by Group (dropdown of user's groups)
 * Sections: Pending Invitations (top) + Notification list (filtered)
 */
import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Clock,
  UserPlus,
  CheckSquare,
  Info,
  Check,
  X,
  Mail,
  Users,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { Button, EmptyState, Card, Avatar } from "../../components/ui";
import { useNotifications } from "../../hooks/useNotifications";
import { useInvitations } from "../../hooks/useInvitation";
import { useGroups } from "../../hooks/useGroups";
import type {
  Notification,
  NotificationType,
  GroupInvitation,
} from "../../types/types";

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CFG: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  TASK_DUE: {
    icon: Clock,
    color: "text-[#B45309] dark:text-[#FCD34D]",
    bg: "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.14)]",
  },
  GROUP_INVITE: {
    icon: UserPlus,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)]",
  },
  TASK_ASSIGNED: {
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

function relativeTime(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

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

// ── Inline accept / decline (inside notification row) ────────────────────────
// onDone now receives the invitationId so the page can remove it from both
// the invitations list and mark the notification read in one go.

function InviteActions({
  invitationId,
  onDone,
}: {
  invitationId: string;
  onDone: (invitationId: string, accepted: boolean) => void;
}) {
  const { respond } = useInvitations();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  const handle = async (accept: boolean) => {
    setBusy(accept ? "accept" : "decline");
    try {
      await respond(invitationId, accept);
      // Signal the page with the id so it can remove the card + mark notif read
      onDone(invitationId, accept);
    } catch {
      /* toast shown by hook */
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
          "flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-medium bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-sm shadow-[rgba(20,184,166,0.28)] hover:from-teal-400 hover:to-teal-500 active:scale-[0.97] transition-all duration-[250ms]",
          busy !== null && "opacity-60 pointer-events-none",
        )}
      >
        {busy === "accept" ? <Spin /> : <Check className="w-3 h-3" />} Accept
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handle(false);
        }}
        disabled={busy !== null}
        className={cn(
          "flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-medium border border-[#FECDD3] dark:border-[rgba(244,63,94,0.30)] text-[#BE123C] dark:text-[#FDA4AF] bg-white dark:bg-[#161B22] hover:bg-[#FFF1F2] dark:hover:bg-[rgba(244,63,94,0.08)] active:scale-[0.97] transition-all duration-[250ms]",
          busy !== null && "opacity-60 pointer-events-none",
        )}
      >
        {busy === "decline" ? <Spin /> : <X className="w-3 h-3" />} Decline
      </button>
    </div>
  );
}

// ── Pending invitation card ───────────────────────────────────────────────────

function InvitationCard({
  inv,
  onRespond,
}: {
  inv: GroupInvitation;
  // Unified callback: page removes the card and handles any side-effects
  onRespond: (id: string, accepted: boolean) => void;
}) {
  const { respond } = useInvitations();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  const handle = async (accept: boolean) => {
    setBusy(accept ? "accept" : "decline");
    try {
      await respond(inv._id, accept, inv.groupId.name);
      // Always call onRespond so the page removes this card immediately
      onRespond(inv._id, accept);
    } catch {
      /* toast shown by hook */
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border",
        "bg-white dark:bg-[#161B22] border-[#C7D2FE] dark:border-[rgba(99,102,241,0.25)]",
        "shadow-[0_2px_8px_rgba(79,70,229,0.08)] dark:shadow-[0_2px_8px_rgba(99,102,241,0.12)]",
      )}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 bg-gradient-to-br from-indigo-600 to-teal-500 shadow-[0_4px_10px_rgba(79,70,229,0.25)]">
        {inv.groupId.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F0F6FC]">
            {inv.groupId.name}
          </p>
          {inv.groupId.description && (
            <p className="text-xs text-[#94A3B8] line-clamp-1">
              {inv.groupId.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <Avatar name={inv.invitedBy.name} size="xs" />
          <span>
            Invited by{" "}
            <span className="font-medium text-[#475569] dark:text-[#8B949E]">
              {inv.invitedBy.name}
            </span>
          </span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)] text-[#4338CA] dark:text-[#A5B4FC]">
            {inv.role}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handle(true)}
            disabled={busy !== null}
            className={cn(
              "flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-sm shadow-indigo-500/25 hover:brightness-110 active:scale-[0.97] transition-all duration-[250ms]",
              busy !== null && "opacity-60 pointer-events-none",
            )}
          >
            {busy === "accept" ? <Spin /> : <Check className="w-3.5 h-3.5" />}{" "}
            Accept
          </button>
          <button
            onClick={() => handle(false)}
            disabled={busy !== null}
            className={cn(
              "flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-semibold border border-[#E2E6ED] dark:border-[#21262D] text-[#475569] dark:text-[#8B949E] bg-white dark:bg-[#161B22] hover:border-[#C8CDD8] dark:hover:border-[#30363D] active:scale-[0.97] transition-all duration-[250ms]",
              busy !== null && "opacity-60 pointer-events-none",
            )}
          >
            {busy === "decline" ? <Spin /> : <X className="w-3.5 h-3.5" />}{" "}
            Decline
          </button>
        </div>
      </div>
      <p className="text-[10px] text-[#94A3B8] shrink-0 pt-0.5">
        {relativeTime(inv.createdAt)}
      </p>
    </div>
  );
}

// ── Notification row ──────────────────────────────────────────────────────────

function NotificationRow({
  n,
  onMarkRead,
  onInviteRespond,
}: {
  n: Notification;
  onMarkRead: (id: string) => void;
  // Passed down so InviteActions can bubble the invitationId back up to the page
  onInviteRespond: (invitationId: string, accepted: boolean) => void;
}) {
  const cfg = TYPE_CFG[n.type] ?? TYPE_CFG.SYSTEM;
  const Icon = cfg.icon;
  const isInvite = n.type === "GROUP_INVITE";
  const invitationId = isInvite
    ? ((n.metadata?.invitationId as string | undefined) ?? "")
    : "";

  return (
    <div
      onClick={() => {
        if (!isInvite && !n.isRead) onMarkRead(n._id);
      }}
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
        {(n.taskId || n.groupId) && (
          <p className="text-xs text-[#94A3B8]">
            {n.taskId && (
              <span className="text-indigo-500 dark:text-indigo-400">
                "{n.taskId.title}"
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
        {isInvite && !n.isRead && invitationId && (
          <InviteActions invitationId={invitationId} onDone={onInviteRespond} />
        )}
        <p className="text-xs text-[#94A3B8]">{relativeTime(n.createdAt)}</p>
      </div>
      {!n.isRead && (
        <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-1.5 shadow-[0_0_6px_rgba(79,70,229,0.50)]" />
      )}
    </div>
  );
}

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
  const [groupFilter, setGroupFilter] = useState<string>("ALL");

  // Local set of invitation IDs that have been responded to.
  // This is the single source of truth for hiding cards/actions immediately,
  // regardless of whether useInvitations' store has re-rendered yet.
  const [respondedInvitationIds, setRespondedInvitationIds] = useState<
    Set<string>
  >(new Set());

  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const {
    invitations,
    isLoading: invLoading,
    fetchMyInvitations,
  } = useInvitations();
  const { groups } = useGroups();

  useEffect(() => {
    setIsLoading(true);
    fetchNotifications().finally(() => setIsLoading(false));
    fetchMyInvitations();
  }, [fetchNotifications, fetchMyInvitations]);

  /**
   * Called by BOTH InvitationCard and InviteActions (via NotificationRow).
   * Adds the id to the responded set → card disappears immediately.
   * Also marks any related GROUP_INVITE notification as read.
   */
  const handleInvitationRespond = useCallback(
    (invitationId: string, _accepted: boolean) => {
      // Remove the invitation card immediately
      setRespondedInvitationIds((prev) => new Set(prev).add(invitationId));

      // Mark the corresponding GROUP_INVITE notification as read so the
      // inline Accept/Decline buttons disappear from the notification list too.
      const relatedNotification = notifications.find(
        (n) =>
          n.type === "GROUP_INVITE" &&
          (n.metadata?.invitationId as string | undefined) === invitationId &&
          !n.isRead,
      );
      if (relatedNotification) {
        markAsRead(relatedNotification._id);
      }
    },
    [notifications, markAsRead],
  );

  // Filter out invitations that have already been responded to in this session
  const visibleInvitations = invitations.filter(
    (inv) => !respondedInvitationIds.has(inv._id),
  );

  // Apply read + group filters to notifications
  const displayed = notifications
    .filter((n) => (filter === "unread" ? !n.isRead : true))
    .filter((n) => {
      if (groupFilter === "ALL") return true;
      if (groupFilter === "personal") return !n.groupId;
      return n.groupId?._id === groupFilter || n.groupId?.name === groupFilter;
    });

  const hasFilters = filter !== "all" || groupFilter !== "ALL";

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

      {/* Pending Invitations */}
      {!invLoading && visibleInvitations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide">
              Pending Invitations
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-[0_0_8px_rgba(79,70,229,0.40)]">
              {visibleInvitations.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {visibleInvitations.map((inv) => (
              <InvitationCard
                key={inv._id}
                inv={inv}
                onRespond={handleInvitationRespond}
              />
            ))}
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-[#C8CDD8] dark:via-[#30363D] to-transparent" />
        </div>
      )}
      {invLoading && (
        <div className="space-y-2.5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]"
            />
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Read filter tabs */}
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

        {/* Group filter */}
        {groups.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className={cn(
                "h-9 px-3 text-xs rounded-lg appearance-none cursor-pointer",
                "bg-white dark:bg-[#161B22] border border-[#E2E6ED] dark:border-[#21262D]",
                "text-[#475569] dark:text-[#8B949E]",
                "focus:outline-none focus:border-indigo-600 dark:focus:border-[#818CF8] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]",
                "hover:border-[#C8CDD8] dark:hover:border-[#30363D] transition-all duration-[250ms]",
                groupFilter !== "ALL" &&
                  "border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400",
              )}
            >
              <option value="ALL">All Groups</option>
              <option value="personal">Personal only</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={() => {
              setFilter("all");
              setGroupFilter("ALL");
            }}
            className={cn(
              "flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-[#E2E6ED] dark:border-[#21262D] text-[#475569] dark:text-[#8B949E] bg-white dark:bg-[#161B22] hover:border-[#F43F5E] hover:text-[#F43F5E] dark:hover:border-[rgba(244,63,94,0.50)] dark:hover:text-[#FDA4AF] transition-all duration-[250ms]",
            )}
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Notifications list */}
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
                : hasFilters
                  ? "Try clearing filters to see more notifications."
                  : "Notifications will appear here when something happens."
            }
            action={
              hasFilters ? (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<X className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setFilter("all");
                    setGroupFilter("ALL");
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {displayed.map((n) => (
            <NotificationRow
              key={n._id}
              n={n}
              onMarkRead={markAsRead}
              onInviteRespond={handleInvitationRespond}
            />
          ))}
        </div>
      )}
    </div>
  );
};

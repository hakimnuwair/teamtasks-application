/**
 * pages/groups/GroupDetail.tsx
 *
 * Architecture: GroupDetailPage → useGroupDetail (hook) → services → backend
 *
 * Sub-components (ReminderRow, MembersTab, InviteModal, etc.) are pure UI.
 * The page component never imports or calls any service directly.
 * All data operations flow through useGroupDetail hook.
 *
 * Reminder completion:
 *   - Interactive toggle per current user (circle → checkmark)
 *   - Per-member completion pills show who is done / pending
 *
 * Group pre-fill:
 *   - CreateReminderModal receives defaultGroupId={group._id}
 *   - onCreated callback calls reloadReminders() for immediate update
 */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  ShieldCheck,
  User,
  UserPlus,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Users,
  CheckSquare,
  Mail,
  X,
  RotateCcw,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "../../utils/cn";
import {
  Button,
  Badge,
  Avatar,
  EmptyState,
  Card,
  Spinner,
} from "../../components/ui";
import {
  AsyncUserSelect,
  type SelectedUser,
} from "../../components/ui/AsyncUserSelect";
import { CreateReminderModal } from "../../components/modal/CreateReminderModal";
import { useGroupDetail } from "../../hooks/useGroupDetail";
import { useAuthStore } from "../../store/authStore";
import { formatDueDate, isOverdue } from "../../utils/formatDate";
import toast from "react-hot-toast";
import type {
  Group,
  GroupRole,
  GroupMember,
  Reminder,
  GroupInvitation,
  InvitationStatus,
} from "../../types/types";

// ─── Locally-tracked sent invitations ────────────────────────────────────────
// The backend has no "list invitations I sent" endpoint, so we track
// these locally after each invite batch in state.
interface SentInvite {
  id: string;
  email: string;
  name: string;
  role: GroupRole;
  status: "PENDING" | "DECLINED" | "CANCELLED";
  sentAt: string;
}

// ─── Inline spinner ───────────────────────────────────────────────────────────

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

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_CFG: Record<
  GroupRole,
  { icon: React.ElementType; label: string; cls: string }
> = {
  ADMIN: {
    icon: ShieldCheck,
    label: "Admin",
    cls: "text-[#4338CA] dark:text-[#A5B4FC] bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)]",
  },
  MEMBER: {
    icon: User,
    label: "Member",
    cls: "text-[#64748B] dark:text-[#64748B] bg-[#F8FAFC] dark:bg-[rgba(148,163,184,0.08)]",
  },
};

function RoleBadge({ role }: { role: GroupRole }) {
  const { icon: Icon, label, cls } = ROLE_CFG[role] ?? ROLE_CFG.MEMBER;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
        cls,
      )}
    >
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

// ─── Invitation status badge ──────────────────────────────────────────────────

const STATUS_CFG: Record<
  InvitationStatus,
  { label: string; dot: string; cls: string }
> = {
  PENDING: {
    label: "Pending",
    dot: "bg-[#F59E0B]",
    cls: "text-[#B45309] dark:text-[#FCD34D] bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.12)] border border-[#FDE68A] dark:border-[rgba(245,158,11,0.25)]",
  },
  ACCEPTED: {
    label: "Accepted",
    dot: "bg-[#22C55E]",
    cls: "text-[#16A34A] dark:text-[#86EFAC] bg-[#F0FDF4] dark:bg-[rgba(34,197,94,0.12)] border border-[#BBF7D0] dark:border-[rgba(34,197,94,0.25)]",
  },
  DECLINED: {
    label: "Declined",
    dot: "bg-[#F43F5E]",
    cls: "text-[#BE123C] dark:text-[#FDA4AF] bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.08)] border border-[#FECDD3] dark:border-[rgba(244,63,94,0.22)]",
  },
  CANCELLED: {
    label: "Cancelled",
    dot: "bg-[#94A3B8]",
    cls: "text-[#64748B] dark:text-[#64748B] bg-[#F8FAFC] dark:bg-[rgba(148,163,184,0.08)] border border-[#E2E6ED] dark:border-[#21262D]",
  },
};

function InviteStatusBadge({ status }: { status: InvitationStatus }) {
  const { label, cls, dot } = STATUS_CFG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium",
        cls,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
      {label}
    </span>
  );
}

// ─── Reminder row ─────────────────────────────────────────────────────────────
// Clickable complete toggle for the current user.
// Completion pills below show every assigned user's status.

function ReminderRow({
  reminder,
  onComplete,
  isCompleting,
}: {
  reminder: Reminder;
  onComplete: (id: string) => void;
  isCompleting: boolean;
}) {
  const { user } = useAuthStore();
  const myId = user?.id ?? user?._id ?? "";
  const overdue = isOverdue(reminder.dueDateTime, reminder.status);
  const sv: Record<string, "pending" | "completed" | "overdue"> = {
    PENDING: "pending",
    COMPLETED: "completed",
    OVERDUE: "overdue",
  };

  // Has the current user already completed this?
  const iDone =
    reminder.userCompletions?.some((uc) => {
      const uid =
        typeof uc.userId === "string"
          ? uc.userId
          : (uc.userId as { _id: string })._id;
      return uid === myId;
    }) ?? false;

  // Set of user IDs who have completed
  const completedIds = new Set(
    (reminder.userCompletions ?? []).map((uc) =>
      typeof uc.userId === "string"
        ? uc.userId
        : (uc.userId as { _id: string })._id,
    ),
  );

  const isAssignedToMe =
    reminder.assignedUsers.length === 0 ||
    reminder.assignedUsers.some((u) => u._id === myId);

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-[250ms]",
        overdue
          ? "bg-[#FFF8F8] dark:bg-[rgba(244,63,94,0.05)] border-[#FECDD3] dark:border-[rgba(244,63,94,0.25)]"
          : "bg-white dark:bg-[#161B22] border-[#E2E6ED] dark:border-[#21262D]",
      )}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 p-4">
        {/* Complete toggle */}
        <button
          onClick={() => isAssignedToMe && !iDone && onComplete(reminder._id)}
          disabled={!isAssignedToMe || iDone || isCompleting}
          title={
            !isAssignedToMe
              ? "Assigned to other members"
              : iDone
                ? "You completed this"
                : "Mark as complete"
          }
          className={cn(
            "mt-0.5 shrink-0 transition-all duration-[250ms] disabled:opacity-40",
            iDone
              ? "text-emerald-500 cursor-default"
              : !isAssignedToMe
                ? "text-[#C8CDD8] dark:text-[#30363D] cursor-not-allowed"
                : overdue
                  ? "text-[#F43F5E] hover:text-[#E11D48] hover:scale-110"
                  : "text-[#C8CDD8] dark:text-[#30363D] hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-110",
          )}
        >
          {isCompleting ? (
            <Spinner size="sm" />
          ) : iDone ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : !isAssignedToMe ? (
            <Circle className="w-4 h-4 opacity-30" />
          ) : overdue ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <p
              className={cn(
                "text-sm font-medium tracking-wide",
                reminder.status === "COMPLETED"
                  ? "line-through text-[#94A3B8]"
                  : "text-[#0F172A] dark:text-[#F0F6FC]",
              )}
            >
              {reminder.title}
            </p>
            <Badge variant={sv[reminder.status]}>
              {reminder.status.charAt(0) +
                reminder.status.slice(1).toLowerCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span
              className={cn(
                "text-xs",
                overdue
                  ? "text-[#BE123C] dark:text-[#FDA4AF]"
                  : "text-[#94A3B8]",
              )}
            >
              {formatDueDate(reminder.dueDateTime)}
            </span>
            <Badge
              variant={
                reminder.priority.toLowerCase() as "high" | "medium" | "low"
              }
              dot={false}
            >
              {reminder.priority}
            </Badge>
          </div>
        </div>
      </div>

      {/* Per-member completion pills */}
      {reminder.assignedUsers.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {reminder.assignedUsers.map((u) => {
            const done = completedIds.has(u._id);
            return (
              <span
                key={u._id}
                title={done ? `${u.name} completed` : `${u.name} pending`}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                  done
                    ? "bg-[#F0FDF4] dark:bg-[rgba(34,197,94,0.12)] text-[#16A34A] dark:text-[#86EFAC]"
                    : "bg-[#EEF0F4] dark:bg-[#21262D] text-[#64748B] dark:text-[#8B949E]",
                )}
              >
                {done ? (
                  <CheckCircle2 className="w-2.5 h-2.5" />
                ) : (
                  <Circle className="w-2.5 h-2.5 opacity-50" />
                )}
                {u.name.split(" ")[0]}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Confirm remove dialog ────────────────────────────────────────────────────

function ConfirmRemoveDialog({
  name,
  onConfirm,
  onCancel,
  isLoading,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/65 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-2xl p-6 space-y-4 bg-white dark:bg-[#161B22] border border-[#E2E6ED] dark:border-[#21262D] shadow-[0_24px_48px_rgba(15,23,42,0.16)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.60)]">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)]">
          <Trash2 className="w-5 h-5 text-[#F43F5E]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide">
            Remove Member
          </h3>
          <p className="text-sm text-[#64748B] dark:text-[#8B949E] mt-1 leading-relaxed">
            Remove{" "}
            <span className="font-medium text-[#0F172A] dark:text-[#F0F6FC]">
              {name}
            </span>{" "}
            from this group? They'll lose access to all group reminders.
          </p>
        </div>
        <div className="flex gap-2.5 pt-1">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 h-10 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2",
              "bg-[#F43F5E] hover:bg-[#E11D48] text-white",
              "shadow-sm shadow-[rgba(244,63,94,0.30)] hover:shadow-[rgba(244,63,94,0.45)]",
              "active:scale-[0.98] transition-all duration-[250ms]",
              isLoading && "opacity-60 cursor-not-allowed pointer-events-none",
            )}
          >
            {isLoading ? <Spin /> : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Invite modal — multi-select ──────────────────────────────────────────────

interface InviteModalProps {
  groupId: string;
  existingEmails: string[];
  sendInvitation: (
    groupId: string,
    payload: { email: string; role?: GroupRole },
  ) => Promise<import("../../types/types").GroupInvitation>;
  onDone: (sent: SentInvite[]) => void;
  onClose: () => void;
}

function InviteModal({
  groupId,
  existingEmails,
  sendInvitation,
  onDone,
  onClose,
}: InviteModalProps) {
  const [selected, setSelected] = useState<SelectedUser[]>([]);
  const [role, setRole] = useState<GroupRole>("MEMBER");
  const [busy, setBusy] = useState(false);

  const handleSend = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one person to invite.");
      return;
    }
    setBusy(true);

    const sentInvites: SentInvite[] = [];
    const results = await Promise.allSettled(
      selected.map((u) =>
        sendInvitation(groupId, { email: u.email, role }).then((inv) => ({
          inv,
          user: u,
        })),
      ),
    );

    let succeeded = 0,
      failed = 0;
    for (const r of results) {
      if (r.status === "fulfilled") {
        succeeded++;
        sentInvites.push({
          id: r.value.inv._id,
          email: r.value.user.email,
          name: r.value.user.name,
          role,
          status: "PENDING",
          sentAt: new Date().toISOString(),
        });
      } else {
        failed++;
      }
    }

    if (succeeded > 0)
      toast.success(`${succeeded} invitation${succeeded > 1 ? "s" : ""} sent!`);
    if (failed > 0)
      toast.error(
        `${failed} invitation${failed > 1 ? "s" : ""} couldn't be sent.`,
      );
    setBusy(false);
    onDone(sentInvites);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-5",
          "bg-white dark:bg-[#161B22] border border-[#E2E6ED] dark:border-[#21262D]",
          "shadow-[0_-8px_40px_rgba(15,23,42,0.14)] dark:shadow-[0_-8px_40px_rgba(0,0,0,0.55)]",
          "sm:shadow-[0_24px_48px_rgba(15,23,42,0.16)] dark:sm:shadow-[0_24px_48px_rgba(0,0,0,0.60)]",
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide">
              Invite Members
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Search and select multiple people to invite at once.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F0F6FC] hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-[250ms]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Multi-select */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#475569] dark:text-[#8B949E]">
            Search members
          </label>
          <AsyncUserSelect
            selected={selected}
            onChange={setSelected}
            excludeEmails={existingEmails}
            placeholder="Search by name or email…"
            autoFocus
          />
          {selected.length > 0 && (
            <p className="text-[11px] text-[#94A3B8]">
              {selected.length} {selected.length === 1 ? "person" : "people"}{" "}
              selected · press Backspace to remove last
            </p>
          )}
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#475569] dark:text-[#8B949E]">
            Role
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["MEMBER", "ADMIN"] as GroupRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "py-2.5 rounded-lg border text-xs font-medium transition-all duration-[250ms]",
                  role === r
                    ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white border-transparent shadow-sm"
                    : "border-[#E2E6ED] dark:border-[#21262D] text-[#475569] dark:text-[#8B949E] bg-white dark:bg-[#161B22] hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
                )}
              >
                {r === "ADMIN" ? "Admin" : "Member"}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#94A3B8] leading-relaxed">
            {role === "ADMIN"
              ? "Admins can manage members and settings."
              : "Members can view and create reminders in the group."}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSend}
            isLoading={busy}
            leftIcon={<Mail className="w-3.5 h-3.5" />}
            disabled={selected.length === 0}
          >
            {selected.length > 1
              ? `Send ${selected.length} Invites`
              : "Send Invite"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Member row ───────────────────────────────────────────────────────────────

function MemberRow({
  member,
  onRemove,
  isRemoving,
}: {
  member: GroupMember;
  onRemove: (id: string, name: string) => void;
  isRemoving: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-[#161B22] border-[#E2E6ED] dark:border-[#21262D] hover:border-[#C8CDD8] dark:hover:border-[#30363D] transition-all duration-[250ms]">
      <Avatar name={member.userId.name} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0F172A] dark:text-[#F0F6FC] truncate">
          {member.userId.name}
        </p>
        <p className="text-xs text-[#94A3B8] truncate">{member.userId.email}</p>
      </div>
      <RoleBadge role={member.role} />
      <button
        onClick={() => onRemove(member.userId._id, member.userId.name)}
        disabled={isRemoving}
        title={`Remove ${member.userId.name}`}
        className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
          "text-[#C8CDD8] dark:text-[#30363D] hover:text-[#F43F5E] hover:bg-[#FFF1F2] dark:hover:bg-[rgba(244,63,94,0.10)]",
          "transition-all duration-[250ms]",
          isRemoving && "opacity-50 pointer-events-none",
        )}
      >
        {isRemoving ? <Spin /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ─── My pending invite banner ─────────────────────────────────────────────────

function MyInviteBanner({
  invitation,
  onRespond,
}: {
  invitation: GroupInvitation;
  /** Called with the invitation + accepted flag — handler lives in the page */
  onRespond: (inv: GroupInvitation, accepted: boolean) => void;
}) {
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  const handle = async (accept: boolean) => {
    setBusy(accept ? "accept" : "decline");
    try {
      onRespond(invitation, accept);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border bg-[#FAFBFF] dark:bg-[rgba(99,102,241,0.06)] border-[#C7D2FE] dark:border-[rgba(99,102,241,0.25)] shadow-[0_2px_12px_rgba(79,70,229,0.08)]">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)] text-indigo-600 dark:text-indigo-400">
        <Mail className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F0F6FC]">
          You have a pending invitation
        </p>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Invited by{" "}
          <span className="text-[#475569] dark:text-[#8B949E] font-medium">
            {invitation.invitedBy.name}
          </span>
          {invitation.expiresAt && (
            <>
              {" "}
              · Expires{" "}
              {new Date(invitation.expiresAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </>
          )}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => handle(true)}
            disabled={busy !== null}
            className={cn(
              "flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-medium bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-sm shadow-[rgba(20,184,166,0.28)] hover:from-teal-400 hover:to-teal-500 active:scale-[0.97] transition-all duration-[250ms]",
              busy !== null && "opacity-60 pointer-events-none",
            )}
          >
            {busy === "accept" ? <Spin /> : <Check className="w-3 h-3" />}{" "}
            Accept
          </button>
          <button
            onClick={() => handle(false)}
            disabled={busy !== null}
            className={cn(
              "flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-medium border border-[#FECDD3] dark:border-[rgba(244,63,94,0.30)] text-[#BE123C] dark:text-[#FDA4AF] bg-white dark:bg-[#161B22] hover:bg-[#FFF1F2] dark:hover:bg-[rgba(244,63,94,0.08)] active:scale-[0.97] transition-all duration-[250ms]",
              busy !== null && "opacity-60 pointer-events-none",
            )}
          >
            {busy === "decline" ? <Spin /> : <X className="w-3 h-3" />} Decline
          </button>
        </div>
      </div>
      <InviteStatusBadge status="PENDING" />
    </div>
  );
}

// ─── Sent invitation row ──────────────────────────────────────────────────────

function SentInviteRow({
  invite,
  onCancel,
  isCancelling,
}: {
  invite: SentInvite;
  onCancel: (id: string) => void;
  isCancelling: boolean;
}) {
  const isPending = invite.status === "PENDING";
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl border transition-all duration-[250ms]",
        isPending
          ? "bg-[#FFFBF0] dark:bg-[rgba(245,158,11,0.05)] border-[#FDE68A] dark:border-[rgba(245,158,11,0.20)]"
          : "bg-[#FFF8F8] dark:bg-[rgba(244,63,94,0.04)] border-[#FECDD3] dark:border-[rgba(244,63,94,0.18)]",
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          isPending
            ? "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.14)] text-[#B45309] dark:text-[#FCD34D]"
            : "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)] text-[#F43F5E] dark:text-[#FB7185]",
        )}
      >
        <Mail className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0F172A] dark:text-[#F0F6FC] truncate">
          {invite.name}
        </p>
        <p className="text-xs text-[#94A3B8] truncate">{invite.email}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <InviteStatusBadge status={invite.status} />
          <RoleBadge role={invite.role} />
          <span className="text-[10px] text-[#94A3B8]">
            {new Date(invite.sentAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
      {isPending && (
        <button
          onClick={() => onCancel(invite.id)}
          disabled={isCancelling}
          title="Cancel invitation"
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[#C8CDD8] dark:text-[#30363D] hover:text-[#F43F5E] hover:bg-[#FFF1F2] dark:hover:bg-[rgba(244,63,94,0.10)] transition-all duration-[250ms]",
            isCancelling && "opacity-50 pointer-events-none",
          )}
        >
          {isCancelling ? <Spin /> : <X className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}

// ─── Members tab ──────────────────────────────────────────────────────────────

function MembersTab({
  group,
  myInvitations,
  sentInvites,
  removingId,
  cancellingId,
  onRemoveMember,
  onInviteRespond,
  onCancelSentInvite,
}: {
  group: Group;
  myInvitations: GroupInvitation[];
  sentInvites: SentInvite[];
  removingId: string | null;
  cancellingId: string | null;
  onRemoveMember: (id: string, name: string) => void;
  onInviteRespond: (inv: GroupInvitation, accepted: boolean) => void;
  onCancelSentInvite: (id: string) => void;
}) {
  const [sentOpen, setSentOpen] = useState(true);
  const [declinedOpen, setDeclinedOpen] = useState(false);

  const myPending = myInvitations.filter((i) => i.status === "PENDING");
  const pendingSent = sentInvites.filter((i) => i.status === "PENDING");
  const declinedSent = sentInvites.filter((i) => i.status === "DECLINED");

  return (
    <div className="space-y-6">
      {/* My own pending invite */}
      {myPending.map((inv) => (
        <MyInviteBanner
          key={inv._id}
          invitation={inv}
          onRespond={(inv, accepted) => onInviteRespond(inv, accepted)}
        />
      ))}

      {/* Active members */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8]">
          Active Members{" "}
          <span className="normal-case font-normal text-[#64748B] ml-1">
            ({group.members.length})
          </span>
        </p>
        {group.members.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-[#E2E6ED] dark:border-[#21262D] text-[#94A3B8] text-sm">
            <Users className="w-4 h-4 shrink-0" /> No active members yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {group.members.map((m) => (
              <MemberRow
                key={m.userId._id}
                member={m}
                onRemove={onRemoveMember}
                isRemoving={removingId === m.userId._id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pending sent invitations */}
      {pendingSent.length > 0 && (
        <div className="space-y-3">
          <div className="h-px bg-gradient-to-r from-transparent via-[#E2E6ED] dark:via-[#21262D] to-transparent" />
          <button
            onClick={() => setSentOpen((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#94A3B8] hover:text-[#64748B] transition-colors duration-[250ms]"
          >
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-[250ms]",
                sentOpen && "rotate-180",
              )}
            />
            Pending Invitations{" "}
            <span className="normal-case font-normal">
              ({pendingSent.length})
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.60)]" />
          </button>
          {sentOpen && (
            <div className="space-y-2.5">
              {pendingSent.map((inv) => (
                <SentInviteRow
                  key={inv.id}
                  invite={inv}
                  onCancel={onCancelSentInvite}
                  isCancelling={cancellingId === inv.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Declined sent invitations */}
      {declinedSent.length > 0 && (
        <div className="space-y-3">
          {pendingSent.length === 0 && (
            <div className="h-px bg-gradient-to-r from-transparent via-[#E2E6ED] dark:via-[#21262D] to-transparent" />
          )}
          <button
            onClick={() => setDeclinedOpen((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#94A3B8] hover:text-[#64748B] transition-colors duration-[250ms]"
          >
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-[250ms]",
                declinedOpen && "rotate-180",
              )}
            />
            Declined{" "}
            <span className="normal-case font-normal">
              ({declinedSent.length})
            </span>
          </button>
          {declinedOpen && (
            <div className="space-y-2.5">
              {declinedSent.map((inv) => (
                <SentInviteRow
                  key={inv.id}
                  invite={inv}
                  onCancel={onCancelSentInvite}
                  isCancelling={cancellingId === inv.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {group.members.length === 0 &&
        myPending.length === 0 &&
        sentInvites.length === 0 && (
          <Card>
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="No members yet"
              description="Invite people to collaborate on this group's reminders."
            />
          </Card>
        )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const GroupDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // All data operations go through the hook — no service calls in this component
  const {
    group,
    reminders,
    myInvitations,
    isLoading,
    completingId,
    removingId,
    cancellingId,
    load,
    reloadReminders,
    reloadGroup,
    completeReminder,
    removeMember,
    respondToInvitation,
    cancelInvitation,
    sendInvitation,
    setMyInvitations,
  } = useGroupDetail(id);

  const [sentInvites, setSentInvites] = useState<SentInvite[]>([]);
  const [activeTab, setActiveTab] = useState<"reminders" | "members">(
    "reminders",
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    load().catch(() => {
      toast.error("Failed to load group");
      navigate("/groups");
    });
  }, [load, navigate]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setConfirmData({ id: memberId, name: memberName });
  };

  const confirmRemove = async () => {
    if (!confirmData) return;
    await removeMember(confirmData.id);
    setConfirmData(null);
  };

  const handleInviteRespond = async (
    inv: GroupInvitation,
    accepted: boolean,
  ) => {
    await respondToInvitation(inv._id, accepted);
    // respondToInvitation already updates myInvitations internally via hook
  };

  const handleInviteDone = (newSent: SentInvite[]) => {
    setSentInvites((prev) => [...newSent, ...prev]);
    setInviteOpen(false);
    if (newSent.length > 0) setActiveTab("members");
  };

  const handleCancelSentInvite = async (invId: string) => {
    await cancelInvitation(invId);
    setSentInvites((prev) => prev.filter((i) => i.id !== invId));
  };

  // ── Loading / guard ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-[#94A3B8]">Loading group...</p>
        </div>
      </div>
    );
  }
  if (!group) return null;

  // ── Computed ──────────────────────────────────────────────────────────────

  const pending = reminders.filter((r) => r.status === "PENDING").length;
  const completed = reminders.filter((r) => r.status === "COMPLETED").length;
  const overdue = reminders.filter((r) => r.status === "OVERDUE").length;
  const pct =
    reminders.length > 0 ? Math.round((completed / reminders.length) * 100) : 0;

  const groupInvitations = myInvitations.filter(
    (i) => (typeof i.groupId === "object" ? i.groupId._id : i.groupId) === id,
  );
  const myPendingCount = groupInvitations.filter(
    (i) => i.status === "PENDING",
  ).length;
  const sentPendingCount = sentInvites.filter(
    (i) => i.status === "PENDING",
  ).length;
  const membersBadge = myPendingCount + sentPendingCount;

  const existingEmails = group.members.map((m) => m.userId.email);

  const TABS = [
    {
      id: "reminders" as const,
      label: "Reminders",
      count: reminders.length,
      badge: 0,
    },
    {
      id: "members" as const,
      label: "Members",
      count: group.members.length,
      badge: membersBadge,
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/groups")}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F0F6FC] hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-[250ms]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 bg-gradient-to-br from-indigo-600 to-teal-500 shadow-[0_4px_12px_rgba(79,70,229,0.28)]">
              {group.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-[20px] md:text-[24px] font-semibold tracking-wide text-[#0F172A] dark:text-[#F0F6FC] truncate">
                {group.name}
              </h2>
              {group.description && (
                <p className="text-xs text-[#94A3B8] truncate">
                  {group.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              onClick={() => setInviteOpen(true)}
            >
              Invite
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setCreateOpen(true)}
            >
              Add Reminder
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Members",
              value: group.memberCount ?? group.members.length,
              icon: Users,
              color: "text-indigo-600 dark:text-indigo-400",
              bg: "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)]",
            },
            {
              label: "Pending",
              value: pending,
              icon: Clock,
              color: "text-[#B45309] dark:text-[#FCD34D]",
              bg: "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.12)]",
            },
            {
              label: "Completed",
              value: completed,
              icon: CheckSquare,
              color: "text-teal-600 dark:text-teal-400",
              bg: "bg-[#F0FDFA] dark:bg-[rgba(20,184,166,0.12)]",
            },
            {
              label: "Overdue",
              value: overdue,
              icon: AlertTriangle,
              color: "text-[#F43F5E] dark:text-[#FB7185]",
              bg: "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)]",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="rounded-xl p-4 bg-white dark:bg-[#161B22] border border-[#E2E6ED] dark:border-[#21262D] shadow-[0_2px_8px_rgba(15,23,42,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.30)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-widest text-[#94A3B8] mb-1">
                    {label}
                  </p>
                  <p className="text-xl font-bold text-[#0F172A] dark:text-[#F0F6FC]">
                    {value}
                  </p>
                </div>
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    bg,
                    color,
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="rounded-xl border border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#161B22] p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[#0F172A] dark:text-[#F0F6FC]">
              Overall Progress
            </p>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {pct}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#EEF0F4] dark:bg-[#21262D]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-teal-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-[#94A3B8] mt-2">
            {completed} of {reminders.length} reminders completed
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center p-1 gap-0.5 rounded-xl w-fit bg-white dark:bg-[#161B22] border border-[#E2E6ED] dark:border-[#21262D] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          {TABS.map(({ id: tabId, label, count, badge }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                "relative flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-[250ms]",
                activeTab === tabId
                  ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-sm shadow-indigo-500/20"
                  : "text-[#475569] dark:text-[#8B949E] hover:text-[#0F172A] dark:hover:text-[#F0F6FC] hover:bg-black/5 dark:hover:bg-white/5",
              )}
            >
              {label}
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                  activeTab === tabId
                    ? "bg-white/20"
                    : "bg-black/[0.06] dark:bg-white/[0.08]",
                )}
              >
                {count}
              </span>
              {badge > 0 && activeTab !== tabId && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#F59E0B] text-white text-[9px] font-bold flex items-center justify-center shadow-sm shadow-[rgba(245,158,11,0.40)]">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "reminders" ? (
          reminders.length === 0 ? (
            <Card>
              <EmptyState
                icon={<CheckCircle2 className="w-8 h-8" />}
                title="No reminders yet"
                description="Add the first reminder for this group."
                action={
                  <Button
                    leftIcon={<Plus className="w-4 h-4" />}
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                  >
                    Add Reminder
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="space-y-2.5">
              {reminders.map((r) => (
                <ReminderRow
                  key={r._id}
                  reminder={r}
                  onComplete={completeReminder}
                  isCompleting={completingId === r._id}
                />
              ))}
            </div>
          )
        ) : (
          <MembersTab
            group={group}
            myInvitations={groupInvitations}
            sentInvites={sentInvites}
            removingId={removingId}
            cancellingId={cancellingId}
            onRemoveMember={handleRemoveMember}
            onInviteRespond={handleInviteRespond}
            onCancelSentInvite={handleCancelSentInvite}
          />
        )}
      </div>

      {/* Modals */}
      <CreateReminderModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultGroupId={group._id}
        onCreated={reloadReminders}
      />

      {inviteOpen && (
        <InviteModal
          groupId={group._id}
          existingEmails={existingEmails}
          sendInvitation={sendInvitation}
          onDone={handleInviteDone}
          onClose={() => setInviteOpen(false)}
        />
      )}

      {confirmData && (
        <ConfirmRemoveDialog
          name={confirmData.name}
          onConfirm={confirmRemove}
          onCancel={() => setConfirmData(null)}
          isLoading={removingId === confirmData.id}
        />
      )}
    </>
  );
};

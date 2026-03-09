/**
 * pages/groups/GroupDetail.tsx
 *
 * GroupRole = "ADMIN" | "MEMBER" (no OWNER — backend doesn't have it)
 * Reminder.groupId is { _id, name } | null  (no scope field)
 * InviteModal uses Zod inviteMemberSchema
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  ShieldCheck,
  User,
  UserPlus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  CheckSquare,
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
import { CreateReminderModal } from "../../components/modal/CreateReminderModal";
import * as groupService from "../../services/group";
import * as reminderService from "../../services/reminder";
import { parseForm, inviteMemberSchema } from "../../lib/validations";
import { formatDueDate, isOverdue } from "../../utils/formatDate";
import toast from "react-hot-toast";
import type { Group, GroupRole, Reminder } from "../../types/types";

// ── Role config — ADMIN and MEMBER only (backend has no OWNER) ────────────────
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

// ── Reminder row ──────────────────────────────────────────────────────────────
function ReminderRow({ reminder }: { reminder: Reminder }) {
  const overdue = isOverdue(reminder.dueDateTime, reminder.status);
  const isDone = reminder.status === "COMPLETED";
  const statusVariant: Record<string, "pending" | "completed" | "overdue"> = {
    PENDING: "pending",
    COMPLETED: "completed",
    OVERDUE: "overdue",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border transition-all duration-[250ms]",
        overdue
          ? "bg-[#FFF8F8] dark:bg-[rgba(244,63,94,0.05)] border-[#FECDD3] dark:border-[rgba(244,63,94,0.25)]"
          : "bg-white dark:bg-[#161B22] border-[#E2E6ED] dark:border-[#21262D] hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
      )}
    >
      <div
        className={cn(
          "mt-0.5 shrink-0",
          isDone
            ? "text-emerald-500"
            : overdue
              ? "text-[#F43F5E]"
              : "text-[#C8CDD8] dark:text-[#30363D]",
        )}
      >
        {isDone ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : overdue ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p
            className={cn(
              "text-sm font-medium tracking-wide",
              isDone
                ? "line-through text-[#94A3B8]"
                : "text-[#0F172A] dark:text-[#F0F6FC]",
            )}
          >
            {reminder.title}
          </p>
          <Badge variant={statusVariant[reminder.status]}>
            {reminder.status.charAt(0) + reminder.status.slice(1).toLowerCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span
            className={cn(
              "text-xs",
              overdue ? "text-[#BE123C] dark:text-[#FDA4AF]" : "text-[#94A3B8]",
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
  );
}

// ── Invite modal — Zod validated ──────────────────────────────────────────────
function InviteModal({
  groupId,
  onDone,
  onClose,
}: {
  groupId: string;
  onDone: () => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [busy, setBusy] = useState(false);

  const handleInvite = async () => {
    const { data, errors: zodErrors } = parseForm(inviteMemberSchema, {
      email,
      role,
    });
    if (zodErrors) {
      setErrors(zodErrors);
      return;
    }

    setBusy(true);
    try {
      await groupService.inviteMember(groupId, {
        email: data.email,
        role: data.role,
      });
      toast.success("Member invited!");
      onDone();
    } catch {
      toast.error("Could not invite member — check the email address.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl p-6 space-y-4 bg-white dark:bg-[#161B22] border border-[#E2E6ED] dark:border-[#21262D] shadow-[0_24px_48px_rgba(15,23,42,0.16)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.60)]">
        <div>
          <h3 className="text-base font-semibold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide">
            Invite Member
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Enter the email of a registered user.
          </p>
        </div>

        {/* Email */}
        <div>
          <input
            type="email"
            autoFocus
            placeholder="member@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({});
            }}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            className={cn(
              "w-full h-11 px-3.5 text-sm rounded-lg",
              "bg-white dark:bg-[#0D1117] text-[#0F172A] dark:text-[#F0F6FC] placeholder:text-[#94A3B8]",
              "border-[1.5px] focus:outline-none transition-all duration-[250ms]",
              errors.email
                ? "border-[#F43F5E] focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]"
                : "border-[#E2E6ED] dark:border-[#21262D] focus:border-indigo-600 dark:focus:border-[#818CF8] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]",
            )}
          />
          {errors.email && (
            <p className="text-xs text-[#F43F5E] mt-1">{errors.email}</p>
          )}
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-2">
          {(["MEMBER", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "py-2 rounded-lg border text-xs font-medium transition-all duration-[250ms]",
                role === r
                  ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white border-transparent shadow-sm"
                  : "border-[#E2E6ED] dark:border-[#21262D] text-[#475569] dark:text-[#8B949E] bg-white dark:bg-[#161B22] hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
              )}
            >
              {r === "ADMIN" ? "Admin" : "Member"}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleInvite} isLoading={busy}>
            Send Invite
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export const GroupDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reminders" | "members">(
    "reminders",
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [g, r] = await Promise.all([
          groupService.getGroupById(id),
          reminderService.getGroupReminders(id),
        ]);
        setGroup(g);
        setReminders(r.reminders);
      } catch {
        toast.error("Failed to load group");
        navigate("/groups");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, navigate]);

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

  const pending = reminders.filter((r) => r.status === "PENDING").length;
  const completed = reminders.filter((r) => r.status === "COMPLETED").length;
  const overdue = reminders.filter((r) => r.status === "OVERDUE").length;
  const pct =
    reminders.length > 0 ? Math.round((completed / reminders.length) * 100) : 0;

  const TABS = [
    { id: "reminders", label: "Reminders", count: reminders.length },
    { id: "members", label: "Members", count: group.memberCount },
  ] as const;

  return (
    <>
      <div className="space-y-6">
        {/* Back nav */}
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
              value: group.memberCount,
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
          {TABS.map(({ id: tabId, label, count }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-[250ms]",
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
                    : "bg-black/6 dark:bg-white/8",
                )}
              >
                {count}
              </span>
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
                <ReminderRow key={r._id} reminder={r} />
              ))}
            </div>
          )
        ) : (
          <div className="space-y-2.5">
            {group.members.map((m) => (
              <div
                key={m.userId._id}
                className="flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-[#161B22] border-[#E2E6ED] dark:border-[#21262D] hover:border-[#C8CDD8] dark:hover:border-[#30363D] transition-all duration-[250ms]"
              >
                <Avatar name={m.userId.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A] dark:text-[#F0F6FC] truncate">
                    {m.userId.name}
                  </p>
                  <p className="text-xs text-[#94A3B8] truncate">
                    {m.userId.email}
                  </p>
                </div>
                <RoleBadge role={m.role} />
                {m.role !== "ADMIN" && (
                  <button
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C8CDD8] dark:text-[#30363D] hover:text-[#F43F5E] hover:bg-[#FFF1F2] dark:hover:bg-[rgba(244,63,94,0.10)] transition-all duration-[250ms]"
                    title="Remove member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateReminderModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      {inviteOpen && (
        <InviteModal
          groupId={group._id}
          onDone={() => setInviteOpen(false)}
          onClose={() => setInviteOpen(false)}
        />
      )}
    </>
  );
};

/**
 * pages/activity/Activity.tsx
 *
 * Architecture: ActivityPage → useActivity (hook) → activityStore → activityService
 *               ActivityPage → useGroups   (hook) → groupStore   → groupService
 *
 * Filters:
 *   Type: All | Personal | Groups (client-side on logs)
 *   Group: specific group dropdown → calls fetchGroupActivity for server-side filter
 */
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Plus,
  Trash2,
  UserPlus,
  Users,
  Edit3,
  Activity,
  Bell,
  ShieldCheck,
  Mail,
  X,
  RotateCcw,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { EmptyState, Card, Avatar } from "../../components/ui";
import { useActivity } from "../../hooks/useActivity";
import { useGroups } from "../../hooks/useGroups";
import type { ActivityLog, ActivityAction } from "../../types/types";
import { Button } from "../../components/ui";

// ── Action config ─────────────────────────────────────────────────────────────

const ACTION_CFG: Record<
  ActivityAction | "DEFAULT",
  { icon: React.ElementType; color: string; bg: string; verb: string }
> = {
  TASK_CREATED: {
    icon: Plus,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)]",
    verb: "created a task",
  },
  TASK_UPDATED: {
    icon: Edit3,
    color: "text-[#B45309] dark:text-[#FCD34D]",
    bg: "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.12)]",
    verb: "updated a task",
  },
  TASK_COMPLETED: {
    icon: CheckCircle2,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-[#F0FDFA] dark:bg-[rgba(20,184,166,0.12)]",
    verb: "completed a task",
  },
  TASK_DELETED: {
    icon: Trash2,
    color: "text-[#F43F5E] dark:text-[#FB7185]",
    bg: "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)]",
    verb: "deleted a task",
  },
  TASK_OVERDUE: {
    icon: Bell,
    color: "text-[#F43F5E] dark:text-[#FB7185]",
    bg: "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)]",
    verb: "has an overdue task",
  },
  SUBTASK_CREATED: {
    icon: Plus,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)]",
    verb: "created a sub-task",
  },
  SUBTASK_DELETED: {
    icon: Trash2,
    color: "text-[#F43F5E] dark:text-[#FB7185]",
    bg: "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)]",
    verb: "deleted a sub-task",
  },
  GROUP_CREATED: {
    icon: Users,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)]",
    verb: "created a group",
  },
  GROUP_UPDATED: {
    icon: Edit3,
    color: "text-[#B45309] dark:text-[#FCD34D]",
    bg: "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.12)]",
    verb: "updated a group",
  },
  GROUP_DELETED: {
    icon: Trash2,
    color: "text-[#F43F5E] dark:text-[#FB7185]",
    bg: "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)]",
    verb: "deleted a group",
  },
  GROUP_MEMBER_ADDED: {
    icon: UserPlus,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-[#F0FDFA] dark:bg-[rgba(20,184,166,0.12)]",
    verb: "joined a group",
  },
  GROUP_MEMBER_REMOVED: {
    icon: Trash2,
    color: "text-[#F43F5E] dark:text-[#FB7185]",
    bg: "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)]",
    verb: "was removed from a group",
  },
  GROUP_ROLE_CHANGED: {
    icon: ShieldCheck,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)]",
    verb: "had their role changed",
  },
  GROUP_INVITATION_SENT: {
    icon: Mail,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)]",
    verb: "sent an invitation",
  },
  GROUP_INVITATION_ACCEPTED: {
    icon: CheckCircle2,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-[#F0FDFA] dark:bg-[rgba(20,184,166,0.12)]",
    verb: "accepted an invitation",
  },
  GROUP_INVITATION_DECLINED: {
    icon: X,
    color: "text-[#F43F5E] dark:text-[#FB7185]",
    bg: "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)]",
    verb: "declined an invitation",
  },
  GROUP_INVITATION_CANCELLED: {
    icon: RotateCcw,
    color: "text-[#64748B] dark:text-[#64748B]",
    bg: "bg-[#F8FAFC] dark:bg-[rgba(148,163,184,0.08)]",
    verb: "cancelled an invitation",
  },
  DEFAULT: {
    icon: Bell,
    color: "text-[#64748B] dark:text-[#64748B]",
    bg: "bg-[#F8FAFC] dark:bg-[rgba(148,163,184,0.08)]",
    verb: "performed an action",
  },
};

function getActionCfg(action: string) {
  return ACTION_CFG[action as ActivityAction] ?? ACTION_CFG.DEFAULT;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function dayLabel(date: string) {
  const d = new Date(date);
  const now = new Date();
  const todayMs = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const dateMs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((todayMs - dateMs) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function groupByDay(logs: ActivityLog[]) {
  const map = new Map<string, ActivityLog[]>();
  for (const log of logs) {
    const key = new Date(log.createdAt).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(log);
  }
  return Array.from(map.entries());
}

function extractSubject(log: ActivityLog): string | null {
  if (log.taskId?.title) return log.taskId.title;
  const m = log.metadata;
  if (typeof m?.title === "string" && m.title) return m.title;
  if (typeof m?.name === "string" && m.name) return m.name;
  if (typeof m?.taskTitle === "string" && m.taskTitle) return m.taskTitle;
  return null;
}

// ── Activity item ─────────────────────────────────────────────────────────────

function ActivityItem({ log, isLast }: { log: ActivityLog; isLast: boolean }) {
  const cfg = getActionCfg(log.action);
  const Icon = cfg.icon;
  const subject = extractSubject(log);

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center z-10 shrink-0",
            cfg.bg,
            cfg.color,
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        {!isLast && (
          <div className="w-px flex-1 mt-1 min-h-[16px] bg-[#E2E6ED] dark:bg-[#21262D]" />
        )}
      </div>
      <div className={cn("flex-1 min-w-0", isLast ? "pb-0" : "pb-4")}>
        <div
          className={cn(
            "flex items-start gap-3 p-4 rounded-xl border transition-all duration-[250ms]",
            "bg-white dark:bg-[#161B22] border-[#E2E6ED] dark:border-[#21262D]",
            "hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
            "hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.25)]",
          )}
        >
          <Avatar name={log.userId.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#0F172A] dark:text-[#F0F6FC] leading-snug">
              <span className="font-medium">{log.userId.name}</span>{" "}
              <span className="text-[#475569] dark:text-[#8B949E]">
                {cfg.verb}
              </span>
              {subject && (
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  {" "}
                  "{subject}"
                </span>
              )}
              {log.groupId && (
                <span className="text-[#94A3B8]">
                  {" "}
                  in{" "}
                  <span className="font-medium text-teal-600 dark:text-teal-400">
                    {log.groupId.name}
                  </span>
                </span>
              )}
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">
              {relativeTime(log.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-8 h-8 rounded-xl shrink-0 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
        <div className="w-px flex-1 mt-1 min-h-[16px] bg-[#E2E6ED] dark:bg-[#21262D]" />
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-start gap-3 p-4 rounded-xl border border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#161B22]">
          <div className="w-7 h-7 rounded-full shrink-0 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 rounded-md w-3/4 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
            <div className="h-2.5 rounded-md w-1/4 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const ActivityPage = () => {
  const [typeFilter, setTypeFilter] = useState<"all" | "personal" | "groups">(
    "all",
  );
  const [groupFilter, setGroupFilter] = useState<string>("ALL");

  const { logs, isLoading, fetchActivity, fetchGroupActivity } = useActivity();
  const { groups } = useGroups();

  useEffect(() => {
    if (groupFilter !== "ALL") {
      fetchGroupActivity(groupFilter);
    } else {
      fetchActivity();
    }
  }, [groupFilter, fetchActivity, fetchGroupActivity]);

  // Client-side type filter (only meaningful when groupFilter === "ALL")
  const filtered = logs.filter((log) => {
    if (groupFilter !== "ALL") return true; // server already filtered
    if (typeFilter === "personal") return !log.groupId;
    if (typeFilter === "groups") return !!log.groupId;
    return true;
  });

  const grouped = groupByDay(filtered);
  const hasFilters = typeFilter !== "all" || groupFilter !== "ALL";

  const handleGroupChange = (gid: string) => {
    setGroupFilter(gid);
    // Reset type filter when switching to a specific group
    if (gid !== "ALL") setTypeFilter("all");
  };

  const handleClear = () => {
    setTypeFilter("all");
    setGroupFilter("ALL");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[22px] md:text-[28px] font-semibold tracking-wide leading-snug text-[#0F172A] dark:text-[#F0F6FC]">
          Activity Log
        </h2>
        <p className="text-sm text-[#94A3B8] mt-0.5">
          Everything that happened in your workspace
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Type filter tabs — hidden when viewing a specific group */}
        {groupFilter === "ALL" && (
          <div className="flex items-center p-1 gap-0.5 rounded-xl w-fit bg-white dark:bg-[#161B22] border border-[#E2E6ED] dark:border-[#21262D] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            {(["all", "personal", "groups"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-medium rounded-lg capitalize transition-all duration-[250ms]",
                  typeFilter === f
                    ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-sm shadow-indigo-500/20"
                    : "text-[#475569] dark:text-[#8B949E] hover:text-[#0F172A] dark:hover:text-[#F0F6FC] hover:bg-black/5 dark:hover:bg-white/5",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {/* Group filter */}
        {groups.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <select
              value={groupFilter}
              onChange={(e) => handleGroupChange(e.target.value)}
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
              <option value="ALL">All Activity</option>
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
            onClick={handleClear}
            className={cn(
              "flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-[#E2E6ED] dark:border-[#21262D] text-[#475569] dark:text-[#8B949E] bg-white dark:bg-[#161B22] hover:border-[#F43F5E] hover:text-[#F43F5E] dark:hover:border-[rgba(244,63,94,0.50)] dark:hover:text-[#FDA4AF] transition-all duration-[250ms]",
            )}
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <ActivitySkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Activity className="w-8 h-8" />}
            title="No activity yet"
            description={
              typeFilter === "personal"
                ? "Your personal actions will appear here."
                : typeFilter === "groups"
                  ? "Group activity will appear here."
                  : hasFilters
                    ? "Try clearing filters to see more activity."
                    : "Actions you and your team take will appear here as a timeline."
            }
            action={
              hasFilters ? (
                <Button
                  variant="secondary"
                  leftIcon={<X className="w-3.5 h-3.5" />}
                  size="sm"
                  onClick={handleClear}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dayKey, dayLogs]) => (
            <div key={dayKey}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-[#E2E6ED] dark:bg-[#21262D]" />
                <span className="text-[11px] font-medium uppercase tracking-widest text-[#94A3B8] shrink-0">
                  {dayLabel(dayLogs[0].createdAt)}
                </span>
                <div className="h-px flex-1 bg-[#E2E6ED] dark:bg-[#21262D]" />
              </div>
              {dayLogs.map((log, idx) => (
                <ActivityItem
                  key={log._id}
                  log={log}
                  isLast={idx === dayLogs.length - 1}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

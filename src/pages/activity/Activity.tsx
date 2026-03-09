/**
 * pages/activity/Activity.tsx
 *
 * ActivityLog.action uses ActivityAction enum (no MEMBER_ADDED — it's GROUP_MEMBER_ADDED).
 * ActivityLog.metadata (not .details) holds extra context.
 * ActivityLog.reminderId is { _id, title } | null (populated by backend).
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
} from "lucide-react";
import { cn } from "../../utils/cn";
import { EmptyState, Card, Avatar } from "../../components/ui";
import { useActivity } from "../../hooks/useActivity";
import type { ActivityLog, ActivityAction } from "../../types/types";

// ── Action → visual config (keyed to ActivityAction enum values) ──────────────
const ACTION_CFG: Record<
  ActivityAction | "DEFAULT",
  {
    icon: React.ElementType;
    color: string;
    bg: string;
    verb: string;
  }
> = {
  REMINDER_CREATED: {
    icon: Plus,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)]",
    verb: "created a reminder",
  },
  REMINDER_UPDATED: {
    icon: Edit3,
    color: "text-[#B45309] dark:text-[#FCD34D]",
    bg: "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.12)]",
    verb: "updated a reminder",
  },
  REMINDER_COMPLETED: {
    icon: CheckCircle2,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-[#F0FDFA] dark:bg-[rgba(20,184,166,0.12)]",
    verb: "completed a reminder",
  },
  REMINDER_DELETED: {
    icon: Trash2,
    color: "text-[#F43F5E] dark:text-[#FB7185]",
    bg: "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)]",
    verb: "deleted a reminder",
  },
  REMINDER_OVERDUE: {
    icon: Bell,
    color: "text-[#F43F5E] dark:text-[#FB7185]",
    bg: "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)]",
    verb: "has an overdue reminder",
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
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const dateStart = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
  ).getTime();
  const diffDays = Math.round((todayStart - dateStart) / 86400000);
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

// Extract a human-readable subject from the log:
// prefer populated reminderId.title, then metadata.title / metadata.name
function extractSubject(log: ActivityLog): string | null {
  if (log.reminderId?.title) return log.reminderId.title;
  const m = log.metadata;
  if (typeof m?.title === "string" && m.title) return m.title;
  if (typeof m?.name === "string" && m.name) return m.name;
  if (typeof m?.reminderTitle === "string" && m.reminderTitle)
    return m.reminderTitle;
  return null;
}

// ── Activity item ─────────────────────────────────────────────────────────────
function ActivityItem({ log, isLast }: { log: ActivityLog; isLast: boolean }) {
  const cfg = getActionCfg(log.action);
  const Icon = cfg.icon;
  const subject = extractSubject(log);

  return (
    <div className="flex gap-4">
      {/* Timeline spine */}
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

      {/* Card */}
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
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
  const [filter, setFilter] = useState<"all" | "personal" | "groups">("all");

  const { logs, isLoading, fetchActivity } = useActivity();

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const filtered = logs.filter((log) => {
    if (filter === "personal") return !log.groupId;
    if (filter === "groups") return !!log.groupId;
    return true;
  });

  const grouped = groupByDay(filtered);

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

      {/* Filter tabs */}
      <div className="flex items-center p-1 gap-0.5 rounded-xl w-fit bg-white dark:bg-[#161B22] border border-[#E2E6ED] dark:border-[#21262D] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        {(["all", "personal", "groups"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3.5 py-1.5 text-xs font-medium rounded-lg capitalize transition-all duration-[250ms]",
              filter === f
                ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-sm shadow-indigo-500/20"
                : "text-[#475569] dark:text-[#8B949E] hover:text-[#0F172A] dark:hover:text-[#F0F6FC] hover:bg-black/5 dark:hover:bg-white/5",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <ActivitySkeleton key={i} />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Activity className="w-8 h-8" />}
            title="No activity yet"
            description={
              filter === "personal"
                ? "Your personal actions will appear here."
                : filter === "groups"
                  ? "Group activity will appear here."
                  : "Actions you and your team take will appear here as a timeline."
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dayKey, dayLogs]) => (
            <div key={dayKey}>
              {/* Day separator */}
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
                  isLast={idx === dayLogs?.length - 1}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

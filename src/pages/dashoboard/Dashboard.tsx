/**
 * pages/dashboard/Dashboard.tsx
 *
 * Stats fetched from existing endpoints — no dedicated /dashboard endpoint:
 *   GET /reminders?limit=200   → pending / completed / overdue counts, upcoming
 *   GET /groups                → group count, group filter options
 *   GET /activity?limit=10     → recent activity feed
 *   GET /notifications         → unreadCount badge
 *
 * All heavy computation is client-side after fetching.
 * Filters (group, priority, time range) narrow the stats shown.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Plus,
  ChevronRight,
  TrendingUp,
  Activity,
  Bell,
  Calendar,
  Target,
  Zap,
  Filter,
  LayoutDashboard,
  CheckSquare,
  X,
  Mail,
  XCircle,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { Button, Spinner, EmptyState, Card } from "../../components/ui";
import { CreateReminderModal } from "../../components/modal/CreateReminderModal";
import { CreateGroupModal } from "../../components/modal/CreateGroupModal";
import * as reminderService from "../../services/reminder";
import * as groupService from "../../services/group";
import * as activityService from "../../services/activity";
import * as notificationService from "../../services/notification";
import { useAuthStore } from "../../store/authStore";
import { formatDueDate, isOverdue } from "../../utils/formatDate";
import { ROUTES } from "../../config/routes";
import type {
  Reminder,
  Group,
  ActivityLog,
  ActivityAction,
} from "../../types/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeFilter = "today" | "week" | "month" | "all";
type PriorityFilter = "HIGH" | "MEDIUM" | "LOW" | "all";

interface DashStats {
  pending: number;
  completed: number;
  overdue: number;
  total: number;
  completionPct: number;
  dueTodayCount: number;
  dueWeekCount: number;
  groupCount: number;
  unreadNotif: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function isInPeriod(dateStr: string, period: TimeFilter): boolean {
  if (period === "all") return true;
  const date = new Date(dateStr);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "today") {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return date >= start && date < end;
  }
  if (period === "week") {
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return date >= start && date < end;
  }
  if (period === "month") {
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return date >= start && date < end;
  }
  return true;
}

function startOfDay(offset = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

// ─── Activity config ──────────────────────────────────────────────────────────

const ACT_CFG: Record<
  ActivityAction | "DEFAULT",
  { verb: string; color: string; icon: React.ElementType }
> = {
  REMINDER_CREATED: {
    verb: "created reminder",
    color:
      "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.18)] text-indigo-600 dark:text-indigo-400",
    icon: Plus,
  },
  REMINDER_UPDATED: {
    verb: "updated reminder",
    color:
      "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.14)] text-[#B45309] dark:text-[#FCD34D]",
    icon: CheckSquare,
  },
  REMINDER_COMPLETED: {
    verb: "completed reminder",
    color:
      "bg-[#F0FDFA] dark:bg-[rgba(20,184,166,0.14)] text-teal-600 dark:text-teal-400",
    icon: CheckCircle2,
  },
  REMINDER_DELETED: {
    verb: "deleted reminder",
    color:
      "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)] text-[#F43F5E] dark:text-[#FB7185]",
    icon: AlertTriangle,
  },
  REMINDER_OVERDUE: {
    verb: "overdue reminder",
    color:
      "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)] text-[#F43F5E] dark:text-[#FB7185]",
    icon: AlertTriangle,
  },
  GROUP_CREATED: {
    verb: "created group",
    color:
      "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.18)] text-indigo-600 dark:text-indigo-400",
    icon: Users,
  },
  GROUP_UPDATED: {
    verb: "updated group",
    color:
      "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.14)] text-[#B45309] dark:text-[#FCD34D]",
    icon: Users,
  },
  GROUP_DELETED: {
    verb: "deleted group",
    color:
      "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)] text-[#F43F5E] dark:text-[#FB7185]",
    icon: Users,
  },
  GROUP_MEMBER_ADDED: {
    verb: "joined group",
    color:
      "bg-[#F0FDFA] dark:bg-[rgba(20,184,166,0.14)] text-teal-600 dark:text-teal-400",
    icon: Users,
  },
  GROUP_MEMBER_REMOVED: {
    verb: "left group",
    color:
      "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)] text-[#F43F5E] dark:text-[#FB7185]",
    icon: Users,
  },
  GROUP_ROLE_CHANGED: {
    verb: "role updated",
    color:
      "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.18)] text-indigo-600 dark:text-indigo-400",
    icon: Users,
  },
  GROUP_INVITATION_SENT: {
    verb: "sent a group invitation",
    color: "text-indigo-500",
    icon: Mail,
  },
  GROUP_INVITATION_ACCEPTED: {
    verb: "accepted a group invitation",
    color: "text-teal-500",
    icon: CheckCircle2,
  },
  GROUP_INVITATION_DECLINED: {
    verb: "declined a group invitation",
    color: "text-rose-500",
    icon: XCircle,
  },
  GROUP_INVITATION_CANCELLED: {
    verb: "cancelled a group invitation",
    color: "text-slate-400",
    icon: X,
  },
  DEFAULT: {
    verb: "performed action",
    color:
      "bg-[#F8FAFC] dark:bg-[rgba(148,163,184,0.08)] text-[#64748B] dark:text-[#64748B]",
    icon: Activity,
  },
};

function getActCfg(action: string) {
  return ACT_CFG[action as ActivityAction] ?? ACT_CFG.DEFAULT;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  glow: string;
  trend?: string;
  onClick?: () => void;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  border,
  glow,
  trend,
  onClick,
}: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full text-left rounded-xl p-5 border transition-all duration-[250ms]",
        "bg-white dark:bg-[#161B22]",
        "hover:-translate-y-0.5",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        border,
        glow,
        onClick && "cursor-pointer group",
      )}
    >
      {/* Icon circle */}
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center mb-4",
          bg,
          color,
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Value */}
      <div className="flex items-end justify-between">
        <div>
          <p
            className={cn(
              "text-3xl font-bold tracking-tight leading-none mb-1",
              color,
            )}
          >
            {value}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#94A3B8]">
            {label}
          </p>
        </div>
        {onClick && (
          <ChevronRight
            className={cn(
              "w-4 h-4 text-[#C8CDD8] dark:text-[#30363D] transition-all duration-[250ms]",
              "group-hover:translate-x-0.5",
              color,
            )}
          />
        )}
      </div>

      {trend && <p className="text-[10px] text-[#94A3B8] mt-2">{trend}</p>}
    </button>
  );
}

// ─── Donut chart (pure SVG, no library) ───────────────────────────────────────

function DonutChart({ pct, label }: { pct: number; label: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <svg width="96" height="96" viewBox="0 0 96 96">
          {/* Track */}
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-[#EEF0F4] dark:text-[#21262D]"
          />
          {/* Fill */}
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            strokeWidth="8"
            stroke="url(#donutGrad)"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 48 48)"
            style={{
              transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
          <defs>
            <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#14B8A6" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-[#0F172A] dark:text-[#F0F6FC] leading-none">
            {pct}%
          </span>
        </div>
      </div>
      <p className="text-xs text-[#94A3B8] mt-2 font-medium">{label}</p>
    </div>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function MiniBarChart({
  data,
}: {
  data: { label: string; value: number; max: number }[];
}) {
  return (
    <div className="flex items-end gap-1.5 h-14">
      {data.map(({ label, value, max }) => {
        const pct = max > 0 ? (value / max) * 100 : 0;
        return (
          <div key={label} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full relative flex items-end"
              style={{ height: "40px" }}
            >
              <div
                className="w-full rounded-sm bg-gradient-to-t from-indigo-600 to-teal-400 opacity-80 transition-all duration-700"
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
            </div>
            <span className="text-[9px] text-[#94A3B8] truncate w-full text-center">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Upcoming reminder row ────────────────────────────────────────────────────

function UpcomingRow({
  reminder,
  onClick,
}: {
  reminder: Reminder;
  onClick: () => void;
}) {
  const due = new Date(reminder.dueDateTime);
  const now = new Date();
  const diffH = Math.round((due.getTime() - now.getTime()) / 3600000);
  const isDueToday = due.toDateString() === now.toDateString();
  const isLate = due < now;

  const urgency = isLate
    ? "border-l-[#F43F5E] bg-[#FFF8F8] dark:bg-[rgba(244,63,94,0.04)]"
    : isDueToday
      ? "border-l-[#F59E0B] bg-[#FFFBF0] dark:bg-[rgba(245,158,11,0.04)]"
      : "border-l-[#4F46E5] bg-white dark:bg-[#161B22]";

  const timeLabel = isLate
    ? `${Math.abs(diffH)}h overdue`
    : diffH < 1
      ? "< 1h left"
      : diffH < 24
        ? `${diffH}h left`
        : formatDueDate(reminder.dueDateTime);

  const timeColor = isLate
    ? "text-[#F43F5E] dark:text-[#FB7185]"
    : isDueToday
      ? "text-[#B45309] dark:text-[#FCD34D]"
      : "text-[#94A3B8]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl border-l-2 border border-[#E2E6ED] dark:border-[#21262D] text-left",
        "hover:border-[#C8CDD8] dark:hover:border-[#30363D] transition-all duration-[250ms]",
        urgency,
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0F172A] dark:text-[#F0F6FC] truncate">
          {reminder.title}
        </p>
        {reminder.groupId && (
          <p className="text-[10px] text-[#94A3B8] truncate mt-0.5">
            {(reminder.groupId as { name: string }).name}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <span className={cn("text-[11px] font-medium", timeColor)}>
          {timeLabel}
        </span>
        <div
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full mt-0.5 inline-block font-medium",
            reminder.priority === "HIGH"
              ? "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)] text-[#BE123C] dark:text-[#FDA4AF]"
              : reminder.priority === "MEDIUM"
                ? "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.12)] text-[#B45309] dark:text-[#FCD34D]"
                : "bg-[#F8FAFC] dark:bg-[rgba(148,163,184,0.08)] text-[#64748B]",
          )}
        >
          {reminder.priority}
        </div>
      </div>
    </button>
  );
}

// ─── Activity feed item ───────────────────────────────────────────────────────

function ActivityItem({ log }: { log: ActivityLog }) {
  const cfg = getActCfg(log.action);
  const Icon = cfg.icon;
  const subject =
    (log.reminderId as { title?: string } | null)?.title ??
    (log.groupId as { name?: string } | null)?.name ??
    "";

  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
          cfg.color,
        )}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#475569] dark:text-[#8B949E] leading-relaxed">
          <span className="font-medium text-[#0F172A] dark:text-[#F0F6FC]">
            {(log.userId as { name?: string })?.name ?? "You"}
          </span>{" "}
          {cfg.verb}
          {subject && (
            <span className="text-indigo-600 dark:text-indigo-400">
              {" "}
              "{subject}"
            </span>
          )}
        </p>
        <p className="text-[10px] text-[#94A3B8] mt-0.5">
          {relativeTime(log.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  groups: Group[];
  selectedGroup: string;
  selectedPriority: PriorityFilter;
  selectedTime: TimeFilter;
  onGroup: (id: string) => void;
  onPriority: (p: PriorityFilter) => void;
  onTime: (t: TimeFilter) => void;
  onClear: () => void;
  hasActive: boolean;
}

function FilterBar({
  groups,
  selectedGroup,
  selectedPriority,
  selectedTime,
  onGroup,
  onPriority,
  onTime,
  onClear,
  hasActive,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 flex-wrap p-3 rounded-xl border transition-all duration-[250ms]",
        hasActive
          ? "border-indigo-200 dark:border-[rgba(99,102,241,0.25)] bg-[#FAFBFF] dark:bg-[rgba(99,102,241,0.05)]"
          : "border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#161B22]",
      )}
    >
      <Filter className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
      <span className="text-xs font-medium text-[#475569] dark:text-[#8B949E]">
        Filter:
      </span>

      {/* Time range */}
      <div className="flex items-center gap-1">
        {(["today", "week", "month", "all"] as TimeFilter[]).map((t) => (
          <button
            key={t}
            onClick={() => onTime(t)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-[250ms]",
              selectedTime === t
                ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-sm"
                : "text-[#64748B] dark:text-[#64748B] hover:bg-[#F8FAFC] dark:hover:bg-[rgba(255,255,255,0.05)]",
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-[#E2E6ED] dark:bg-[#21262D]" />

      {/* Priority */}
      <div className="flex items-center gap-1">
        {(["all", "HIGH", "MEDIUM", "LOW"] as PriorityFilter[]).map((p) => (
          <button
            key={p}
            onClick={() => onPriority(p)}
            className={cn(
              "px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-[250ms]",
              selectedPriority === p
                ? p === "HIGH"
                  ? "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.14)] text-[#BE123C] dark:text-[#FDA4AF] shadow-sm"
                  : p === "MEDIUM"
                    ? "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.14)] text-[#B45309] dark:text-[#FCD34D] shadow-sm"
                    : p === "LOW"
                      ? "bg-[#F8FAFC] dark:bg-[rgba(148,163,184,0.10)] text-[#64748B] shadow-sm"
                      : "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-sm"
                : "text-[#64748B] dark:text-[#64748B] hover:bg-[#F8FAFC] dark:hover:bg-[rgba(255,255,255,0.05)]",
            )}
          >
            {p === "all"
              ? "All Priority"
              : p.charAt(0) + p.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Group filter */}
      {groups.length > 0 && (
        <>
          <div className="w-px h-4 bg-[#E2E6ED] dark:bg-[#21262D]" />
          <select
            value={selectedGroup}
            onChange={(e) => onGroup(e.target.value)}
            className={cn(
              "text-[11px] font-medium rounded-lg px-2 py-1 border-0 outline-none",
              "bg-transparent text-[#64748B] dark:text-[#64748B]",
              "cursor-pointer",
              selectedGroup !== "all" &&
                "text-indigo-600 dark:text-indigo-400 font-semibold",
            )}
          >
            <option value="all">All Groups</option>
            {groups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Clear */}
      {hasActive && (
        <button
          onClick={onClear}
          className="ml-auto flex items-center gap-1 text-[11px] text-[#94A3B8] hover:text-[#F43F5E] transition-colors duration-[250ms]"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // ── Data state ────────────────────────────────────────────────────────────
  const [allReminders, setAllReminders] = useState<Reminder[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  // ── Modal state ───────────────────────────────────────────────────────────
  const [createReminderOpen, setCreateReminderOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  // ── Greeting ──────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "there";

  // ── Fetch all data ────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [remResult, grpData, actResult, notifResult] =
        await Promise.allSettled([
          reminderService.getReminders({ limit: 200 }),
          groupService.getGroups(),
          activityService.getUserActivity({ limit: 10 }),
          notificationService.getNotifications({ limit: 1 }),
        ]);

      if (remResult.status === "fulfilled")
        setAllReminders(remResult.value.reminders);
      if (grpData.status === "fulfilled") setGroups(grpData.value);
      if (actResult.status === "fulfilled") setActivity(actResult.value.logs);
      if (notifResult.status === "fulfilled")
        setUnreadCount(notifResult.value.unreadCount);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Filtered reminders ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return allReminders.filter((r) => {
      // Group filter
      if (groupFilter !== "all") {
        const gId = typeof r.groupId === "object" ? r.groupId?._id : r.groupId;
        if (gId !== groupFilter) return false;
      }
      // Priority filter
      if (priorityFilter !== "all" && r.priority !== priorityFilter)
        return false;
      // Time filter — applies to dueDateTime
      if (!isInPeriod(r.dueDateTime, timeFilter)) return false;
      return true;
    });
  }, [allReminders, groupFilter, priorityFilter, timeFilter]);

  // ── Stats derived from filtered set ──────────────────────────────────────
  const stats = useMemo<DashStats>(() => {
    const pending = filtered.filter((r) => r.status === "PENDING").length;
    const completed = filtered.filter((r) => r.status === "COMPLETED").length;
    const overdue = filtered.filter(
      (r) => r.status === "OVERDUE" || isOverdue(r.dueDateTime, r.status),
    ).length;
    const total = filtered.length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const todayStart = startOfDay();
    const todayEnd = startOfDay(1);
    const weekEnd = startOfDay(7);

    const dueTodayCount = allReminders.filter(
      (r) =>
        r.status === "PENDING" &&
        new Date(r.dueDateTime) >= todayStart &&
        new Date(r.dueDateTime) < todayEnd,
    ).length;

    const dueWeekCount = allReminders.filter(
      (r) =>
        r.status === "PENDING" &&
        new Date(r.dueDateTime) >= todayStart &&
        new Date(r.dueDateTime) < weekEnd,
    ).length;

    return {
      pending,
      completed,
      overdue,
      total,
      completionPct,
      dueTodayCount,
      dueWeekCount,
      groupCount: groups.length,
      unreadNotif: unreadCount,
    };
  }, [filtered, allReminders, groups, unreadCount]);

  // ── Upcoming reminders (next 7 days, pending only, from unfiltered) ───────
  const upcoming = useMemo(() => {
    const now = new Date();
    const week = startOfDay(7);
    return allReminders
      .filter(
        (r) =>
          r.status === "PENDING" &&
          new Date(r.dueDateTime) >= now &&
          new Date(r.dueDateTime) < week,
      )
      .sort(
        (a, b) =>
          new Date(a.dueDateTime).getTime() - new Date(b.dueDateTime).getTime(),
      )
      .slice(0, 5);
  }, [allReminders]);

  // ── Overdue (from unfiltered, for alert banner) ───────────────────────────
  const overdueReminders = useMemo(() => {
    return allReminders.filter(
      (r) =>
        r.status === "OVERDUE" ||
        (r.status === "PENDING" && isOverdue(r.dueDateTime, r.status)),
    );
  }, [allReminders]);

  // ── Weekly bar chart data (completions per day) ───────────────────────────
  const weekBarData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun
    return days.map((label, i) => {
      const offset = i - ((dayOfWeek + 6) % 7); // Align to current week starting Mon
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + offset);
      const dayStr = targetDate.toDateString();
      const count = allReminders.filter(
        (r) =>
          r.status === "COMPLETED" &&
          r.completedAt &&
          new Date(r.completedAt).toDateString() === dayStr,
      ).length;
      return { label, value: count, max: 0 };
    });
  }, [allReminders]);

  const barMax = Math.max(...weekBarData.map((d) => d.value), 1);
  const barDataWithMax = weekBarData.map((d) => ({ ...d, max: barMax }));

  // ── Active filters ────────────────────────────────────────────────────────
  const hasActiveFilter =
    timeFilter !== "week" || priorityFilter !== "all" || groupFilter !== "all";
  const clearFilters = () => {
    setTimeFilter("week");
    setPriorityFilter("all");
    setGroupFilter("all");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-[#94A3B8]">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[22px] md:text-[28px] font-semibold tracking-wide leading-snug text-[#0F172A] dark:text-[#F0F6FC]">
              {greeting}, {firstName}!
            </h2>
            <p className="text-sm text-[#94A3B8] mt-0.5">
              {stats.dueTodayCount > 0
                ? `You have ${stats.dueTodayCount} reminder${stats.dueTodayCount > 1 ? "s" : ""} due today.`
                : "You're all caught up for today 🎉"}
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => navigate(ROUTES.NOTIFICATIONS)}
                className={cn(
                  "relative flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium",
                  "border border-[#E2E6ED] dark:border-[#21262D]",
                  "bg-white dark:bg-[#161B22] text-[#475569] dark:text-[#8B949E]",
                  "hover:border-[#C8CDD8] dark:hover:border-[#30363D] transition-all duration-[250ms]",
                )}
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F43F5E] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </button>
            )}
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Users className="w-3.5 h-3.5" />}
              onClick={() => setCreateGroupOpen(true)}
            >
              New Group
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setCreateReminderOpen(true)}
            >
              New Reminder
            </Button>
          </div>
        </div>

        {/* ── Overdue alert banner ─────────────────────────────────────────── */}
        {overdueReminders.length > 0 && (
          <div
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border",
              "bg-[#FFF8F8] dark:bg-[rgba(244,63,94,0.06)]",
              "border-[#FECDD3] dark:border-[rgba(244,63,94,0.25)]",
            )}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.14)] text-[#F43F5E]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#BE123C] dark:text-[#FDA4AF]">
                {overdueReminders.length} overdue reminder
                {overdueReminders.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-[#F43F5E]/80 dark:text-[#FDA4AF]/80 truncate">
                {overdueReminders
                  .slice(0, 2)
                  .map((r) => r.title)
                  .join(", ")}
                {overdueReminders.length > 2 &&
                  ` +${overdueReminders.length - 2} more`}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(ROUTES.REMINDERS)}
            >
              View all
            </Button>
          </div>
        )}

        {/* ── Filter bar ───────────────────────────────────────────────────── */}
        <FilterBar
          groups={groups}
          selectedGroup={groupFilter}
          selectedPriority={priorityFilter}
          selectedTime={timeFilter}
          onGroup={setGroupFilter}
          onPriority={setPriorityFilter}
          onTime={setTimeFilter}
          onClear={clearFilters}
          hasActive={hasActiveFilter}
        />

        {/* ── Stat cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={Clock}
            color="text-indigo-600 dark:text-indigo-400"
            bg="bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)]"
            border="border-[#E2E6ED] dark:border-[#21262D] hover:border-indigo-200 dark:hover:border-[rgba(99,102,241,0.30)]"
            glow="hover:shadow-[0_4px_20px_rgba(79,70,229,0.10)] dark:hover:shadow-[0_4px_20px_rgba(99,102,241,0.18)]"
            trend={`${stats.dueWeekCount} due this week`}
            onClick={() => navigate(ROUTES.REMINDERS)}
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={CheckCircle2}
            color="text-teal-600 dark:text-teal-400"
            bg="bg-[#F0FDFA] dark:bg-[rgba(20,184,166,0.12)]"
            border="border-[#E2E6ED] dark:border-[#21262D] hover:border-teal-200 dark:hover:border-[rgba(20,184,166,0.30)]"
            glow="hover:shadow-[0_4px_20px_rgba(20,184,166,0.10)] dark:hover:shadow-[0_4px_20px_rgba(20,184,166,0.18)]"
            trend={`${stats.completionPct}% completion rate`}
            onClick={() => navigate(ROUTES.REMINDERS)}
          />
          <StatCard
            label="Overdue"
            value={stats.overdue}
            icon={AlertTriangle}
            color="text-[#F43F5E] dark:text-[#FB7185]"
            bg="bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)]"
            border="border-[#E2E6ED] dark:border-[#21262D] hover:border-[#FECDD3] dark:hover:border-[rgba(244,63,94,0.30)]"
            glow="hover:shadow-[0_4px_20px_rgba(244,63,94,0.10)] dark:hover:shadow-[0_4px_20px_rgba(244,63,94,0.18)]"
            trend={stats.overdue > 0 ? "Needs attention" : "Looking good!"}
            onClick={() => navigate(ROUTES.REMINDERS)}
          />
          <StatCard
            label="Groups"
            value={stats.groupCount}
            icon={Users}
            color="text-[#B45309] dark:text-[#FCD34D]"
            bg="bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.12)]"
            border="border-[#E2E6ED] dark:border-[#21262D] hover:border-amber-200 dark:hover:border-[rgba(245,158,11,0.30)]"
            glow="hover:shadow-[0_4px_20px_rgba(245,158,11,0.08)] dark:hover:shadow-[0_4px_20px_rgba(245,158,11,0.16)]"
            trend={`${groups.reduce((a, g) => a + g.members.length, 0)} total members`}
            onClick={() => navigate(ROUTES.GROUPS)}
          />
        </div>

        {/* ── Charts + Upcoming + Activity ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left: Completion donut + weekly bars ──────────────────────── */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Completion rate card */}
            <div className="rounded-xl border border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#161B22] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide">
                    Completion
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {timeFilter === "today"
                      ? "Today"
                      : timeFilter === "week"
                        ? "This week"
                        : timeFilter === "month"
                          ? "This month"
                          : "All time"}
                  </p>
                </div>
                <Target className="w-4 h-4 text-[#94A3B8]" />
              </div>
              <div className="flex items-center gap-6">
                <DonutChart pct={stats.completionPct} label="done" />
                <div className="flex-1 space-y-2.5">
                  {[
                    {
                      label: "Pending",
                      v: stats.pending,
                      color: "bg-indigo-600 dark:bg-indigo-400",
                    },
                    {
                      label: "Done",
                      v: stats.completed,
                      color: "bg-teal-500 dark:bg-teal-400",
                    },
                    {
                      label: "Overdue",
                      v: stats.overdue,
                      color: "bg-[#F43F5E] dark:bg-[#FB7185]",
                    },
                  ].map(({ label, v, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div
                        className={cn("w-2 h-2 rounded-full shrink-0", color)}
                      />
                      <span className="text-xs text-[#475569] dark:text-[#8B949E] flex-1">
                        {label}
                      </span>
                      <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F0F6FC]">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekly completions mini bar chart */}
            <div className="rounded-xl border border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#161B22] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide">
                    Weekly Activity
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Completions this week
                  </p>
                </div>
                <TrendingUp className="w-4 h-4 text-[#94A3B8]" />
              </div>
              <MiniBarChart data={barDataWithMax} />
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#161B22] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8]">
                    Due today
                  </span>
                </div>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    stats.dueTodayCount > 0
                      ? "text-[#B45309] dark:text-[#FCD34D]"
                      : "text-teal-600 dark:text-teal-400",
                  )}
                >
                  {stats.dueTodayCount}
                </p>
              </div>
              <div className="rounded-xl border border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#161B22] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8]">
                    This week
                  </span>
                </div>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stats.dueWeekCount}
                </p>
              </div>
            </div>
          </div>

          {/* ── Center: Upcoming reminders ───────────────────────────────── */}
          <div className="lg:col-span-1 rounded-xl border border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#161B22] p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide">
                  Upcoming
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">Next 7 days</p>
              </div>
              <button
                onClick={() => navigate(ROUTES.REMINDERS)}
                className="flex items-center gap-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {upcoming.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-6">
                  <div className="w-10 h-10 rounded-full bg-[#F0FDFA] dark:bg-[rgba(20,184,166,0.12)] flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500" />
                  </div>
                  <p className="text-sm font-medium text-[#0F172A] dark:text-[#F0F6FC]">
                    All clear!
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Nothing due this week
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 flex-1">
                {upcoming.map((r) => (
                  <UpcomingRow
                    key={r._id}
                    reminder={r}
                    onClick={() => navigate(ROUTES.REMINDERS)}
                  />
                ))}
                {stats.dueWeekCount > 5 && (
                  <button
                    onClick={() => navigate(ROUTES.REMINDERS)}
                    className="w-full text-center text-xs text-[#94A3B8] hover:text-indigo-600 dark:hover:text-indigo-400 py-2 transition-colors duration-[250ms]"
                  >
                    +{stats.dueWeekCount - 5} more reminders this week
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Groups + Activity feed ────────────────────────────── */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Groups summary */}
            {groups.length > 0 && (
              <div className="rounded-xl border border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#161B22] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide">
                    My Groups
                  </h3>
                  <button
                    onClick={() => navigate(ROUTES.GROUPS)}
                    className="flex items-center gap-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    All <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2.5">
                  {groups.slice(0, 3).map((g) => (
                    <button
                      key={g._id}
                      onClick={() => navigate(`${ROUTES.GROUPS}/${g._id}`)}
                      className="w-full flex items-center gap-3 hover:bg-[#F8FAFC] dark:hover:bg-[rgba(255,255,255,0.03)] rounded-lg p-2 -mx-2 transition-all duration-[250ms] group"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 bg-gradient-to-br from-indigo-600 to-teal-500">
                        {g.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-[#0F172A] dark:text-[#F0F6FC] truncate">
                          {g.name}
                        </p>
                        <p className="text-xs text-[#94A3B8]">
                          {g.members.length} member
                          {g.members.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#C8CDD8] dark:text-[#30363D] group-hover:translate-x-0.5 transition-transform duration-[250ms]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Activity feed */}
            <div className="flex-1 rounded-xl border border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#161B22] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide">
                    Recent Activity
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Your latest actions
                  </p>
                </div>
                <button
                  onClick={() => navigate(ROUTES.ACTIVITY)}
                  className="flex items-center gap-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  More <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {activity.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <EmptyState
                    icon={<Activity className="w-6 h-6" />}
                    title="No activity yet"
                    description="Actions you take will appear here."
                  />
                </div>
              ) : (
                <div className="space-y-3.5">
                  {activity.map((log) => (
                    <ActivityItem key={log._id} log={log} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Empty state for completely new users ─────────────────────────── */}
        {allReminders.length === 0 && groups.length === 0 && !isLoading && (
          <Card glass>
            <EmptyState
              icon={<LayoutDashboard className="w-8 h-8" />}
              title="Welcome to TeamTasks!"
              description="Create your first reminder or set up a group to start collaborating with your team."
              action={
                <div className="flex items-center gap-3 justify-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Users className="w-3.5 h-3.5" />}
                    onClick={() => setCreateGroupOpen(true)}
                  >
                    Create Group
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setCreateReminderOpen(true)}
                  >
                    Create Reminder
                  </Button>
                </div>
              }
            />
          </Card>
        )}
      </div>

      {/* Modals */}
      <CreateReminderModal
        isOpen={createReminderOpen}
        onClose={() => setCreateReminderOpen(false)}
      />
      <CreateGroupModal
        isOpen={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
      />
    </>
  );
};

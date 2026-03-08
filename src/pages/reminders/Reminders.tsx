/**
 * pages/reminders/Reminders.tsx
 *
 * STYLE DECISIONS (all traced to STYLES_README.md):
 *
 *  Surfaces    → bg-white dark:bg-[#161B22]  |  border #E2E6ED dark:#21262D
 *  Text        → primary #0F172A/#F0F6FC  |  secondary #475569/#8B949E  |  tertiary #94A3B8
 *  Brand       → Indigo-600 (#4F46E5) primary  |  Coral-500 (#F43F5E) danger/overdue
 *  Card radius → 12px (rounded-xl)  |  Card padding → 20px (p-5)
 *  Gap         → 20px (gap-5 / space-y-5)  |  Section padding → 40px/20px (handled by AppLayout)
 *  Shadows     → shadow-[0_2px_8px_rgba(15,23,42,0.06)] light  |  dark rgba(0,0,0,0.30)
 *  Glow shadow → rgba(79,70,229,0.25) indigo  |  rgba(244,63,94,0.20) coral
 *  Transitions → 250ms ease-in-out on ALL interactive states
 *  Typography  → font-medium tracking-wide for headings  |  text-xs for meta  |  text-[11px] uppercase for captions
 *  Status      → Use <Badge> component variants: pending / completed / overdue / high / medium / low
 *  Skeleton    → #EEF0F4 → #E2E6ED sweep (light)  |  #161B22 → #21262D (dark)
 */

import { useState } from "react";
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import { useReminders } from "../../hooks/useReminders";
import {
  Button,
  Badge,
  AvatarStack,
  Spinner,
  EmptyState,
  Card,
  FAB,
} from "../../components/ui";
import { cn } from "../../utils/cn";
import { formatDueDate, isOverdue } from "../../utils/formatDate";
import type { Reminder, ReminderStatus, Priority } from "../../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: ReminderStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Overdue", value: "OVERDUE" },
];

const PRIORITY_OPTIONS: { label: string; value: Priority | "ALL" }[] = [
  { label: "All Priority", value: "ALL" },
  { label: "High", value: "HIGH" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Low", value: "LOW" },
];

// ─────────────────────────────────────────────────────────────────────────────
// REMINDER CARD
// ─────────────────────────────────────────────────────────────────────────────

interface ReminderCardProps {
  reminder: Reminder;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  isCompleting: boolean;
  isDeleting: boolean;
}

function ReminderCard({
  reminder,
  onComplete,
  onDelete,
  isCompleting,
  isDeleting,
}: ReminderCardProps) {
  const overdue = isOverdue(reminder.dueDateTime, reminder.status);
  const isDone = reminder.status === "COMPLETED";

  const statusVariant: Record<
    ReminderStatus,
    "pending" | "completed" | "overdue"
  > = {
    PENDING: "pending",
    COMPLETED: "completed",
    OVERDUE: "overdue",
  };

  const priorityVariant: Record<Priority, "high" | "medium" | "low"> = {
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
  };

  return (
    <article
      className={cn(
        // ── Layout ──────────────────────────────────────────────────────────────
        "group relative flex items-start gap-4 p-5 rounded-xl border",

        // ── Transition — 250ms per spec §7.1 ────────────────────────────────────
        "transition-all duration-[250ms] ease-in-out",

        // ── Surface colors — §2.1 / §2.2 ────────────────────────────────────────
        // Normal card
        !overdue && "bg-white dark:bg-[#161B22]",
        !overdue && "border-[#E2E6ED] dark:border-[#21262D]",

        // Overdue card gets coral tint — §2.5 Overdue status colors
        overdue && "bg-[#FFF8F8] dark:bg-[rgba(244,63,94,0.06)]",
        overdue && "border-[#FECDD3] dark:border-[rgba(244,63,94,0.28)]",

        // ── Shadow — §6 shadow-card ──────────────────────────────────────────────
        "shadow-[0_2px_8px_rgba(15,23,42,0.06),0_0_1px_rgba(15,23,42,0.08)]",
        "dark:shadow-[0_2px_8px_rgba(0,0,0,0.30),0_0_1px_rgba(255,255,255,0.04)]",

        // ── Hover — §9.1 Interactive hover ──────────────────────────────────────
        !isDone &&
          !overdue && [
            "hover:-translate-y-0.5",
            "hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
            "hover:shadow-[0_6px_16px_rgba(15,23,42,0.08),0_0_1px_rgba(15,23,42,0.08)]",
            "dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.45)]",
          ],
        overdue &&
          !isDone && [
            "hover:-translate-y-0.5",
            "hover:shadow-[0_6px_16px_rgba(244,63,94,0.14)] dark:hover:shadow-[0_6px_16px_rgba(244,63,94,0.22)]",
          ],
      )}
    >
      {/* ── Complete toggle ─────────────────────────────────────────────────── */}
      <button
        onClick={() => !isDone && onComplete(reminder._id)}
        disabled={isDone || isCompleting}
        className={cn(
          "mt-0.5 shrink-0 transition-all duration-[250ms]",
          isDone
            ? // Done: emerald checkmark — §2.5 completed dot color
              "text-emerald-500 cursor-default"
            : // Idle: muted border color → indigo on hover — §2.3 indigo-600
              "text-[#C8CDD8] dark:text-[#30363D] hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-110",
          "disabled:opacity-50",
        )}
      >
        {isCompleting ? (
          <Spinner size="sm" />
        ) : isDone ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Title + status badge */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h3
            className={cn(
              // §3.2 Body strong — font-medium, tracking-wide
              "font-medium text-sm leading-snug tracking-wide",
              isDone
                ? // Completed: strikethrough + tertiary color — §3.3
                  "line-through text-[#94A3B8] dark:text-[#484F58]"
                : // Normal: primary text — §3.3
                  "text-[#0F172A] dark:text-[#F0F6FC]",
            )}
          >
            {reminder.title}
          </h3>

          {/* Status badge — §9.4 Badges / Status Pills */}
          <Badge variant={statusVariant[reminder.status]}>
            {reminder.status.charAt(0) + reminder.status.slice(1).toLowerCase()}
          </Badge>
        </div>

        {/* Description — §3.3 text-secondary */}
        {reminder.description && (
          <p className="mt-1.5 text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
            {reminder.description}
          </p>
        )}

        {/* ── Meta row ──────────────────────────────────────────────────────── */}
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          {/* Due date — overdue gets coral, normal gets tertiary §3.3 */}
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              overdue
                ? "text-[#BE123C] dark:text-[#FDA4AF]" // §2.5 overdue text
                : "text-[#94A3B8]", // §3.3 tertiary
            )}
          >
            {overdue ? (
              <AlertTriangle className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {formatDueDate(reminder.dueDateTime)}
          </span>

          {/* Priority badge — §9.4 */}
          <Badge variant={priorityVariant[reminder.priority]} dot={false}>
            {reminder.priority}
          </Badge>

          {/* Group pill — §3.3 text-link indigo, caption style */}
          {reminder.groupId && (
            <span
              className={cn(
                // Caption — §3.2 text-[11px] uppercase tracking-widest
                "inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-widest",
                // §2.3 indigo link color
                "text-indigo-600 dark:text-indigo-400",
                // §2.5 pending bg tint
                "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)] px-2 py-0.5 rounded-full",
              )}
            >
              <Tag className="w-2.5 h-2.5" />
              {reminder.groupId.name}
            </span>
          )}

          {/* Assignee avatars — §9.5 avatar-stack */}
          {reminder.assignedUsers.length > 0 && (
            <div className="ml-auto">
              <AvatarStack users={reminder.assignedUsers} max={3} size="xs" />
            </div>
          )}
        </div>
      </div>

      {/* ── Delete — fade in on group hover — §7.3 micro-interaction ───────── */}
      <button
        onClick={() => onDelete(reminder._id)}
        disabled={isDeleting}
        className={cn(
          "shrink-0 mt-0.5 p-1.5 rounded-lg",
          // Starts invisible, appears on card hover
          "opacity-0 group-hover:opacity-100 transition-all duration-[250ms]",
          // Default muted, goes coral on hover — §2.3 Coral-500
          "text-[#C8CDD8] dark:text-[#30363D]",
          "hover:bg-[#FFF1F2] dark:hover:bg-[rgba(244,63,94,0.12)]",
          "hover:text-[#F43F5E]",
          "disabled:opacity-50",
        )}
      >
        {isDeleting ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON LOADER — §9.12
// Colors: surface-sunken → border-default sweep
// ─────────────────────────────────────────────────────────────────────────────

function ReminderSkeleton() {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-5 rounded-xl border",
        // §2.1 / §2.2 surface colors
        "bg-white dark:bg-[#161B22]",
        "border-[#E2E6ED] dark:border-[#21262D]",
      )}
    >
      {/* Circle placeholder */}
      <div className="w-5 h-5 rounded-full mt-0.5 shrink-0 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />

      <div className="flex-1 space-y-2.5">
        {/* Title line — 3/4 width */}
        <div className="h-3.5 rounded-md w-3/4 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
        {/* Description line — 1/2 width */}
        <div className="h-2.5 rounded-md w-1/2 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
        {/* Meta row */}
        <div className="flex gap-3 pt-0.5">
          <div className="h-2.5 rounded-md w-24 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
          <div className="h-2.5 rounded-full w-14 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export const RemindersPage = () => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<ReminderStatus | "ALL">(
    "ALL",
  );
  const [activePriority, setActivePriority] = useState<Priority | "ALL">("ALL");

  const {
    reminders,
    pagination,
    isLoading,
    error,
    setFilters,
    complete,
    remove,
  } = useReminders();

  const handleStatusChange = (status: ReminderStatus | "ALL") => {
    setActiveStatus(status);
    setFilters({ status: status === "ALL" ? undefined : status, page: 1 });
  };

  const handlePriorityChange = (priority: Priority | "ALL") => {
    setActivePriority(priority);
    setFilters({
      priority: priority === "ALL" ? undefined : priority,
      page: 1,
    });
  };

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    await complete(id);
    setCompletingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this reminder? This cannot be undone.")) return;
    setDeletingId(id);
    await remove(id);
    setDeletingId(null);
  };

  const handlePageChange = (page: number) => {
    setFilters({ page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      {/* §3.2 H2 size: 28px desktop / 22px mobile  |  §3.3 secondary for subtitle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            className={cn(
              "font-semibold tracking-wide leading-snug",
              // §3.2 H2: 28px desktop / 22px mobile
              "text-[22px] md:text-[28px]",
              // §3.3 text-primary
              "text-[#0F172A] dark:text-[#F0F6FC]",
            )}
          >
            My Reminders
          </h2>
          {/* §3.3 text-tertiary for subtitle/meta */}
          <p className="text-sm text-[#94A3B8] mt-0.5">
            {pagination
              ? `${pagination.total} reminder${pagination.total !== 1 ? "s" : ""} total`
              : "Manage your tasks and deadlines"}
          </p>
        </div>

        {/* Primary CTA — §9.2 Primary button: gradient indigo→teal */}
        <Button leftIcon={<Plus className="w-4 h-4" />} size="md">
          New Reminder
        </Button>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status tab group */}
        {/* Pill container: surface card styling §9.1 */}
        <div
          className={cn(
            "flex items-center p-1 gap-0.5 rounded-xl",
            "bg-white dark:bg-[#161B22]",
            "border border-[#E2E6ED] dark:border-[#21262D]",
            "shadow-[0_1px_3px_rgba(15,23,42,0.06)]",
          )}
        >
          {STATUS_TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleStatusChange(value)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-medium rounded-lg",
                // §7.1 — 250ms transition
                "transition-all duration-[250ms] ease-in-out",
                activeStatus === value
                  ? // Active: gradient fill per §9.2 Primary button
                    "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-sm shadow-indigo-500/25"
                  : // Inactive: ghost style per §9.2
                    "text-[#475569] dark:text-[#8B949E] hover:text-[#0F172A] dark:hover:text-[#F0F6FC] hover:bg-black/5 dark:hover:bg-white/5",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Priority select — input styling §9.3 */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
          <select
            value={activePriority}
            onChange={(e) =>
              handlePriorityChange(e.target.value as Priority | "ALL")
            }
            className={cn(
              // §9.3 Input: height 44px → h-9 for compact filter
              "h-9 px-3 text-xs rounded-lg",
              // §2.1/2.2 surface colors
              "bg-white dark:bg-[#161B22]",
              "border border-[#E2E6ED] dark:border-[#21262D]",
              // §3.3 text colors
              "text-[#475569] dark:text-[#8B949E]",
              // §7.3 Input focus: indigo border + glow ring
              "focus:outline-none focus:border-indigo-600 dark:focus:border-[#818CF8]",
              "focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]",
              "transition-all duration-[250ms] cursor-pointer",
            )}
          >
            {PRIORITY_OPTIONS.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Result count — §3.2 Caption style: 11px uppercase */}
        {!isLoading && reminders.length > 0 && (
          <span
            className={cn(
              "ml-auto text-[11px] font-medium uppercase tracking-widest",
              "text-[#94A3B8]",
              // §2.1 surface-sunken for pill bg
              "bg-[#EEF0F4] dark:bg-[#21262D] px-2.5 py-1 rounded-full",
            )}
          >
            {reminders.length} shown
          </span>
        )}
      </div>

      {/* ── Error — §2.5 overdue colors ───────────────────────────────────── */}
      {error && (
        <div
          className={cn(
            "flex items-start gap-3 p-4 rounded-xl text-sm",
            "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)]",
            "border border-[#FECDD3] dark:border-[rgba(244,63,94,0.28)]",
            "text-[#BE123C] dark:text-[#FDA4AF]",
          )}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {isLoading ? (
        // §9.12 Skeleton
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <ReminderSkeleton key={i} />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        // §12 Empty state
        <Card>
          <EmptyState
            icon={<CheckCircle2 className="w-8 h-8" />}
            title="No reminders found"
            description={
              activeStatus === "ALL"
                ? "You're all caught up! Create your first reminder to get started."
                : `No ${activeStatus.toLowerCase()} reminders right now.`
            }
            action={
              <Button leftIcon={<Plus className="w-4 h-4" />} size="sm">
                Create Reminder
              </Button>
            }
          />
        </Card>
      ) : (
        // Reminder list — gap-3 between cards per §4 space-gap
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder._id}
              reminder={reminder}
              onComplete={handleComplete}
              onDelete={handleDelete}
              isCompleting={completingId === reminder._id}
              isDeleting={deletingId === reminder._id}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div
          className={cn(
            "flex items-center justify-between",
            // §14 .divider: border-top
            "border-t border-[#E2E6ED] dark:border-[#21262D] pt-4 mt-2",
          )}
        >
          {/* §3.3 text-tertiary for page info */}
          <p className="text-xs text-[#94A3B8]">
            Page{" "}
            <span className="font-medium text-[#475569] dark:text-[#8B949E]">
              {pagination.page}
            </span>{" "}
            of{" "}
            <span className="font-medium text-[#475569] dark:text-[#8B949E]">
              {pagination.totalPages}
            </span>
          </p>

          <div className="flex items-center gap-2">
            {/* §9.2 Secondary button */}
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              disabled={pagination.page === 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              disabled={pagination.page === pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ── FAB — mobile only, above bottom nav §9.2 FAB ─────────────────── */}
      <FAB
        onClick={() => {}}
        icon={<Plus className="w-6 h-6" />}
        label="New Reminder"
      />
    </div>
  );
};

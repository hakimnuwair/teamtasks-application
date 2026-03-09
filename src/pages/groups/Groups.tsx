/**
 * pages/groups/Groups.tsx — Groups list page
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Users,
  Search,
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  CheckSquare,
} from "lucide-react";
import { cn } from "../../utils/cn";
import {
  Button,
  AvatarStack,
  EmptyState,
  Card,
  FAB,
} from "../../components/ui";
import { CreateGroupModal } from "../../components/modal/CreateGroupModal";
import { useGroups } from "../../hooks/useGroups";
import type { Group, GroupRole } from "../../types/types";

// ── Role badge ────────────────────────────────────────────────────────────────
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
  const { icon: Icon, label, cls } = ROLE_CFG[role];
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

// ── Group card ────────────────────────────────────────────────────────────────
function GroupCard({ group }: { group: Group }) {
  const navigate = useNavigate();
  const myRole = (group.members[0]?.role ?? "MEMBER") as GroupRole;

  return (
    <article
      onClick={() => navigate(`/groups/${group._id}`)}
      className={cn(
        "group relative rounded-xl border p-5 overflow-hidden cursor-pointer",
        "bg-white/60 dark:bg-[rgba(22,27,34,0.72)] backdrop-blur-xl",
        "border-white/45 dark:border-[rgba(255,255,255,0.06)]",
        "shadow-[0_8px_32px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.60)]",
        "dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)]",
        "hover:-translate-y-0.5 hover:border-[rgba(79,70,229,0.25)] dark:hover:border-[rgba(99,102,241,0.30)]",
        "hover:shadow-[0_12px_28px_rgba(15,23,42,0.10),0_0_0_1px_rgba(79,70,229,0.12)]",
        "dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.50),0_0_0_1px_rgba(99,102,241,0.20)]",
        "transition-all duration-[250ms] ease-in-out",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 bg-gradient-to-br from-indigo-600 to-teal-500 shadow-[0_4px_12px_rgba(79,70,229,0.28)]">
          {group.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm tracking-wide truncate text-[#0F172A] dark:text-[#F0F6FC]">
            {group.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <RoleBadge role={myRole} />
            <span className="inline-flex items-center gap-0.5 text-[10px] text-[#94A3B8]">
              <Lock className="w-2.5 h-2.5" />
              Private
            </span>
          </div>
        </div>
      </div>

      {group.description && (
        <p className="text-xs text-[#475569] dark:text-[#8B949E] leading-relaxed line-clamp-2 mb-4">
          {group.description}
        </p>
      )}

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium uppercase tracking-widest text-[#94A3B8]">
            Progress
          </span>
          <span className="text-[11px] font-semibold text-[#475569] dark:text-[#8B949E]">
            0%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[#EEF0F4] dark:bg-[#21262D]">
          <div className="h-full w-0 rounded-full bg-gradient-to-r from-indigo-600 to-teal-500" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AvatarStack
            users={group.members.map((m) => ({
              _id: m.userId._id,
              name: m.userId.name,
            }))}
            max={4}
            size="xs"
          />
          <span className="text-[11px] text-[#94A3B8]">
            {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
          </span>
        </div>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)] text-[#4338CA] dark:text-[#A5B4FC]">
          0 pending
        </span>
      </div>

      {/* Slide-up CTA */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-10 flex items-center justify-center gap-1.5",
          "bg-gradient-to-r from-indigo-600/90 to-teal-500/90 text-white text-xs font-semibold tracking-wide",
          "translate-y-full group-hover:translate-y-0 transition-transform duration-[250ms] ease-in-out",
        )}
      >
        Open Group <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </article>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function GroupSkeleton() {
  return (
    <div className="rounded-xl border p-5 bg-white dark:bg-[#161B22] border-[#E2E6ED] dark:border-[#21262D]">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl shrink-0 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 rounded-md w-1/2 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
          <div className="h-2.5 rounded-full w-1/4 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-2.5 rounded-md w-full animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
        <div className="h-2.5 rounded-md w-3/4 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
      </div>
      <div className="h-1.5 rounded-full animate-pulse bg-[#EEF0F4] dark:bg-[#21262D] mb-4" />
      <div className="flex justify-between">
        <div className="h-2.5 rounded-md w-24 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
        <div className="h-2.5 rounded-md w-16 animate-pulse bg-[#EEF0F4] dark:bg-[#21262D]" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export const GroupsPage = () => {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { groups, isLoading } = useGroups();

  const filtered = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[22px] md:text-[28px] font-semibold tracking-wide leading-snug text-[#0F172A] dark:text-[#F0F6FC]">
              Groups
            </h2>
            <p className="text-sm text-[#94A3B8] mt-0.5">
              Collaborate with your team on shared reminders
            </p>
          </div>
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Create Group
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {
              label: "My Groups",
              value: groups.length,
              icon: Users,
              color: "text-indigo-600 dark:text-indigo-400",
              bg: "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)]",
            },
            {
              label: "Members",
              value: groups.reduce((a, g) => a + g.memberCount, 0),
              icon: Users,
              color: "text-teal-600 dark:text-teal-400",
              bg: "bg-[#F0FDFA] dark:bg-[rgba(20,184,166,0.12)]",
            },
            {
              label: "Tasks",
              value: 0,
              icon: CheckSquare,
              color: "text-[#B45309] dark:text-[#FCD34D]",
              bg: "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.12)]",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="rounded-xl p-5 bg-white/82 dark:bg-[rgba(28,35,51,0.92)] backdrop-blur-xl border border-white/45 dark:border-[rgba(255,255,255,0.06)] shadow-[0_8px_32px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.60)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-widest text-[#94A3B8] mb-1.5">
                    {label}
                  </p>
                  <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F0F6FC]">
                    {value}
                  </p>
                </div>
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    bg,
                    color,
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#C8CDD8] dark:via-[#30363D] to-transparent" />

        {/* Section header + search */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide">
              Your Groups
            </h3>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#94A3B8] mt-0.5">
              {filtered.length} group{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
            <input
              type="text"
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-white/82 dark:bg-[rgba(13,17,23,0.90)] backdrop-blur-sm text-[#0F172A] dark:text-[#F0F6FC] placeholder:text-[#94A3B8] border-[1.5px] border-[#E2E6ED] dark:border-[#21262D] focus:outline-none focus:border-indigo-600 dark:focus:border-[#818CF8] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] hover:border-[#C8CDD8] dark:hover:border-[#30363D] transition-all duration-[250ms]"
            />
          </div>
        </div>

        {/* Grid / empty / skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <GroupSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title={search ? "No groups match your search" : "No groups yet"}
              description={
                search
                  ? `No results for "${search}".`
                  : "Create a group to start collaborating with your team."
              }
              action={
                !search ? (
                  <Button
                    leftIcon={<Plus className="w-4 h-4" />}
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                  >
                    Create Group
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((g) => (
              <GroupCard key={g._id} group={g} />
            ))}
          </div>
        )}
      </div>

      <FAB
        onClick={() => setCreateOpen(true)}
        icon={<Plus className="w-6 h-6" />}
        label="Create Group"
      />
      <CreateGroupModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
};

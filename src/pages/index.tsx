/**
 * pages/index.tsx — Placeholder pages
 * Replace each with a real implementation as you build features.
 * The layout (sidebar, topbar, dark mode, responsiveness) is already handled by AppLayout.
 * Just build the page content here.
 */

import { Card, SectionHeader, Button, EmptyState } from "../components/ui";
import {
  Plus,
  LayoutDashboard,
  Users,
  Bell,
  Activity,
  User,
} from "lucide-react";

// ── Dashboard ────────────────────────────────────────────────────────────────
export const DashboardPage = () => (
  <div className="space-y-6">
    <SectionHeader
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening."
    />

    {/* Stat cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {[
        {
          label: "Pending",
          count: 0,
          color: "text-indigo-600 dark:text-indigo-400",
          bg: "bg-indigo-50 dark:bg-indigo-500/12",
        },
        {
          label: "Completed",
          count: 0,
          color: "text-emerald-600 dark:text-emerald-400",
          bg: "bg-emerald-50 dark:bg-emerald-500/12",
        },
        {
          label: "Overdue",
          count: 0,
          color: "text-coral-600 dark:text-coral-400",
          bg: "bg-[#FFF1F2] dark:bg-coral-500/12",
        },
        {
          label: "Groups",
          count: 0,
          color: "text-teal-600 dark:text-teal-400",
          bg: "bg-teal-50 dark:bg-teal-500/12",
        },
      ].map(({ label, count, color, bg }) => (
        <Card key={label} glass className="text-center">
          <div className={`text-3xl font-bold mb-1 ${color}`}>{count}</div>
          <div className="text-xs text-[#94A3B8] uppercase tracking-widest">
            {label}
          </div>
        </Card>
      ))}
    </div>

    {/* Coming soon */}
    <Card>
      <EmptyState
        icon={<LayoutDashboard className="w-8 h-8" />}
        title="Dashboard coming soon"
        description="Build out charts, activity feed, and quick actions here."
        action={
          <Button size="sm" variant="outline">
            View Reminders
          </Button>
        }
      />
    </Card>
  </div>
);

// ── Groups ───────────────────────────────────────────────────────────────────
export const GroupsPage = () => (
  <div className="space-y-6">
    <SectionHeader
      title="Groups"
      subtitle="Collaborate with your team"
      action={
        <Button leftIcon={<Plus className="w-4 h-4" />}>Create Group</Button>
      }
    />
    <Card>
      <EmptyState
        icon={<Users className="w-8 h-8" />}
        title="No groups yet"
        description="Create a group to collaborate with your team on shared reminders."
        action={
          <Button leftIcon={<Plus className="w-4 h-4" />} size="sm">
            Create Group
          </Button>
        }
      />
    </Card>
  </div>
);

// ── Group Detail ─────────────────────────────────────────────────────────────
export const GroupDetailPage = () => (
  <div className="space-y-6">
    <SectionHeader title="Group Detail" />
    <Card>
      <EmptyState
        icon={<Users className="w-8 h-8" />}
        title="Group detail coming soon"
        description="View members, reminders, and activity for this group."
      />
    </Card>
  </div>
);

// ── Notifications ─────────────────────────────────────────────────────────────
export const NotificationsPage = () => (
  <div className="space-y-6">
    <SectionHeader title="Notifications" subtitle="Stay up to date" />
    <Card>
      <EmptyState
        icon={<Bell className="w-8 h-8" />}
        title="All caught up!"
        description="No new notifications. Actions and reminders will appear here."
      />
    </Card>
  </div>
);

// ── Activity ─────────────────────────────────────────────────────────────────
export const ActivityPage = () => (
  <div className="space-y-6">
    <SectionHeader
      title="Activity Log"
      subtitle="Everything that happened in your workspace"
    />
    <Card>
      <EmptyState
        icon={<Activity className="w-8 h-8" />}
        title="No activity yet"
        description="Actions you and your team take will appear here as a timeline."
      />
    </Card>
  </div>
);

// ── Profile ──────────────────────────────────────────────────────────────────
export const ProfilePage = () => (
  <div className="space-y-6">
    <SectionHeader title="Profile" subtitle="Manage your account settings" />
    <Card>
      <EmptyState
        icon={<User className="w-8 h-8" />}
        title="Profile coming soon"
        description="Edit your name, email, password, and preferences here."
      />
    </Card>
  </div>
);

// ── Register ─────────────────────────────────────────────────────────────────
export const RegisterPage = () => (
  <div className="text-center text-sm text-[#94A3B8] py-8">
    Register page coming soon
  </div>
);

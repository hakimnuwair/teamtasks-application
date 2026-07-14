/**
 * pages/Landing.tsx
 *
 * Public entry point at "/" for unauthenticated visitors (see
 * components/common/HomeRoute.tsx for the auth-aware gate that renders
 * this instead of bouncing straight to Login).
 *
 * Deliberately reuses the app's real design system (Button/Card/Badge/
 * Avatar from components/ui, the same gradient/font/color tokens) so this
 * reads as the front door of the actual product, not a bolted-on marketing
 * site. Preview visuals below are built from real UI primitives rather than
 * screenshots — they stay in sync with the app's actual look automatically
 * and there's nothing to go stale or 404.
 */
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  ArrowRight,
  Users,
  ListChecks,
  Sparkles,
  Bell,
  ShieldCheck,
  Database,
  Zap,
  Activity,
  Moon,
  SunMedium,
  CheckCircle2,
  Circle,
  Trash2,
} from "lucide-react";
import { Button, Card, Badge, Avatar } from "../components/ui";
import { useUIStore } from "../store/uiStore";
import { ROUTES } from "../config/routes";
import { cn } from "../utils/cn";

const TECH_STACK = [
  "React",
  "TypeScript",
  "Node.js",
  "Express",
  "MongoDB",
  "Socket.io",
  "Gemini AI",
];

const ENGINEERING_POINTS: {
  icon: React.ElementType;
  label: string;
  desc: string;
}[] = [
  {
    icon: ShieldCheck,
    label: "Role-based permissions",
    desc: "Every action is authorized server-side — assignee-only task completion, admin-only invites — never just hidden in the UI.",
  },
  {
    icon: Database,
    label: "Transactional data integrity",
    desc: "Multi-step writes, like cascading sub-task deletes, run inside MongoDB sessions so they never leave data half-updated.",
  },
  {
    icon: Zap,
    label: "Real-time architecture",
    desc: "Socket.io events are scoped to the users involved, not broadcast to everyone — updates arrive instantly without noise.",
  },
  {
    icon: Sparkles,
    label: "A reviewed AI pipeline",
    desc: "AI drafts sub-tasks in a separate, read-only step — nothing is written to the database until a person confirms it.",
  },
  {
    icon: Activity,
    label: "Full activity audit trail",
    desc: "Every create, update, and completion is logged against the user and the group it happened in.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LOGO MARK — same treatment as AuthLayout, reused for brand consistency
// ─────────────────────────────────────────────────────────────────────────────

function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  // "md" (the Nav's logo) is itself responsive: compact below sm so it never
  // competes with the nav's controls for space, full size at sm+ (matches
  // its original, unchanged appearance from sm+ upward). "sm" (the Footer's
  // logo) has no such constraint and stays fixed at its one compact size.
  const box =
    size === "sm" ? "w-6 h-6 rounded-md" : "w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg";
  const icon = size === "sm" ? "w-3.5 h-3.5" : "w-3.5 h-3.5 sm:w-4 sm:h-4";
  const text = size === "sm" ? "text-sm" : "text-sm sm:text-lg";
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <div
        className={cn(
          box,
          "bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center shadow-md shadow-indigo-500/30 shrink-0",
        )}
      >
        <Clock className={cn(icon, "text-white")} />
      </div>
      <span
        className={cn(
          text,
          "font-bold text-[#0F172A] dark:text-[#F0F6FC] tracking-tight",
        )}
      >
        Team
        <span className="bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
          Tasks
        </span>
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────────────────────

function LandingNav() {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useUIStore();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-[#0D1117]/70 border-b border-[#E2E6ED] dark:border-[#21262D]">
      {/*
        flex-wrap + min-h (instead of a fixed h) is a deliberate safety net,
        not the primary fix: the primary fix is the compaction below (smaller
        logo/toggle/button padding below sm, restored to full size at sm+, so
        the row fits on one line the same way it always did from sm+ up).
        flex-wrap just guarantees that if some device/font combination is
        ever a few px tighter than expected, the row gracefully drops to a
        second line instead of ever overflowing horizontally — nothing is
        hidden, everything stays reachable and visible at every width.
      */}
      <div className="max-w-6xl mx-auto px-4 sm:px-5 md:px-8 min-h-18 py-2 sm:py-0 flex flex-wrap items-center justify-between gap-y-2">
        <Logo />

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#475569] dark:text-[#8B949E]">
          <a
            href="#features"
            className="hover:text-[#0F172A] dark:hover:text-[#F0F6FC] transition-colors"
          >
            Features
          </a>
          <a
            href="#engineering"
            className="hover:text-[#0F172A] dark:hover:text-[#F0F6FC] transition-colors"
          >
            Engineering
          </a>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={toggleDarkMode}
            className="flex w-8 h-8 sm:w-9 sm:h-9 items-center justify-center rounded-lg text-[#475569] dark:text-[#8B949E] hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 shrink-0"
            title={isDarkMode ? "Light mode" : "Dark mode"}
          >
            {isDarkMode ? (
              <SunMedium className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2.5 sm:px-3.5"
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            Login
          </Button>
          <Button
            size="sm"
            className="px-3 sm:px-3.5"
            onClick={() => navigate(ROUTES.REGISTER)}
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO PREVIEW — a small "browser window" mockup built from real UI tokens,
// not a screenshot — stays visually correct forever, nothing to go stale.
// ─────────────────────────────────────────────────────────────────────────────

function HeroPreview() {
  const stats: { label: string; value: number; color: string }[] = [
    { label: "Pending", value: 6, color: "text-indigo-600 dark:text-indigo-400" },
    { label: "Completed", value: 14, color: "text-teal-600 dark:text-teal-400" },
    { label: "Overdue", value: 1, color: "text-coral-500" },
    { label: "Groups", value: 3, color: "text-[#B45309] dark:text-[#FCD34D]" },
  ];
  const tasks: { title: string; done: boolean }[] = [
    { title: "Design onboarding flow", done: false },
    { title: "Fix notification bug", done: true },
  ];

  return (
    <div className="rounded-2xl border border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#161B22] shadow-[0_30px_60px_rgba(15,23,42,0.15)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.55)] overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 h-9 border-b border-[#E2E6ED] dark:border-[#21262D] bg-[#F8FAFC] dark:bg-[#0D1117]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
      </div>
      <div className="p-5 sm:p-6 md:p-8 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-[#E2E6ED] dark:border-[#21262D] p-3"
            >
              <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#94A3B8] mt-0.5 truncate">
                {s.label}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {tasks.map((t) => (
            <div
              key={t.title}
              className="flex items-center gap-3 p-3 rounded-lg border border-[#E2E6ED] dark:border-[#21262D]"
            >
              {t.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-[#C8CDD8] dark:text-[#30363D] shrink-0" />
              )}
              <span
                className={cn(
                  "text-sm flex-1 min-w-0 truncate",
                  t.done
                    ? "line-through text-[#94A3B8]"
                    : "text-[#0F172A] dark:text-[#F0F6FC]",
                )}
              >
                {t.title}
              </span>
              <Badge variant={t.done ? "completed" : "pending"} className="shrink-0">
                {t.done ? "Completed" : "Pending"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden px-5 md:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-400/20 dark:bg-indigo-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal-400/20 dark:bg-teal-500/15 blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">
        <h1 className="text-[28px] sm:text-[38px] md:text-[52px] font-bold tracking-tight leading-[1.15] sm:leading-[1.1] text-[#0F172A] dark:text-[#F0F6FC]">
          Plan your team&apos;s work
          <br />
          with total clarity.
        </h1>
        <p className="mt-5 text-base md:text-lg text-[#475569] dark:text-[#8B949E] max-w-xl mx-auto leading-relaxed">
          Organize tasks and sub-tasks, assign clear ownership, and stay in
          sync in real time — with AI to help you plan when you need it.
        </p>
        {/* Stacked full-width below sm — two "lg" buttons side by side never
            fit at 320px (button labels can't wrap), so this is a real
            constraint, not just a style choice. Row layout returns at sm+. */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate(ROUTES.REGISTER)}
          >
            Get Started
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            Login
          </Button>
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto mt-14 md:mt-16">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/15 to-teal-500/15 blur-3xl rounded-full pointer-events-none" />
        <div className="relative">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TECH STRIP
// ─────────────────────────────────────────────────────────────────────────────

function TechStrip() {
  return (
    <section className="border-y border-[#E2E6ED] dark:border-[#21262D] bg-[#FAFBFC] dark:bg-[#0D1117]/60 py-7">
      <div className="max-w-5xl mx-auto px-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2.5">
        {TECH_STACK.map((t) => (
          <span
            key={t}
            className="text-sm font-medium text-[#94A3B8] dark:text-[#64748B] tracking-wide"
          >
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE PREVIEWS — small, static, built from real Card/Badge/Avatar tokens
// ─────────────────────────────────────────────────────────────────────────────

function GroupsPreview() {
  const members: { name: string; role: "ADMIN" | "MEMBER" }[] = [
    { name: "Priya Sharma", role: "ADMIN" },
    { name: "Arjun Mehta", role: "MEMBER" },
    { name: "Sara Khan", role: "MEMBER" },
  ];
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
          BT
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F0F6FC]">
            Backend Team
          </p>
          <p className="text-xs text-[#94A3B8]">{members.length} members</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {members.map((m) => (
          <div key={m.name} className="flex items-center gap-3">
            <Avatar name={m.name} size="sm" />
            <span className="text-sm text-[#475569] dark:text-[#8B949E] flex-1 min-w-0 truncate">
              {m.name}
            </span>
            <Badge variant="default" dot={false} className="shrink-0">
              {m.role}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TasksPreview() {
  const subTasks: { title: string; done: boolean }[] = [
    { title: "Draft API contract", done: true },
    { title: "Implement auth middleware", done: true },
    { title: "Write integration tests", done: false },
  ];
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F0F6FC] min-w-0 truncate">
          Ship the v2 API
        </p>
        <Badge variant="pending" className="shrink-0">Pending</Badge>
      </div>
      <div className="space-y-2">
        {subTasks.map((s) => (
          <div key={s.title} className="flex items-center gap-2.5">
            {s.done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-[#C8CDD8] dark:text-[#30363D] shrink-0" />
            )}
            <span
              className={cn(
                "text-sm",
                s.done
                  ? "line-through text-[#94A3B8]"
                  : "text-[#0F172A] dark:text-[#F0F6FC]",
              )}
            >
              {s.title}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AIPreview() {
  const drafts = [
    "Set up project scaffolding",
    "Configure CI pipeline",
    "Add health-check endpoint",
  ];
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2 text-[#475569] dark:text-[#8B949E]">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        <p className="text-xs font-medium">Review AI-drafted sub-tasks</p>
      </div>
      <div className="space-y-2">
        {drafts.map((d) => (
          <div
            key={d}
            className="flex items-center gap-2 px-3 h-9 rounded-lg border border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#0D1117]"
          >
            <span className="text-[13px] text-[#0F172A] dark:text-[#F0F6FC] flex-1 truncate">
              {d}
            </span>
            <Trash2 className="w-3.5 h-3.5 text-[#C8CDD8] dark:text-[#30363D] shrink-0" />
          </div>
        ))}
      </div>
      <Button size="sm" className="w-full">
        Save Sub-Tasks
      </Button>
    </Card>
  );
}

function RealtimePreview() {
  const events: { text: string; time: string }[] = [
    { text: "Priya completed a task", time: "Just now" },
    { text: "You were assigned a new task", time: "2m ago" },
  ];
  return (
    <Card className="space-y-4">
      {events.map((e) => (
        <div key={e.text} className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F0FDFA] dark:bg-teal-500/12 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-sm text-[#0F172A] dark:text-[#F0F6FC]">
              {e.text}
            </p>
            <p className="text-xs text-[#94A3B8] mt-0.5">{e.time}</p>
          </div>
        </div>
      ))}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE ROW — alternating text/preview layout, stacks on mobile
// ─────────────────────────────────────────────────────────────────────────────

interface FeatureRowProps {
  icon: React.ElementType;
  title: string;
  description: string;
  preview: ReactNode;
  reverse?: boolean;
}

function FeatureRow({
  icon: Icon,
  title,
  description,
  preview,
  reverse,
}: FeatureRowProps) {
  return (
    <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
      <div className={reverse ? "md:order-2" : "md:order-1"}>
        <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] dark:bg-indigo-500/12 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-xl md:text-2xl font-semibold text-[#0F172A] dark:text-[#F0F6FC] tracking-tight">
          {title}
        </h3>
        <p className="mt-3 text-[#475569] dark:text-[#8B949E] leading-relaxed">
          {description}
        </p>
      </div>
      <div className={reverse ? "md:order-1" : "md:order-2"}>{preview}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ENGINEERING SECTION — visually distinct from feature rows above: a grid of
// small fact cards, not another image/text pitch.
// ─────────────────────────────────────────────────────────────────────────────

function EngineeringSection() {
  return (
    <section
      id="engineering"
      className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28"
    >
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-[#0F172A] dark:text-[#F0F6FC] tracking-tight">
          Built with production-grade engineering
        </h2>
        <p className="mt-3 text-[#475569] dark:text-[#8B949E]">
          Not just CRUD — the parts that are easy to get wrong were built
          carefully.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ENGINEERING_POINTS.map((p) => (
          <div
            key={p.label}
            className="rounded-xl border border-[#E2E6ED] dark:border-[#21262D] bg-white dark:bg-[#161B22] p-5"
          >
            <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] dark:bg-indigo-500/12 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
              <p.icon className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#F0F6FC]">
              {p.label}
            </h4>
            <p className="mt-1.5 text-[13px] text-[#94A3B8] leading-relaxed">
              {p.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FINAL CTA BAND
// ─────────────────────────────────────────────────────────────────────────────

function FinalCTA() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-teal-500" />
      <div className="relative max-w-3xl mx-auto px-5 py-16 md:py-20 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
          Start organizing your team&apos;s work
        </h2>
        <div className="mt-7">
          <button
            onClick={() => navigate(ROUTES.REGISTER)}
            className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-white text-indigo-600 font-semibold text-sm shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-[#E2E6ED] dark:border-[#21262D] py-8">
      <div className="max-w-6xl mx-auto px-5 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo size="sm" />
        <p className="text-xs text-[#94A3B8]">
          © {new Date().getFullYear()} TeamTasks
        </p>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1117]">
      <LandingNav />
      <Hero />
      <TechStrip />

      <div
        id="features"
        className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28 space-y-20 md:space-y-28"
      >
        <FeatureRow
          icon={Users}
          title="Team Collaboration, With Real Roles"
          description="Create groups, invite members, and control who can invite, assign, and manage work — admin and member roles are enforced on the backend, not just hidden in the UI."
          preview={<GroupsPreview />}
        />
        <FeatureRow
          icon={ListChecks}
          title="Tasks, Broken Into Clear Steps"
          description="Every task can be split into sub-tasks with their own owners and due dates, so nothing large and vague ever sits untouched."
          preview={<TasksPreview />}
          reverse
        />
        <FeatureRow
          icon={Sparkles}
          title="Let AI Draft the Plan — You Confirm It"
          description="Generate a first pass at your sub-tasks with AI, then edit, reorder, or remove anything before it's saved. Nothing is created without your review."
          preview={<AIPreview />}
        />
        <FeatureRow
          icon={Bell}
          title="Stay in Sync, Automatically"
          description="Task updates, completions, and assignments show up instantly for everyone involved — no refreshing, no missed changes."
          preview={<RealtimePreview />}
          reverse
        />
      </div>

      <EngineeringSection />
      <FinalCTA />
      <Footer />
    </div>
  );
};

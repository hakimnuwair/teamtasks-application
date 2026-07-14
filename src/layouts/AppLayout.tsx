/**
 * layouts/AppLayout.tsx
 *
 * Shell layout: Sidebar (desktop) + Topbar + BottomNav (mobile).
 *
 * Bootstrap strategy:
 *   • Notification unreadCount — bootstrapped HERE via useNotifications hook on mount.
 *     The badge lives in the sidebar/topbar on every page, so it must be populated
 *     immediately after login regardless of which page the user lands on.
 *   • Groups — NOT fetched here. useGroups hook fetches lazily when a page that
 *     needs groups mounts (Groups page, GroupDetail, CreateTaskModal).
 *     This avoids a redundant fetch on every AppLayout mount.
 *
 * Architecture: AppLayout → useNotifications → notificationStore ← notificationService
 */
import { Outlet, useLocation, useNavigate, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Bell,
  Activity,
  User,
  LogOut,
  ChevronLeft,
  Clock,
  Moon,
  Menu,
  X,
  SunMedium,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSocket } from "../hooks/useSocket";
import { useNotifications } from "../hooks/useNotifications";
import { useAuthStore } from "../store/authStore";
import { useUIStore } from "../store/uiStore";
import { useNotificationStore } from "../store/notificationStore";
import { ROUTES } from "../config/routes";
import { cn } from "../utils/cn";

// ── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: "Dashboard" },
  { to: ROUTES.TASKS, icon: CheckSquare, label: "Tasks" },
  { to: ROUTES.GROUPS, icon: Users, label: "Groups" },
  { to: ROUTES.NOTIFICATIONS, icon: Bell, label: "Notifications" },
  { to: ROUTES.ACTIVITY, icon: Activity, label: "Activity" },
  { to: ROUTES.PROFILE, icon: User, label: "Profile" },
];

const getPageTitle = (pathname: string): string => {
  if (pathname === ROUTES.DASHBOARD) return "Dashboard";
  if (pathname === ROUTES.TASKS) return "My Tasks";
  if (pathname === ROUTES.GROUPS) return "Groups";
  if (pathname.startsWith("/groups/")) return "Group Detail";
  if (pathname === ROUTES.NOTIFICATIONS) return "Notifications";
  if (pathname === ROUTES.ACTIVITY) return "Activity Log";
  if (pathname === ROUTES.PROFILE) return "Profile";
  return "TeamTasks";
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function UserAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  return (
    <div
      className={cn(
        dim,
        "rounded-full flex items-center justify-center font-semibold text-white shrink-0 bg-gradient-to-br from-indigo-600 to-teal-500",
      )}
    >
      {getInitials(name)}
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ onMobileClose }: { onMobileClose?: () => void }) {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();

  // Explicit logout always lands on the public Landing page ("/"), not
  // /login — distinct from an expired session, which ProtectedRoute still
  // sends to /login on its own, unchanged.
  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full shrink-0 overflow-hidden transition-all duration-300 ease-out",
        "bg-white/80 dark:bg-[#161B22]/95 backdrop-blur-xl",
        "border-r border-white/40 dark:border-[#21262D]/80",
        "md:relative md:h-screen",
        sidebarOpen ? "md:w-60" : "md:w-[68px]",
        "w-72",
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-black/5 dark:border-white/5 shrink-0">
        <div
          className={cn(
            "flex items-center gap-2.5 overflow-hidden",
            !sidebarOpen && "md:hidden",
          )}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[#0F172A] dark:text-[#F0F6FC] text-sm tracking-tight whitespace-nowrap">
            TeamTasks
          </span>
        </div>
        {!sidebarOpen && (
          <div className="hidden md:flex w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-teal-500 items-center justify-center mx-auto shrink-0 shadow-lg shadow-indigo-500/30">
            <Clock className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={onMobileClose ?? toggleSidebar}
          className="w-7 h-7 flex items-center justify-center rounded-md text-[#94A3B8] hover:bg-black/5 dark:hover:bg-white/5 transition-colors ml-auto md:ml-0 shrink-0"
        >
          {onMobileClose ? (
            <X className="w-4 h-4" />
          ) : (
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform duration-300",
                !sidebarOpen && "rotate-180",
              )}
            />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isNotif = label === "Notifications";
          return (
            <NavLink key={to} to={to} onClick={onMobileClose}>
              {({ isActive }) => (
                <span
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? [
                          "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
                          "shadow-[inset_3px_0_0_#4F46E5] dark:shadow-[inset_3px_0_0_#6366F1]",
                        ]
                      : "text-[#475569] dark:text-[#8B949E] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#0F172A] dark:hover:text-[#F0F6FC]",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-[18px] h-[18px] shrink-0",
                      isActive && "text-indigo-600 dark:text-indigo-400",
                    )}
                  />
                  <span className={cn("truncate", !sidebarOpen && "md:hidden")}>
                    {label}
                  </span>
                  {isNotif && unreadCount > 0 && (
                    <span
                      className={cn(
                        "flex items-center justify-center rounded-full text-white font-bold leading-none bg-[#F43F5E] text-[9px]",
                        sidebarOpen
                          ? "ml-auto min-w-[18px] h-[18px] px-1"
                          : "absolute top-1.5 right-1.5 w-2 h-2",
                      )}
                    >
                      {sidebarOpen
                        ? unreadCount > 99
                          ? "99+"
                          : unreadCount
                        : ""}
                    </span>
                  )}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-black/5 dark:border-white/5 shrink-0">
        {sidebarOpen || onMobileClose ? (
          <div className="flex items-center gap-2.5">
            {user && <UserAvatar name={user.name} size="sm" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F0F6FC] truncate">
                {user?.name}
              </p>
              <p className="text-[10px] text-[#94A3B8] truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={() => handleLogout()}
              className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#F43F5E] hover:bg-[#FFF1F2] dark:hover:bg-[rgba(244,63,94,0.10)] transition-all"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleLogout()}
            className="w-full flex items-center justify-center p-2 rounded-lg text-[#94A3B8] hover:text-[#F43F5E] hover:bg-[#FFF1F2] dark:hover:bg-[rgba(244,63,94,0.10)] transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

// ── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({
  title,
  onMenuClick,
}: {
  title: string;
  onMenuClick: () => void;
}) {
  const { isDarkMode, toggleDarkMode } = useUIStore();
  const { unreadCount } = useNotificationStore();

  return (
    <header
      className={cn(
        "h-16 shrink-0 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40",
        "bg-white/75 dark:bg-[#0D1117]/88 backdrop-blur-xl",
        "border-b border-white/40 dark:border-[#21262D]/80",
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[#475569] dark:text-[#8B949E] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-1.5">
        <NavLink
          to={ROUTES.NOTIFICATIONS}
          className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-lg text-[#475569] dark:text-[#8B949E] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F43F5E] shadow-[0_0_6px_rgba(244,63,94,0.60)]" />
          )}
        </NavLink>
        <button
          onClick={toggleDarkMode}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-[#475569] dark:text-[#8B949E] hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
          title={isDarkMode ? "Light mode" : "Dark mode"}
        >
          {isDarkMode ? (
            <SunMedium className="w-4 h-4 text-slate-300" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
}

// ── Bottom Nav (mobile) ──────────────────────────────────────────────────────
function BottomNav() {
  const { unreadCount } = useNotificationStore();
  const BOTTOM_ITEMS = NAV_ITEMS.slice(0, 5);

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 flex items-center justify-around",
        "bg-white/88 dark:bg-[#161B22]/96 backdrop-blur-xl",
        "border-t border-white/40 dark:border-[#21262D]/80",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      {BOTTOM_ITEMS.map(({ to, icon: Icon, label }) => {
        const isNotif = label === "Notifications";
        return (
          <NavLink key={to} to={to} className="relative flex-1">
            {({ isActive }) => (
              <span className="flex flex-col items-center gap-1 py-1">
                <span className="relative">
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-all duration-200",
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400 drop-shadow-[0_0_8px_rgba(79,70,229,0.50)]"
                        : "text-[#94A3B8] dark:text-[#484F58]",
                    )}
                  />
                  {isNotif && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#F43F5E] shadow-[0_0_6px_rgba(244,63,94,0.60)]" />
                  )}
                </span>
                <span
                  className={cn(
                    "text-[9px] font-medium transition-colors",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-[#94A3B8] dark:text-[#484F58]",
                  )}
                >
                  {label}
                </span>
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

// ── AppLayout ────────────────────────────────────────────────────────────────
export const AppLayout = () => {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { refreshUnreadCount } = useNotifications();

  useSocket();

  // Bootstrap the notification badge once on layout mount.
  // This is the ONLY place we fetch data at layout level.
  // Everything else is fetched by the page/hook that needs it.
  useEffect(() => {
    refreshUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F6F8] dark:bg-[#0D1117]">
      <div className="hidden md:flex md:h-screen md:flex-col">
        <Sidebar />
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative animate-[slideInLeft_250ms_ease-out]">
            <Sidebar onMobileClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          title={getPageTitle(pathname)}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto px-5 py-6 md:px-10 md:py-8 pb-20 md:pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />

      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

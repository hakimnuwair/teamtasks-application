import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Bell,
  Clock,
  Activity,
  User,
  LogOut,
  ChevronLeft,
  CheckSquare,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { useNotificationStore } from "../../store/notificationStore";
import { Avatar } from "../ui/Spinner";
import { ROUTES } from "../../config/routes";

const navItems = [
  { to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: "Dashboard" },
  { to: ROUTES.REMINDERS, icon: CheckSquare, label: "Reminders" },
  { to: ROUTES.GROUPS, icon: Users, label: "Groups" },
  { to: ROUTES.NOTIFICATIONS, icon: Bell, label: "Notifications" },
  { to: ROUTES.ACTIVITY, icon: Activity, label: "Activity" },
  { to: ROUTES.PROFILE, icon: User, label: "Profile" },
];

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { unreadCount } = useNotificationStore();

  return (
    <aside
      className={cn(
        "h-screen flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800",
        "transition-all duration-300 ease-in-out shrink-0",
        sidebarOpen ? "w-60" : "w-16",
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-zinc-900 dark:text-white text-sm tracking-tight">
              TeamTasks
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-auto"
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 transition-transform duration-300",
              !sidebarOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100",
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span className="truncate">{label}</span>}
            {/* Notification badge on bell icon */}
            {label === "Notifications" && unreadCount > 0 && (
              <span
                className={cn(
                  "flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold leading-none",
                  sidebarOpen
                    ? "ml-auto min-w-5 h-5 px-1"
                    : "absolute top-1.5 right-1.5 w-2 h-2",
                )}
              >
                {sidebarOpen ? (unreadCount > 99 ? "99+" : unreadCount) : ""}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        {sidebarOpen ? (
          <div className="flex items-center gap-3">
            {user && <Avatar name={user.name} size="md" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="text-zinc-400 hover:text-red-500 transition-colors p-1 rounded"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

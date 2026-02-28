import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "../components/common/Sidebar";
import { Topbar } from "../components/common/TopBar";
import { useSocket } from "../hooks/useSocket";
import { ROUTES } from "../config/routes";

/** Map route paths to human-readable page titles for the Topbar */
const getPageTitle = (pathname: string): string => {
  if (pathname === ROUTES.DASHBOARD) return "Dashboard";
  if (pathname === ROUTES.REMINDERS) return "My Reminders";
  if (pathname === ROUTES.GROUPS) return "Groups";
  if (pathname.startsWith("/groups/")) return "Group Detail";
  if (pathname === ROUTES.NOTIFICATIONS) return "Notifications";
  if (pathname === ROUTES.ACTIVITY) return "Activity Log";
  if (pathname === ROUTES.PROFILE) return "Profile";
  return "TeamTasks";
};

/**
 * Shell layout for all authenticated pages.
 * - Mounts useSocket() ONCE for the entire authenticated session.
 * - Sidebar + scrollable main area with Topbar.
 */
export const AppLayout = () => {
  const { pathname } = useLocation();

  // Wire up all socket listeners for the session lifetime
  useSocket();

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={getPageTitle(pathname)} />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

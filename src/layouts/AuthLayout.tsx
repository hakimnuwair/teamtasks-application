import { Outlet, Navigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { ROUTES } from "../config/routes";

/**
 * Wraps /login and /register.
 * If user is already authenticated, redirect them straight to dashboard.
 */
export const AuthLayout = () => {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (!isInitializing && isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200/30 dark:bg-violet-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            TeamTasks
          </span>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-zinc-200/60 dark:shadow-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

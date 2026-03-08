import { Outlet, Navigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { ROUTES } from "../config/routes";

export const AuthLayout = () => {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (!isInitializing && isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#0D1117] flex items-center justify-center p-4 relative overflow-hidden">
      {/* ── Ambient blobs ── */}
      <div className="absolute -top-48 -right-48 w-96 h-96 rounded-full bg-indigo-400/20 dark:bg-indigo-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full bg-teal-400/20 dark:bg-teal-500/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-coral-400/10 dark:bg-coral-500/08 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* ── Logo ── */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-[#0F172A] dark:text-[#F0F6FC] tracking-tight">
            Team
            <span className="bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
              Tasks
            </span>
          </span>
        </div>

        {/* ── Glass card ── */}
        <div
          className="
          bg-white/80 dark:bg-[#161B22]/90
          backdrop-blur-2xl
          border border-white/50 dark:border-[#21262D]/80
          rounded-2xl
          shadow-[0_25px_50px_rgba(15,23,42,0.12)] dark:shadow-[0_25px_50px_rgba(0,0,0,0.50)]
          p-8
        "
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

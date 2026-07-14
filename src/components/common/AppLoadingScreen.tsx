/**
 * components/common/AppLoadingScreen.tsx
 *
 * Full-screen branded loading state shown while the app restores a session
 * (isInitializing) — replaces the generic PageSpinner for that one moment,
 * in HomeRoute and ProtectedRoute, so a visitor's very first impression is
 * TeamTasks branding rather than a bare spinner.
 *
 * Reuses AuthLayout's exact background/ambient-blob/logo treatment so this
 * reads as a continuation of the same app, not a separate loading page.
 */
import { Clock } from "lucide-react";
import { Spinner } from "../ui";

export function AppLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#0D1117] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-48 -right-48 w-96 h-96 rounded-full bg-indigo-400/20 dark:bg-indigo-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full bg-teal-400/20 dark:bg-teal-500/15 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center gap-7">
        <div className="flex items-center justify-center gap-3">
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

        <Spinner size="lg" />

        <p className="text-sm text-[#94A3B8] dark:text-[#8B949E] text-center">
          Preparing your workspace...
        </p>
      </div>
    </div>
  );
}

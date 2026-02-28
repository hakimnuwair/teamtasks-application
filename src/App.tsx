import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layouts
import { AuthLayout } from "./layouts/AuthLayout";
import { AppLayout } from "./layouts/AppLayout";

// Route guard
import { ProtectedRoute } from "./components/common/ProtectedRoute";

// Auth pages
import { LoginPage } from "./pages/auth/Login";

// App pages
import { RemindersPage } from "./pages/reminders/Reminders";

// Store
import { useAuthStore } from "./store/authStore";
import { useUIStore } from "./store/uiStore";

// Config
import { ROUTES } from "./config/routes";

// ─── Placeholder pages (replace with real implementations) ───────────────────
const DashboardPage = () => (
  <div className="text-zinc-600 dark:text-zinc-400 text-sm">
    Dashboard — coming soon
  </div>
);
const GroupsPage = () => (
  <div className="text-zinc-600 dark:text-zinc-400 text-sm">
    Groups — coming soon
  </div>
);
const GroupDetailPage = () => (
  <div className="text-zinc-600 dark:text-zinc-400 text-sm">
    Group Detail — coming soon
  </div>
);
const NotificationsPage = () => (
  <div className="text-zinc-600 dark:text-zinc-400 text-sm">
    Notifications — coming soon
  </div>
);
const ActivityPage = () => (
  <div className="text-zinc-600 dark:text-zinc-400 text-sm">
    Activity — coming soon
  </div>
);
const ProfilePage = () => (
  <div className="text-zinc-600 dark:text-zinc-400 text-sm">
    Profile — coming soon
  </div>
);
const RegisterPage = () => (
  <div className="text-zinc-600 dark:text-zinc-400 text-sm">
    Register — coming soon
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const { initialize, isDarkMode } = { ...useAuthStore(), ...useUIStore() };

  /**
   * On first render: try to restore the user's session.
   * initialize() hits GET /auth/me — if the refresh token cookie is valid,
   * the axios interceptor will silently get a new access token first.
   * This is what prevents "logout on refresh".
   */
  useEffect(() => {
    // Apply dark mode class from store/OS preference
    document.documentElement.classList.toggle("dark", isDarkMode);

    // Restore session
    useAuthStore.getState().initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BrowserRouter>
      {/* Global toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "var(--toast-bg, #fff)",
            color: "var(--toast-color, #18181b)",
            border: "1px solid var(--toast-border, #e4e4e7)",
            borderRadius: "10px",
            fontSize: "13px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          },
          success: { iconTheme: { primary: "#7c3aed", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />

      <Routes>
        {/* ── Root redirect ── */}
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />

        {/* ── Auth routes (no sidebar, centered card) ── */}
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        </Route>

        {/* ── Protected routes (sidebar + topbar) ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.REMINDERS} element={<RemindersPage />} />
            <Route path={ROUTES.GROUPS} element={<GroupsPage />} />
            <Route path="/groups/:id" element={<GroupDetailPage />} />
            <Route
              path={ROUTES.NOTIFICATIONS}
              element={<NotificationsPage />}
            />
            <Route path={ROUTES.ACTIVITY} element={<ActivityPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          </Route>
        </Route>

        {/* ── 404 fallback ── */}
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

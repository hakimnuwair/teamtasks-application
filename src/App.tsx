import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layouts
import { AuthLayout } from "./layouts/AuthLayout";
import { AppLayout } from "./layouts/AppLayout";

// Route guard
import { ProtectedRoute } from "./components/common/ProtectedRoute";

// Pages
import { LoginPage } from "./pages/auth/Login";
import { RemindersPage } from "./pages/reminders/Reminders";
import { GroupsPage } from "./pages/groups/Groups";
import { GroupDetailPage } from "./pages/groups/GroupDetails";
import { NotificationsPage } from "./pages/notifications/Notification";
import { ActivityPage } from "./pages/activity/Activity";
import { DashboardPage } from "./pages/dashoboard/Dashboard";
import { ProfilePage } from "./pages/profile/Profile";

import { RegisterPage } from "./pages/auth/Register";

// Stores
import { useAuthStore } from "./store/authStore";
import { useUIStore } from "./store/uiStore";

// Config
import { ROUTES } from "./config/routes";
import { OAuthCallbackPage } from "./pages/auth/OAuthCallback";

export default function App() {
  useEffect(() => {
    const isDark = useUIStore.getState().isDarkMode;
    document.documentElement.classList.toggle("dark", isDark);

    // Don't initialize on auth pages — no session to restore
    const isAuthPage = ["/login", "/register"].includes(
      window.location.pathname,
    );
    if (!isAuthPage) {
      useAuthStore.getState().initialize();
    } else {
      // Still need to mark initialization as done so ProtectedRoute doesn't spin
      useAuthStore.setState({ isInitializing: false });
    }
  }, []);

  return (
    <BrowserRouter>
      {/* 
        Toast — glassmorphism style.
        Colors use CSS-in-JS because react-hot-toast needs inline styles.
        We read dark mode state directly here.
      */}
      <ToastProvider />

      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />

        <Route path="/auth/callback" element={<OAuthCallbackPage />} />

        {/* Auth pages */}
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        </Route>

        {/* Protected app pages */}
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

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// ── Toast provider ────────────────────────────────────────────────────────────
// Reads dark mode to style toasts correctly
function ToastProvider() {
  const isDark = useUIStore((s) => s.isDarkMode);

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: isDark ? "rgba(28,35,51,0.92)" : "rgba(255,255,255,0.88)",
          color: isDark ? "#F0F6FC" : "#0F172A",
          border: isDark
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(226,230,237,0.80)",
          borderRadius: "12px",
          fontSize: "13px",
          fontFamily: "'Poppins', system-ui, sans-serif",
          backdropFilter: "blur(12px)",
          boxShadow: isDark
            ? "0 8px 24px rgba(0,0,0,0.40)"
            : "0 8px 24px rgba(15,23,42,0.10)",
          padding: "12px 16px",
        },
        success: { iconTheme: { primary: "#4F46E5", secondary: "#fff" } },
        error: { iconTheme: { primary: "#F43F5E", secondary: "#fff" } },
      }}
    />
  );
}

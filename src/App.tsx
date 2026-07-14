/**
 * App.tsx
 *
 * Router root. Handles session initialization on mount:
 * - /auth/callback: skips initialize(), leaves isInitializing:true so
 *   OAuthCallbackPage can store the token first then call initialize() itself.
 * - /login, /register, /forgot-password: sets isInitializing:false immediately
 *   (no session to restore on auth pages).
 * - All other routes: calls initialize() to restore existing session.
 */

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthLayout } from "./layouts/AuthLayout";
import { AppLayout } from "./layouts/AppLayout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { HomeRoute } from "./components/common/HomeRoute";

import { LoginPage } from "./pages/auth/Login";
import { RegisterPage } from "./pages/auth/Register";
import { ForgotPasswordPage } from "./pages/auth/ForgotPassowrd";
import { OAuthCallbackPage } from "./pages/auth/OAuthCallback";
import { TasksPage } from "./pages/tasks/Tasks";
import { TaskDetailPage } from "./pages/tasks/TaskDetails";
import { GroupsPage } from "./pages/groups/Groups";
import { GroupDetailPage } from "./pages/groups/GroupDetails";
import { NotificationsPage } from "./pages/notifications/Notification";
import { ActivityPage } from "./pages/activity/Activity";
import { DashboardPage } from "./pages/dashoboard/Dashboard";
import { ProfilePage } from "./pages/profile/Profile";

import { useAuthStore } from "./store/authStore";
import { useUIStore } from "./store/uiStore";
import { ROUTES } from "./config/routes";
import { ResetPasswordPage } from "./pages/auth/ResetPassword";

const SKIP_INIT_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

export default function App() {
  useEffect(() => {
    const isDark = useUIStore.getState().isDarkMode;
    document.documentElement.classList.toggle("dark", isDark);

    const path = window.location.pathname;

    if (SKIP_INIT_PATHS.some((p) => path.startsWith(p))) {
      // /auth/callback stays isInitializing:true — OAuthCallbackPage manages it
      if (!path.startsWith("/auth/callback")) {
        useAuthStore.setState({ isInitializing: false });
      }
    } else {
      useAuthStore.getState().initialize();
    }
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider />

      <Routes>
        <Route path="/" element={<HomeRoute />} />

        {/* OAuth callback — no layout wrapper, manages own auth sequence */}
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />

        {/* Unauthenticated pages */}
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route
            path={ROUTES.FORGOT_PASSWORD}
            element={<ForgotPasswordPage />}
          />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        </Route>

        {/* Protected app pages */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.TASKS} element={<TasksPage />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
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

        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

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

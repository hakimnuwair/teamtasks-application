/**
 * pages/auth/OAuthCallback.tsx
 *
 * Handles the redirect from the backend after Google OAuth.
 * Backend redirects to: /auth/callback?token=<accessToken>&userId=<id>
 *
 * This page:
 *  1. Reads the token from the URL param
 *  2. Stores it in tokenManager (in-memory)
 *  3. Fetches /auth/me to get the full user object
 *  4. Hydrates authStore + connects socket
 *  5. Redirects to dashboard
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { tokenManager } from "../../utils/tokenManager";
import { connectSocket } from "../../config/socket";
import api from "../../config/axios";
import { ROUTES } from "../../config/routes";
import type { User } from "../../types/types";

export const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setError("Authentication failed — no token received.");
      setTimeout(() => navigate(ROUTES.LOGIN), 3000);
      return;
    }

    tokenManager.set(token);

    api
      .get<{ success: boolean; data: User }>("/auth/me")
      .then(({ data }) => {
        const user = data.data;
        setUser(user);
        useAuthStore.setState({ isAuthenticated: true, isInitializing: false });
        connectSocket(user.id ?? user._id ?? "");
        navigate(ROUTES.DASHBOARD, { replace: true });
      })
      .catch(() => {
        tokenManager.clear();
        setError("Authentication failed — please try again.");
        setTimeout(() => navigate(ROUTES.LOGIN), 3000);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#0D1117] flex items-center justify-center">
      {error ? (
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-[#F43F5E]">{error}</p>
          <p className="text-xs text-[#94A3B8]">Redirecting to login…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          {/* Spinner */}
          <div className="w-10 h-10 rounded-full border-[3px] border-[#E2E6ED] dark:border-[#21262D] border-t-indigo-600 animate-spin" />
          <p className="text-sm text-[#94A3B8]">Signing you in…</p>
        </div>
      )}
    </div>
  );
};

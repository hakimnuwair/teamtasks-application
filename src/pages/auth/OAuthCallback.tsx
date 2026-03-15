/**
 * pages/auth/OAuthCallback.tsx
 *
 * Landing page for the Google OAuth redirect.
 * Backend sends: ${CLIENT_URL}/auth/callback?token=<accessToken>
 *
 * Reads the token from the URL, stores it in tokenManager, then calls
 * initialize() which atomically fetches /auth/me, sets user + isAuthenticated,
 * and connects the socket — all in one Zustand update before navigating.
 * Using initialize() avoids the race condition of separate setState calls
 * where ProtectedRoute could redirect to login between updates.
 *
 * useRef(ranOnce) prevents the effect from running twice in React StrictMode.
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { tokenManager } from "../../utils/tokenManager";
import { ROUTES } from "../../config/routes";

export const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initialize } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (!token) {
      setError("Authentication failed — no token received.");
      setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 3000);
      return;
    }

    tokenManager.set(token);

    initialize()
      .then(() => {
        navigate(ROUTES.DASHBOARD, { replace: true });
      })
      .catch(() => {
        tokenManager.clear();
        setError("Authentication failed — please try again.");
        setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 3000);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#0D1117] flex items-center justify-center">
      {error ? (
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)] flex items-center justify-center mx-auto">
            <svg
              className="w-5 h-5 text-[#F43F5E]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#0F172A] dark:text-[#F0F6FC]">
            {error}
          </p>
          <p className="text-xs text-[#94A3B8]">Redirecting to login…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div
              className="absolute inset-0 rounded-2xl border-[3px] border-transparent border-t-indigo-600 animate-spin"
              style={{ margin: "-4px" }}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F0F6FC]">
              Signing you in…
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">
              Setting up your session
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

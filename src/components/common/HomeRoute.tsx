/**
 * components/common/HomeRoute.tsx
 *
 * Root ("/") gate: shows the public Landing page to unauthenticated
 * visitors instead of bouncing straight to Login, or redirects to the
 * Dashboard for an already-active session. Mirrors ProtectedRoute's
 * isInitializing/isAuthenticated handling so the loading state behaves
 * identically to the rest of the app.
 */

import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { PageSpinner } from "../ui";
import { ROUTES } from "../../config/routes";
import { LandingPage } from "../../pages/Landing";

export const HomeRoute = () => {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing && !isAuthenticated) return <PageSpinner />;

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <LandingPage />;
};

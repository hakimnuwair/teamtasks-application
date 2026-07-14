/**
 * components/common/ProtectedRoute.tsx
 *
 * Shows the branded app loading screen while isInitializing && !isAuthenticated
 * (covers the OAuth callback window where isInitializing stays true until
 * initialize() completes). Redirects to login once loading is done and user
 * is not authenticated.
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { AppLoadingScreen } from "./AppLoadingScreen";
import { ROUTES } from "../../config/routes";

export const ProtectedRoute = () => {
  const { isAuthenticated, isInitializing } = useAuthStore();
  const location = useLocation();

  if (isInitializing && !isAuthenticated) return <AppLoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
};

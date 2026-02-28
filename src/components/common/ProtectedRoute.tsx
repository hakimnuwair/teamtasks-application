import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { ROUTES } from "../../config/routes";
import { Spinner } from "../ui/Spinner";

export const ProtectedRoute = () => {
  const { isAuthenticated, isInitializing } = useAuthStore();
  const location = useLocation();

  // While restoring session (GET /auth/me)
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Spinner size="lg" />
      </div>
    );
  }

  // If not authenticated → redirect to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        replace
        state={{ from: location }} // enables redirect-back after login
      />
    );
  }

  // If authenticated → render nested routes
  return <Outlet />;
};

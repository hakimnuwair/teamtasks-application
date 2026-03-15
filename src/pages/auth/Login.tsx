/**
 * pages/auth/Login.tsx
 *
 * Sign-in form with email/password and Google OAuth.
 * Reads ?error= from URL to surface OAuth failure messages.
 * On success, navigates to the page the user was trying to reach (or dashboard).
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { Button, Field, Input } from "../../components/ui";
import { ROUTES } from "../../config/routes";
import { cn } from "../../utils/cn";
import { parseApiError } from "../../config/axios";

function GoogleOAuthButton({ label }: { label: string }) {
  const BACKEND_URL =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
      /\/api\/v1\/?$/,
      "",
    ) ?? "http://localhost:5000";

  return (
    <button
      type="button"
      onClick={() => {
        window.location.href = `${BACKEND_URL}/api/v1/auth/google`;
      }}
      className={cn(
        "w-full h-11 flex items-center justify-center gap-3 rounded-lg",
        "border-[1.5px] border-[#E2E6ED] dark:border-[#21262D]",
        "bg-white dark:bg-[#161B22]",
        "text-sm font-medium text-[#0F172A] dark:text-[#F0F6FC]",
        "hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
        "hover:bg-[#F8FAFC] dark:hover:bg-[rgba(255,255,255,0.04)]",
        "transition-all duration-[250ms] active:scale-[0.99]",
      )}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        />
        <path
          fill="#FBBC05"
          d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.964L3.964 7.296C4.672 5.169 6.656 3.58 9 3.58Z"
        />
      </svg>
      {label}
    </button>
  );
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPwd, setShowPwd] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const urlError = new URLSearchParams(location.search).get("error");
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    ROUTES.DASHBOARD;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(parseApiError(err, "Login failed. Please try again."));
    }
  };

  const errorMsg =
    serverError ??
    (urlError ? "Google sign-in failed. Please try again." : null);

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide mb-1">
          Welcome back
        </h2>
        <p className="text-sm text-[#94A3B8]">
          Sign in to continue to TeamTasks
        </p>
      </div>

      <div className="mb-5">
        <GoogleOAuthButton label="Continue with Google" />
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-[#E2E6ED] dark:bg-[#21262D]" />
        <span className="text-[11px] text-[#94A3B8] uppercase tracking-widest">
          or
        </span>
        <div className="flex-1 h-px bg-[#E2E6ED] dark:bg-[#21262D]" />
      </div>

      {errorMsg && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)] border border-[#FECDD3] dark:border-[rgba(244,63,94,0.28)] p-3.5 text-sm text-[#BE123C] dark:text-[#FDA4AF]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Email" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={!!errors.email}
            leftIcon={<Mail className="w-4 h-4" />}
            {...register("email")}
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <Input
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            error={!!errors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="text-[#94A3B8] hover:text-[#475569] dark:hover:text-[#8B949E] transition-colors"
              >
                {showPwd ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            {...register("password")}
          />
        </Field>

        <div className="flex justify-end -mt-1">
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full mt-1"
          size="lg"
          isLoading={isSubmitting}
        >
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-[#94A3B8] mt-6">
        Don't have an account?{" "}
        <Link
          to={ROUTES.REGISTER}
          className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          Sign up free
        </Link>
      </p>
    </div>
  );
};

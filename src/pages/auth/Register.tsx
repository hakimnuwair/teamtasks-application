/**
 * pages/auth/Register.tsx
 *
 * Registration form with:
 *  - Full name, email, password (zod-validated)
 *  - Password strength bar
 *  - Show/hide password toggle
 *  - Google OAuth button (redirects to backend /auth/google)
 *  - Matches LoginPage styling exactly (AuthLayout glass card)
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { Button, Field, Input } from "../../components/ui";
import { ROUTES } from "../../config/routes";
import { cn } from "../../utils/cn";

// ─── Schema ───────────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be under 50 characters")
      .trim(),
    email: z.string().email("Enter a valid email address").toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

type RegisterForm = z.infer<typeof registerSchema>;

// ─── Password strength ────────────────────────────────────────────────────────

function getPasswordStrength(pwd: string): {
  score: number;
  label: string;
  color: string;
} {
  if (pwd.length === 0) return { score: 0, label: "", color: "" };
  if (pwd.length < 8)
    return { score: 1, label: "Too short", color: "bg-[#F43F5E]" };

  let score = 1;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const map: Record<number, { label: string; color: string }> = {
    1: { label: "Weak", color: "bg-[#F43F5E]" },
    2: { label: "Fair", color: "bg-[#F59E0B]" },
    3: { label: "Good", color: "bg-teal-500" },
    4: { label: "Strong", color: "bg-indigo-600" },
    5: { label: "Strong", color: "bg-indigo-600" },
  };
  return { score, ...map[score] };
}

// ─── Google OAuth button ──────────────────────────────────────────────────────

function GoogleOAuthButton({ label }: { label: string }) {
  // Redirect to backend Google OAuth — backend handles the entire OAuth dance
  // and redirects back to /auth/google/callback which sets the cookie + token
  const BACKEND_URL =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
      /\/api\/v1\/?$/,
      "",
    ) ?? "http://localhost:5000";

  const handleGoogleAuth = () => {
    // Store the intended destination so we can redirect after OAuth
    sessionStorage.setItem(
      "oauth_redirect",
      window.location.origin + ROUTES.DASHBOARD,
    );
    window.location.href = `${BACKEND_URL}/api/v1/auth/google`;
  };

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
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
      {/* Google "G" SVG logo */}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export const RegisterPage = () => {
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  // Update strength bar as user types
  const passwordValue = watch("password", "");
  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (values: RegisterForm) => {
    setServerError(null);
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Registration failed. Please try again.";
      setServerError(msg);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide mb-1">
          Create your account
        </h2>
        <p className="text-sm text-[#94A3B8]">
          Start collaborating with your team today
        </p>
      </div>

      {/* Google OAuth */}
      <div className="mb-5">
        <GoogleOAuthButton label="Sign up with Google" />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-[#E2E6ED] dark:bg-[#21262D]" />
        <span className="text-[11px] text-[#94A3B8] uppercase tracking-widest">
          or
        </span>
        <div className="flex-1 h-px bg-[#E2E6ED] dark:bg-[#21262D]" />
      </div>

      {/* Server error */}
      {serverError && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)] border border-[#FECDD3] dark:border-[rgba(244,63,94,0.28)] p-3.5 text-sm text-[#BE123C] dark:text-[#FDA4AF]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Full name */}
        <Field label="Full Name" error={errors.name?.message}>
          <Input
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            error={!!errors.name}
            leftIcon={<User className="w-4 h-4" />}
            autoFocus
            {...register("name")}
          />
        </Field>

        {/* Email */}
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

        {/* Password + strength bar */}
        <Field label="Password" error={errors.password?.message}>
          <Input
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
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
          {/* Strength bar */}
          {passwordValue.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 h-1 rounded-full transition-all duration-[250ms]",
                      strength.score >= i
                        ? strength.color
                        : "bg-[#E2E6ED] dark:bg-[#21262D]",
                    )}
                  />
                ))}
              </div>
              <p className="text-[10px] text-[#94A3B8]">
                Password strength:{" "}
                <span
                  className={cn(
                    "font-medium",
                    strength.score <= 1
                      ? "text-[#F43F5E]"
                      : strength.score === 2
                        ? "text-[#F59E0B]"
                        : "text-teal-600 dark:text-teal-400",
                  )}
                >
                  {strength.label}
                </span>
              </p>
            </div>
          )}
        </Field>

        {/* Confirm password */}
        <Field label="Confirm Password" error={errors.confirmPassword?.message}>
          <Input
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat your password"
            error={!!errors.confirmPassword}
            leftIcon={<Lock className="w-4 h-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="text-[#94A3B8] hover:text-[#475569] dark:hover:text-[#8B949E] transition-colors"
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            {...register("confirmPassword")}
          />
        </Field>

        {/* Terms note */}
        <p className="text-[11px] text-[#94A3B8] leading-relaxed">
          By creating an account you agree to our{" "}
          <span className="text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">
            Privacy Policy
          </span>
          .
        </p>

        <Button
          type="submit"
          className="w-full mt-1"
          size="lg"
          isLoading={isSubmitting}
        >
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-[#94A3B8] mt-6">
        Already have an account?{" "}
        <Link
          to={ROUTES.LOGIN}
          className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};

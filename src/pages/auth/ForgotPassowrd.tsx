/**
 * pages/auth/ForgotPassword.tsx
 *
 * Two-step password reset flow:
 *   Step 1 — Email form: user submits email → POST /auth/forgot-password
 *   Step 2 — Reset form: user enters token + new password → POST /auth/reset-password
 *
 * In development the API returns { resetToken } in the response so you can
 * test without email setup. In production, deliver the token via email and
 * link the user directly to /forgot-password?token=<token>.
 *
 * URL token pre-fill: if ?token= is present in the URL (from an email link),
 * step 2 opens automatically with the token pre-filled.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import { Button, Field, Input } from "../../components/ui";
import { ROUTES } from "../../config/routes";
import { cn } from "../../utils/cn";
import api, { parseApiError } from "../../config/axios";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const resetSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

// ─── Password strength ────────────────────────────────────────────────────────

function getStrength(pwd: string) {
  if (!pwd.length) return { score: 0, label: "", color: "" };
  if (pwd.length < 8)
    return { score: 1, label: "Too short", color: "bg-[#F43F5E]" };
  let s = 1;
  if (pwd.length >= 12) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  const map: Record<number, { label: string; color: string }> = {
    1: { label: "Weak", color: "bg-[#F43F5E]" },
    2: { label: "Fair", color: "bg-[#F59E0B]" },
    3: { label: "Good", color: "bg-teal-500" },
    4: { label: "Strong", color: "bg-indigo-600" },
    5: { label: "Strong", color: "bg-indigo-600" },
  };
  return { score: s, ...map[s] };
}

// ─── Step 1 — Email form ──────────────────────────────────────────────────────

function EmailStep({ onSuccess }: { onSuccess: (devToken?: string) => void }) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });

  const onSubmit = async (values: EmailForm) => {
    setServerError(null);
    try {
      const { data } = await api.post<{
        success: boolean;
        message: string;
        resetToken?: string; // dev only
      }>("/auth/forgot-password", { email: values.email });

      onSuccess(data.resetToken);
    } catch (err) {
      setServerError(
        parseApiError(err, "Something went wrong. Please try again."),
      );
    }
  };

  return (
    <>
      <div className="mb-7">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
          <KeyRound className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide mb-1">
          Forgot password?
        </h2>
        <p className="text-sm text-[#94A3B8]">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)] border border-[#FECDD3] dark:border-[rgba(244,63,94,0.28)] p-3.5 text-sm text-[#BE123C] dark:text-[#FDA4AF]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Email address" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={!!errors.email}
            leftIcon={<Mail className="w-4 h-4" />}
            autoFocus
            {...register("email")}
          />
        </Field>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isSubmitting}
        >
          Send Reset Link
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-[250ms]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      </div>
    </>
  );
}

// ─── Step 2 — Reset form ──────────────────────────────────────────────────────

function ResetStep({
  prefillToken,
  onSuccess,
}: {
  prefillToken: string;
  onSuccess: () => void;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { token: prefillToken },
  });

  const passwordValue = watch("newPassword", "");
  const strength = getStrength(passwordValue);

  const onSubmit = async (values: ResetForm) => {
    setServerError(null);
    try {
      await api.post("/auth/reset-password", {
        token: values.token,
        newPassword: values.newPassword,
      });
      onSuccess();
    } catch (err) {
      setServerError(
        parseApiError(
          err,
          "Could not reset password. The token may have expired.",
        ),
      );
    }
  };

  return (
    <>
      <div className="mb-7">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
          <Lock className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide mb-1">
          Set new password
        </h2>
        <p className="text-sm text-[#94A3B8]">
          Enter the reset token from your email and choose a new password.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.12)] border border-[#FECDD3] dark:border-[rgba(244,63,94,0.28)] p-3.5 text-sm text-[#BE123C] dark:text-[#FDA4AF]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Reset Token" error={errors.token?.message}>
          <Input
            type="text"
            autoComplete="one-time-code"
            placeholder="Paste token from your email"
            error={!!errors.token}
            leftIcon={<KeyRound className="w-4 h-4" />}
            {...register("token")}
          />
        </Field>

        <div className="h-px bg-[#E2E6ED] dark:bg-[#21262D]" />

        <Field label="New Password" error={errors.newPassword?.message}>
          <Input
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            error={!!errors.newPassword}
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
            {...register("newPassword")}
          />
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
                Strength:{" "}
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

        <Field label="Confirm Password" error={errors.confirmPassword?.message}>
          <Input
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat new password"
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

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isSubmitting}
        >
          Reset Password
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-[250ms]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      </div>
    </>
  );
}

// ─── Step 3 — Success ─────────────────────────────────────────────────────────

function SuccessStep() {
  return (
    <div className="text-center py-4">
      <div className="w-14 h-14 rounded-full bg-[#F0FDFA] dark:bg-[rgba(20,184,166,0.12)] flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 className="w-7 h-7 text-teal-500" />
      </div>
      <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide mb-2">
        Password reset!
      </h2>
      <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">
        Your password has been updated successfully.
        <br />
        Sign in with your new password.
      </p>
      <Link to={ROUTES.LOGIN}>
        <Button className="w-full" size="lg">
          Sign In
        </Button>
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const ForgotPasswordPage = () => {
  const location = useLocation();

  // If ?token= is in the URL (from email link), pre-fill step 2
  const urlToken = new URLSearchParams(location.search).get("token") ?? "";

  type Step = "email" | "reset" | "done";
  const [step, setStep] = useState<Step>(urlToken ? "reset" : "email");
  const [prefillToken, setPrefill] = useState(urlToken);

  // After email step: if dev token returned, auto-populate step 2
  const handleEmailSuccess = (devToken?: string) => {
    if (devToken) setPrefill(devToken);
    setStep("reset");
  };

  return (
    <>
      {step === "email" && <EmailStep onSuccess={handleEmailSuccess} />}
      {step === "reset" && (
        <ResetStep
          prefillToken={prefillToken}
          onSuccess={() => setStep("done")}
        />
      )}
      {step === "done" && <SuccessStep />}
    </>
  );
};

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { Button, Field, Input } from "../../components/ui";
import { ROUTES } from "../../config/routes";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    ROUTES.DASHBOARD;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Login failed. Please try again.";
      setServerError(msg);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide mb-1">
          Welcome back
        </h2>
        <p className="text-sm text-[#94A3B8]">
          Sign in to continue to TeamTasks
        </p>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-[#FFF1F2] dark:bg-coral-500/12 border border-[#FECDD3] dark:border-coral-500/28 p-3.5 text-sm text-[#BE123C] dark:text-[#FDA4AF]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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

        {/* Password */}
        <Field label="Password" error={errors.password?.message}>
          <Input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            error={!!errors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-[#94A3B8] hover:text-[#475569] dark:hover:text-[#8B949E] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            {...register("password")}
          />
        </Field>

        {/* Forgot password */}
        <div className="flex justify-end -mt-1">
          <Link
            to="#"
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

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[#E2E6ED] dark:bg-[#21262D]" />
        <span className="text-[11px] text-[#94A3B8] uppercase tracking-widest">
          or
        </span>
        <div className="flex-1 h-px bg-[#E2E6ED] dark:bg-[#21262D]" />
      </div>

      <p className="text-center text-sm text-[#94A3B8]">
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

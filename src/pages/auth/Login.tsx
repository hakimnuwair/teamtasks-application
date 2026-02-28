import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/Button";
import { ROUTES } from "../../config/routes";
import { cn } from "../../utils/cn";

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

  // Where to send the user after login (supports redirect-back)
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
    } catch (err: unknown) {
      // axios error shape: err.response.data.message
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Login failed. Please try again.";
      setServerError(msg);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">
        Welcome back
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        Sign in to your account
      </p>

      {serverError && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-sm text-red-600 dark:text-red-400">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
              className={cn(
                "w-full h-10 pl-9 pr-4 rounded-lg border text-sm bg-white dark:bg-zinc-800",
                "text-zinc-900 dark:text-white placeholder:text-zinc-400",
                "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow",
                errors.email
                  ? "border-red-400 dark:border-red-600"
                  : "border-zinc-300 dark:border-zinc-700",
              )}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              {...register("password")}
              className={cn(
                "w-full h-10 pl-9 pr-10 rounded-lg border text-sm bg-white dark:bg-zinc-800",
                "text-zinc-900 dark:text-white placeholder:text-zinc-400",
                "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow",
                errors.password
                  ? "border-red-400 dark:border-red-600"
                  : "border-zinc-300 dark:border-zinc-700",
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Don't have an account?{" "}
        <Link
          to={ROUTES.REGISTER}
          className="text-violet-600 dark:text-violet-400 font-medium hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
};

/**
 * pages/profile/Profile.tsx
 *
 * Sections:
 *   1. Profile hero — large avatar, name, email, joined date, role badge
 *   2. Account stats — groups joined, tasks created (from auth store data)
 *   3. Edit profile — update display name
 *   4. Change password — current + new + confirm
 *   5. Preferences — dark mode toggle, (extendable)
 *   6. Danger zone — logout with confirmation
 *
 * All API calls go through services/users.ts.
 * After a successful name update the authStore.setUser() is called so the
 * sidebar and topbar reflect the change instantly — no page reload needed.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  LogOut,
  ShieldCheck,
  Calendar,
  Users,
  CheckSquare,
  Moon,
  Sun,
  Edit3,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Bell,
  Palette,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { Button, Spinner } from "../../components/ui";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { useGroupStore } from "../../store/groupStore";
import { useTaskStore } from "../../store/taskStore";
import * as userService from "../../services/user";
import { ROUTES } from "../../config/routes";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatJoinDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function ProfileAvatar({
  name,
  size = "xl",
}: {
  name: string;
  size?: "xl" | "lg";
}) {
  const dim = size === "xl" ? "w-24 h-24 text-3xl" : "w-16 h-16 text-xl";
  return (
    <div
      className={cn(
        dim,
        "rounded-full flex items-center justify-center font-bold text-white shrink-0",
        "bg-gradient-to-br from-indigo-600 to-teal-500",
        "shadow-[0_0_0_4px_rgba(79,70,229,0.20),0_8px_24px_rgba(79,70,229,0.25)]",
        "dark:shadow-[0_0_0_4px_rgba(99,102,241,0.25),0_8px_24px_rgba(99,102,241,0.35)]",
      )}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
  danger,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-6",
        danger
          ? "bg-[#FFF8F8] dark:bg-[rgba(244,63,94,0.04)] border-[#FECDD3] dark:border-[rgba(244,63,94,0.20)]"
          : "bg-white dark:bg-[#161B22] border-[#E2E6ED] dark:border-[#21262D]",
        "shadow-[0_2px_8px_rgba(15,23,42,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.30)]",
      )}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            danger
              ? "bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.14)] text-[#F43F5E]"
              : "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)] text-indigo-600 dark:text-indigo-400",
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3
            className={cn(
              "text-sm font-semibold tracking-wide",
              danger
                ? "text-[#BE123C] dark:text-[#FDA4AF]"
                : "text-[#0F172A] dark:text-[#F0F6FC]",
            )}
          >
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Password input ───────────────────────────────────────────────────────────

function PasswordInput({
  placeholder,
  value,
  onChange,
  error,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full h-11 pl-10 pr-10 text-sm rounded-lg",
            "bg-white dark:bg-[#0D1117]",
            "text-[#0F172A] dark:text-[#F0F6FC] placeholder:text-[#94A3B8]",
            "border-[1.5px] focus:outline-none transition-all duration-[250ms]",
            "hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
            error
              ? "border-[#F43F5E] focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]"
              : "border-[#E2E6ED] dark:border-[#21262D] focus:border-indigo-600 dark:focus:border-[#818CF8] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]",
          )}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] dark:hover:text-[#8B949E] transition-colors duration-150"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-[#F43F5E]">{error}</p>}
    </div>
  );
}

// ─── Stat badge ───────────────────────────────────────────────────────────────

function StatBadge({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#E2E6ED] dark:border-[#21262D] bg-[#F8FAFC] dark:bg-[rgba(255,255,255,0.02)]">
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          bg,
          color,
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8]">
        {label}
      </p>
    </div>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#F8FAFC] dark:bg-[rgba(255,255,255,0.04)] text-[#94A3B8] shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0F172A] dark:text-[#F0F6FC]">
          {label}
        </p>
        <p className="text-xs text-[#94A3B8] mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          "relative w-11 h-6 rounded-full transition-all duration-[250ms] shrink-0 outline-none",
          "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
          checked
            ? "bg-gradient-to-r from-indigo-600 to-teal-500 shadow-sm"
            : "bg-[#E2E6ED] dark:bg-[#21262D]",
        )}
      >
        <span
          className={cn(
            "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-[250ms]",
            checked ? "left-6" : "left-1",
          )}
        />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useUIStore();
  const groups = useGroupStore((s) => s.groups);
  const tasks = useTaskStore((s) => s.tasks);

  // ── Edit profile ──────────────────────────────────────────────────────────
  const [editName, setEditName] = useState(user?.name ?? "");
  const [nameError, setNameError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Change password ───────────────────────────────────────────────────────
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdErrors, setPwdErrors] = useState<{
    cur?: string;
    new?: string;
    confirm?: string;
  }>({});
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // ── Logout confirm ────────────────────────────────────────────────────────
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const userId = user._id ?? user.id;

  // ── Save profile name ─────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setNameError("Name cannot be empty");
      return;
    }
    if (editName.trim().length > 50) {
      setNameError("Name must be under 50 characters");
      return;
    }
    if (editName.trim() === user.name) {
      toast("No changes to save");
      return;
    }

    setSavingProfile(true);
    setNameError("");
    try {
      const updated = await userService.updateProfile(userId, {
        name: editName.trim(),
      });
      setUser({ ...user, ...updated, name: updated.name ?? editName.trim() });
      toast.success("Profile updated!");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not update profile";
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    const errs: typeof pwdErrors = {};
    if (!curPwd) errs.cur = "Current password is required";
    if (newPwd.length < 8)
      errs.new = "New password must be at least 8 characters";
    if (newPwd !== confirmPwd) errs.confirm = "Passwords don't match";
    if (Object.keys(errs).length) {
      setPwdErrors(errs);
      return;
    }

    setSavingPwd(true);
    setPwdErrors({});
    try {
      await userService.changePassword(userId, {
        currentPassword: curPwd,
        newPassword: newPwd,
      });
      setPwdSuccess(true);
      setCurPwd("");
      setNewPwd("");
      setConfirmPwd("");
      toast.success("Password changed successfully!");
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not change password";
      if (
        msg.toLowerCase().includes("incorrect") ||
        msg.toLowerCase().includes("invalid")
      ) {
        setPwdErrors({ cur: "Current password is incorrect" });
      } else {
        toast.error(msg);
      }
    } finally {
      setSavingPwd(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate(ROUTES.LOGIN, { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const completedCount = tasks.filter(
    (r) => r.status === "COMPLETED",
  ).length;
  const pendingCount = tasks.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* ── Hero card ──────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative rounded-2xl border p-6 overflow-hidden",
          "bg-white dark:bg-[#161B22]",
          "border-[#E2E6ED] dark:border-[#21262D]",
          "shadow-[0_4px_24px_rgba(15,23,42,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.40)]",
        )}
      >
        {/* Background gradient blob */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-bl from-indigo-500/10 via-teal-400/10 to-transparent rounded-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative">
          <ProfileAvatar name={user.name} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F0F6FC] tracking-wide">
                {user.name}
              </h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide",
                  user.role === "ADMIN"
                    ? "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.18)] text-indigo-700 dark:text-indigo-300"
                    : "bg-[#F0FDFA] dark:bg-[rgba(20,184,166,0.14)] text-teal-700 dark:text-teal-300",
                )}
              >
                <ShieldCheck className="w-2.5 h-2.5" />
                {user.role}
              </span>
            </div>

            <p className="text-sm text-[#475569] dark:text-[#8B949E] mt-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              {user.email}
            </p>

            <p className="text-xs text-[#94A3B8] mt-1 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 shrink-0" />
              Member since {formatJoinDate(user.createdAt)}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <StatBadge
            icon={Users}
            label="Groups"
            value={groups.length}
            color="text-indigo-600 dark:text-indigo-400"
            bg="bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.14)]"
          />
          <StatBadge
            icon={CheckSquare}
            label="Completed"
            value={completedCount}
            color="text-teal-600 dark:text-teal-400"
            bg="bg-[#F0FDFA] dark:bg-[rgba(20,184,166,0.12)]"
          />
          <StatBadge
            icon={Bell}
            label="Pending"
            value={pendingCount}
            color="text-[#B45309] dark:text-[#FCD34D]"
            bg="bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.12)]"
          />
        </div>
      </div>

      {/* ── Edit profile ───────────────────────────────────────────────────── */}
      <Section
        icon={Edit3}
        title="Edit Profile"
        subtitle="Update your display name"
      >
        <div className="space-y-4">
          {/* Name field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#475569] dark:text-[#8B949E]">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
              <input
                type="text"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  setNameError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSaveProfile()}
                placeholder="Your display name"
                maxLength={50}
                className={cn(
                  "w-full h-11 pl-10 pr-14 text-sm rounded-lg",
                  "bg-white dark:bg-[#0D1117]",
                  "text-[#0F172A] dark:text-[#F0F6FC] placeholder:text-[#94A3B8]",
                  "border-[1.5px] focus:outline-none transition-all duration-[250ms]",
                  "hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
                  nameError
                    ? "border-[#F43F5E] focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]"
                    : "border-[#E2E6ED] dark:border-[#21262D] focus:border-indigo-600 dark:focus:border-[#818CF8] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]",
                )}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8]">
                {editName.length}/50
              </span>
            </div>
            {nameError && <p className="text-xs text-[#F43F5E]">{nameError}</p>}
          </div>

          {/* Email — read-only */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#475569] dark:text-[#8B949E]">
              Email Address
              <span className="ml-1.5 text-[10px] text-[#94A3B8] normal-case font-normal">
                read-only
              </span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
              <input
                type="email"
                value={user.email}
                disabled
                className={cn(
                  "w-full h-11 pl-10 pr-4 text-sm rounded-lg",
                  "bg-[#F8FAFC] dark:bg-[rgba(255,255,255,0.03)]",
                  "text-[#94A3B8] border-[1.5px] border-[#E2E6ED] dark:border-[#21262D]",
                  "cursor-not-allowed",
                )}
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              onClick={handleSaveProfile}
              isLoading={savingProfile}
              size="sm"
              leftIcon={<Check className="w-3.5 h-3.5" />}
              disabled={editName.trim() === user.name || !editName.trim()}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Section>

      {/* ── Change password ─────────────────────────────────────────────────── */}
      <Section
        icon={Lock}
        title="Change Password"
        subtitle="Use a strong password of at least 8 characters"
      >
        {pwdSuccess ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F0FDFA] dark:bg-[rgba(20,184,166,0.10)] border border-[#BBF7D0] dark:border-[rgba(20,184,166,0.25)]">
            <div className="w-8 h-8 rounded-lg bg-[#CCFBF1] dark:bg-[rgba(20,184,166,0.20)] flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
              Password changed successfully!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#475569] dark:text-[#8B949E]">
                Current Password
              </label>
              <PasswordInput
                placeholder="Enter current password"
                value={curPwd}
                onChange={(v) => {
                  setCurPwd(v);
                  setPwdErrors((e) => ({ ...e, cur: undefined }));
                }}
                error={pwdErrors.cur}
              />
            </div>

            <div className="h-px bg-[#E2E6ED] dark:bg-[#21262D]" />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#475569] dark:text-[#8B949E]">
                New Password
              </label>
              <PasswordInput
                placeholder="Minimum 8 characters"
                value={newPwd}
                onChange={(v) => {
                  setNewPwd(v);
                  setPwdErrors((e) => ({ ...e, new: undefined }));
                }}
                error={pwdErrors.new}
              />
              {/* Password strength bar */}
              {newPwd.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[8, 12, 16, 20].map((threshold, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex-1 h-1 rounded-full transition-all duration-[250ms]",
                          newPwd.length >= threshold
                            ? i < 1
                              ? "bg-[#F43F5E]"
                              : i < 2
                                ? "bg-[#F59E0B]"
                                : i < 3
                                  ? "bg-teal-500"
                                  : "bg-indigo-600"
                            : "bg-[#E2E6ED] dark:bg-[#21262D]",
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-[#94A3B8]">
                    {newPwd.length < 8
                      ? "Too short"
                      : newPwd.length < 12
                        ? "Weak"
                        : newPwd.length < 16
                          ? "Good"
                          : "Strong"}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#475569] dark:text-[#8B949E]">
                Confirm New Password
              </label>
              <PasswordInput
                placeholder="Repeat new password"
                value={confirmPwd}
                onChange={(v) => {
                  setConfirmPwd(v);
                  setPwdErrors((e) => ({ ...e, confirm: undefined }));
                }}
                error={pwdErrors.confirm}
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button
                onClick={handleChangePassword}
                isLoading={savingPwd}
                size="sm"
                disabled={!curPwd || !newPwd || !confirmPwd}
              >
                Change Password
              </Button>
            </div>
          </div>
        )}
      </Section>

      {/* ── Preferences ─────────────────────────────────────────────────────── */}
      <Section
        icon={Palette}
        title="Preferences"
        subtitle="Customise your experience"
      >
        <div className="space-y-4">
          <ToggleRow
            icon={isDarkMode ? Moon : Sun}
            label="Dark Mode"
            description="Switch between light and dark interface"
            checked={isDarkMode}
            onChange={toggleDarkMode}
          />
          <div className="h-px bg-[#E2E6ED] dark:bg-[#21262D]" />
          {/* Quick nav to other sections */}
          {[
            {
              label: "Manage tasks",
              to: ROUTES.TASKS,
              icon: CheckSquare,
            },
            { label: "View groups", to: ROUTES.GROUPS, icon: Users },
            { label: "Notifications", to: ROUTES.NOTIFICATIONS, icon: Bell },
          ].map(({ label, to, icon: Icon }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={cn(
                "w-full flex items-center gap-3 py-2 group",
                "text-[#475569] dark:text-[#8B949E] hover:text-[#0F172A] dark:hover:text-[#F0F6FC]",
                "transition-colors duration-[250ms]",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-sm text-left">{label}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-[250ms]" />
            </button>
          ))}
        </div>
      </Section>

      {/* ── Danger zone ─────────────────────────────────────────────────────── */}
      <Section icon={AlertTriangle} title="Danger Zone" danger>
        {!confirmLogout ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#0F172A] dark:text-[#F0F6FC]">
                Sign out
              </p>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                End your session on this device. You'll need to log back in.
              </p>
            </div>
            <button
              onClick={() => setConfirmLogout(true)}
              className={cn(
                "flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium shrink-0",
                "border border-[#FECDD3] dark:border-[rgba(244,63,94,0.30)]",
                "text-[#BE123C] dark:text-[#FDA4AF]",
                "bg-white dark:bg-transparent",
                "hover:bg-[#FFF1F2] dark:hover:bg-[rgba(244,63,94,0.08)]",
                "transition-all duration-[250ms]",
              )}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FFF1F2] dark:bg-[rgba(244,63,94,0.10)] border border-[#FECDD3] dark:border-[rgba(244,63,94,0.25)]">
              <AlertTriangle className="w-4 h-4 text-[#F43F5E] shrink-0 mt-0.5" />
              <p className="text-sm text-[#BE123C] dark:text-[#FDA4AF]">
                Are you sure you want to sign out? Your session will end
                immediately.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setConfirmLogout(false)}
                disabled={loggingOut}
              >
                Cancel
              </Button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className={cn(
                  "flex-1 h-9 px-4 rounded-xl text-sm font-medium",
                  "flex items-center justify-center gap-2",
                  "bg-[#F43F5E] hover:bg-[#E11D48] text-white",
                  "shadow-sm shadow-[rgba(244,63,94,0.30)] hover:shadow-[rgba(244,63,94,0.45)]",
                  "active:scale-[0.98] transition-all duration-[250ms]",
                  loggingOut &&
                    "opacity-60 cursor-not-allowed pointer-events-none",
                )}
              >
                {loggingOut ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
};

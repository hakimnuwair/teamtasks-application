import { Moon, SunMedium } from "lucide-react";
import { useUIStore } from "../../store/uiStore";
import { useAuthStore } from "../../store/authStore";

interface TopbarProps {
  title: string;
  actions?: React.ReactNode;
}

export const Topbar = ({ title, actions }: TopbarProps) => {
  const { isDarkMode, toggleDarkMode } = useUIStore();
  const { user } = useAuthStore();

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        {actions}
        <button
          onClick={toggleDarkMode}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title={isDarkMode ? "Light mode" : "Dark mode"}
        >
          {isDarkMode ? (
            <SunMedium className="w-4 h-4 text-slate-300" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {user?.role && (
            <span className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 font-medium">
              {user.role}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

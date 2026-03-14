/**
 * components/ui/AsyncUserSelect.tsx
 *
 * Custom async multi-select for user search.
 * No react-select — built from scratch with React + Tailwind.
 *
 * Features:
 *  - Debounced search (300ms) via searchUsers service
 *  - Selected users shown as dismissible chips inside the input
 *  - Dropdown shows avatar initials + name + email
 *  - Already-selected and existing-member users are greyed out / excluded
 *  - Keyboard: ArrowUp/Down to navigate, Enter to select, Escape to close
 *  - Click outside to close
 *  - Full dark mode
 */

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { Search, X, Loader2, UserCheck } from "lucide-react";
import { cn } from "../../utils/cn";
import { searchUsers, type UserSearchResult } from "../../services/user";

// ─── Avatar initials ──────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "from-indigo-500 to-teal-400",
  "from-violet-500 to-indigo-400",
  "from-teal-500 to-emerald-400",
  "from-rose-500 to-pink-400",
  "from-amber-500 to-orange-400",
  "from-cyan-500 to-blue-400",
];
function avatarColor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function MiniAvatar({ name }: { name: string }) {
  return (
    <span
      className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
        "bg-gradient-to-br text-white text-[8px] font-bold",
        avatarColor(name),
      )}
    >
      {getInitials(name)}
    </span>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectedUser {
  _id: string;
  name: string;
  email: string;
}

interface Props {
  selected: SelectedUser[];
  onChange: (users: SelectedUser[]) => void;
  /** Emails already in the group — they will not appear in results */
  excludeEmails?: string[];
  placeholder?: string;
  error?: boolean;
  autoFocus?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AsyncUserSelect({
  selected,
  onChange,
  excludeEmails = [],
  placeholder = "Search by name or email…",
  error = false,
  autoFocus = false,
}: Props) {
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedIdx, setFocused] = useState(-1);

  // Debounced search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setLoading(true);
      try {
        const data = await searchUsers(q);
        // Filter already selected + existing members
        const selectedIds = new Set(selected.map((u) => u._id));
        const excludedMails = new Set(
          excludeEmails.map((e) => e.toLowerCase()),
        );
        const filtered = data.filter(
          (u) =>
            !selectedIds.has(u._id) &&
            !excludedMails.has(u.email.toLowerCase()),
        );
        setResults(filtered);
        setIsOpen(true);
        setFocused(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [selected, excludeEmails],
  );

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    searchTimer.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, doSearch]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectUser = (u: UserSearchResult) => {
    onChange([...selected, u]);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeUser = (id: string) => {
    onChange(selected.filter((u) => u._id !== id));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocused((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && focusedIdx >= 0 && results[focusedIdx]) {
      e.preventDefault();
      selectUser(results[focusedIdx]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Backspace" && !query && selected.length > 0) {
      removeUser(selected[selected.length - 1]._id);
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIdx >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-option]");
      items[focusedIdx]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIdx]);

  const isEmpty = results.length === 0 && isOpen && !loading && query.trim();

  return (
    <div ref={containerRef} className="relative">
      {/* Input wrapper — shows chips + text input */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "min-h-[44px] w-full px-3 py-2",
          "flex flex-wrap items-center gap-1.5 cursor-text",
          "bg-white dark:bg-[#0D1117]",
          "border-[1.5px] rounded-lg",
          "transition-all duration-[250ms]",
          "hover:border-[#C8CDD8] dark:hover:border-[#30363D]",
          error
            ? "border-[#F43F5E] shadow-[0_0_0_3px_rgba(244,63,94,0.15)]"
            : isOpen
              ? "border-indigo-600 dark:border-[#818CF8] shadow-[0_0_0_3px_rgba(79,70,229,0.15)]"
              : "border-[#E2E6ED] dark:border-[#21262D]",
        )}
      >
        {/* Chips */}
        {selected.map((u) => (
          <span
            key={u._id}
            className={cn(
              "inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5",
              "rounded-full text-[11px] font-medium max-w-[160px]",
              "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.18)]",
              "text-[#4338CA] dark:text-[#A5B4FC]",
              "border border-[#C7D2FE] dark:border-[rgba(99,102,241,0.30)]",
            )}
          >
            <MiniAvatar name={u.name} />
            <span className="truncate max-w-[90px]">{u.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeUser(u._id);
              }}
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-[rgba(99,102,241,0.35)] transition-colors duration-150 shrink-0"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}

        {/* Text input */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-[#94A3B8] animate-spin shrink-0" />
          ) : (
            <Search className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
          )}
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={query}
            placeholder={selected.length === 0 ? placeholder : "Add more…"}
            autoFocus={autoFocus}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            className={cn(
              "flex-1 bg-transparent text-sm outline-none",
              "text-[#0F172A] dark:text-[#F0F6FC]",
              "placeholder:text-[#94A3B8]",
            )}
          />
        </div>
      </div>

      {/* Dropdown */}
      {(isOpen || loading) && (results.length > 0 || isEmpty) && (
        <div
          className={cn(
            "absolute z-50 left-0 right-0 mt-1.5",
            "rounded-xl border shadow-[0_8px_32px_rgba(15,23,42,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.50)]",
            "bg-white dark:bg-[#161B22]",
            "border-[#E2E6ED] dark:border-[#21262D]",
            "overflow-hidden",
          )}
        >
          {isEmpty ? (
            <div className="flex items-center gap-3 px-4 py-3.5 text-sm text-[#94A3B8]">
              <UserCheck className="w-4 h-4 shrink-0" />
              No users found for "{query}"
            </div>
          ) : (
            <ul ref={listRef} className="max-h-[220px] overflow-y-auto py-1">
              {results.map((u, i) => (
                <li
                  key={u._id}
                  data-option
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectUser(u);
                  }}
                  onMouseEnter={() => setFocused(i)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-150",
                    focusedIdx === i
                      ? "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.12)]"
                      : "hover:bg-[#F8FAFC] dark:hover:bg-[rgba(255,255,255,0.04)]",
                  )}
                >
                  <MiniAvatar name={u.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] dark:text-[#F0F6FC] truncate">
                      {u.name}
                    </p>
                    <p className="text-xs text-[#94A3B8] truncate">{u.email}</p>
                  </div>
                  {focusedIdx === i && (
                    <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 shrink-0">
                      Enter ↵
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * store/activityStore.ts — Zustand store for activity logs
 */
import { create } from "zustand";
import type { ActivityLog, Pagination } from "../types/types";

interface ActivityState {
  logs: ActivityLog[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  setLogs: (logs: ActivityLog[], pagination: Pagination) => void;
  prependLog: (log: ActivityLog) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  logs: [],
  pagination: null,
  isLoading: false,
  error: null,
  setLogs: (logs, pagination) => set({ logs, pagination }),
  prependLog: (log) => set((s) => ({ logs: [log, ...s.logs] })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ logs: [], pagination: null }),
}));

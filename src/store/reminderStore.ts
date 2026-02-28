import { create } from "zustand";
import type { Reminder, ReminderStatus, Priority } from "../types/types";

interface ReminderFilters {
  status?: ReminderStatus;
  priority?: Priority;
  page: number;
  limit: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ReminderState {
  reminders: Reminder[];
  filters: ReminderFilters;
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;

  // Actions — services call these to update state
  setReminders: (reminders: Reminder[], pagination: Pagination) => void;
  addReminder: (reminder: Reminder) => void;
  updateReminder: (reminder: Reminder) => void;
  removeReminder: (id: string) => void;
  setFilters: (filters: Partial<ReminderFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useReminderStore = create<ReminderState>((set) => ({
  reminders: [],
  filters: { page: 1, limit: 20 },
  pagination: null,
  isLoading: false,
  error: null,

  setReminders: (reminders, pagination) => set({ reminders, pagination }),
  addReminder: (reminder) =>
    set((s) => ({ reminders: [reminder, ...s.reminders] })),
  updateReminder: (reminder) =>
    set((s) => ({
      reminders: s.reminders.map((r) =>
        r._id === reminder._id ? reminder : r,
      ),
    })),
  removeReminder: (id) =>
    set((s) => ({ reminders: s.reminders.filter((r) => r._id !== id) })),
  setFilters: (filters) =>
    set((s) => ({ filters: { ...s.filters, ...filters } })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

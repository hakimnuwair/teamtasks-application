import { create } from "zustand";
import type { Task, TaskStatus, Priority } from "../types/types";

interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  groupId?: string;
  page: number;
  limit: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TaskState {
  tasks: Task[];
  filters: TaskFilters;
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;

  // Actions — services call these to update state
  setTasks: (tasks: Task[], pagination: Pagination) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (id: string) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  filters: { page: 1, limit: 20 },
  pagination: null,
  isLoading: false,
  error: null,

  setTasks: (tasks, pagination) => set({ tasks, pagination }),
  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  updateTask: (task) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t._id === task._id ? task : t)),
    })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t._id !== id) })),
  setFilters: (filters) =>
    set((s) => ({ filters: { ...s.filters, ...filters } })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

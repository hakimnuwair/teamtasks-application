/**
 * store/groupStore.ts — Zustand store for groups
 */
import { create } from "zustand";
import type { Group } from "../types/types";

interface GroupState {
  groups: Group[];
  isLoading: boolean;
  error: string | null;
  setGroups: (groups: Group[]) => void;
  addGroup: (g: Group) => void;
  updateGroup: (g: Group) => void;
  removeGroup: (id: string) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  isLoading: false,
  error: null,
  setGroups: (groups) => set({ groups }),
  addGroup: (group) => set((s) => ({ groups: [group, ...s.groups] })),
  updateGroup: (group) =>
    set((s) => ({
      groups: s.groups.map((g) => (g._id === group._id ? group : g)),
    })),
  removeGroup: (id) =>
    set((s) => ({ groups: s.groups.filter((g) => g._id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

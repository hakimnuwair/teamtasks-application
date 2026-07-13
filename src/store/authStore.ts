/**
 * store/authStore.ts
 *
 * Manages auth state: user, isAuthenticated, isInitializing.
 *
 * normalizeUser: ensures user.id and user._id are always plain strings.
 * login/initialize fetch user, store token, connect socket.
 * logout: clears token, disconnects socket, and resets all dependent stores
 *   (notificationStore, groupStore, taskStore, activityStore) so stale
 *   data from the previous session is never shown to the next user on the
 *   same device.
 */

import { create } from "zustand";
import type { User, LoginPayload, RegisterPayload } from "../types/types";
import { tokenManager } from "../utils/tokenManager";
import { connectSocket, disconnectSocket } from "../config/socket";
import api from "../config/axios";

function normalizeUser(raw: Record<string, unknown>): User {
  if (!raw) return raw as unknown as User;
  const _id = String(raw._id ?? raw.id ?? "");
  return { ...(raw as unknown as User), id: _id, _id };
}

// Lazy imports to avoid circular deps — stores imported at call time
const resetDependentStores = () => {
  // Dynamic import so this file doesn't create circular import chains
  import("./notificationStore").then((m) => {
    m.useNotificationStore.setState({ notifications: [], unreadCount: 0 });
  });
  import("./groupStore").then((m) => {
    m.useGroupStore.setState({ groups: [], isLoading: false, error: null });
  });
  import("./taskStore").then((m) => {
    m.useTaskStore.setState({
      tasks: [],
      pagination: null,
      filters: { page: 1, limit: 20 },
    });
  });
  import("./activityStore").then((m) => {
    m.useActivityStore.setState({ logs: [], pagination: null });
  });
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  initialize: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  initialize: async () => {
    try {
      const { data } = await api.get<Record<string, unknown>>("/auth/me");
      const user = normalizeUser(data);
      set({ user, isAuthenticated: true });
      connectSocket(user.id);
    } catch {
      tokenManager.clear();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isInitializing: false });
    }
  },

  login: async (payload: LoginPayload) => {
    const { data } = await api.post<{
      success: boolean;
      message: string;
      accessToken: string;
      user: Record<string, unknown>;
    }>("/auth/login", payload);

    tokenManager.set(data.accessToken);
    const user = normalizeUser(data.user);
    set({ user, isAuthenticated: true, isInitializing: false });
    connectSocket(user.id);
  },

  register: async (payload: RegisterPayload) => {
    await api.post("/auth/register", payload);
    await get().login({ email: payload.email, password: payload.password });
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      tokenManager.clear();
      disconnectSocket();
      resetDependentStores();
      set({ user: null, isAuthenticated: false });
    }
  },

  setUser: (user: User) =>
    set({ user: normalizeUser(user as unknown as Record<string, unknown>) }),
}));

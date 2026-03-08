import { create } from "zustand";
import type { User, LoginPayload, RegisterPayload } from "../types/types";
import { tokenManager } from "../utils/tokenManager";
import { connectSocket, disconnectSocket } from "../config/socket";
import api from "../config/axios";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean; // true while we check if session is still valid on page load

  // Actions
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

  /**
   * Called ONCE on app mount.
   * Tries to restore the session by hitting /auth/me.
   * The axios interceptor will silently refresh the token if needed.
   */
  initialize: async () => {
    try {
      const { data } = await api.get<{ success: boolean; data: User }>(
        "/auth/me",
      );
      // /auth/me returns the user; the interceptor may have already set a new token
      set({ user: data.data, isAuthenticated: true });
      // connectSocket(data.data.id);
    } catch {
      // Session is dead — user stays logged out, no redirect here (router handles it)
      tokenManager.clear();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isInitializing: false });
    }
  },

  login: async (payload: LoginPayload) => {
    const { data } = await api.post<{ accessToken: string; user: User }>(
      "/auth/login",
      payload,
    );
    tokenManager.set(data.accessToken);
    set({ user: data.user, isAuthenticated: true });
    // connectSocket(data.user.id);
  },

  register: async (payload: RegisterPayload) => {
    await api.post("/auth/register", payload);
    // Auto-login after register
    await get().login({ email: payload.email, password: payload.password });
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      tokenManager.clear();
      disconnectSocket();
      set({ user: null, isAuthenticated: false });
    }
  },

  setUser: (user: User) => set({ user }),
}));

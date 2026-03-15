/**
 * store/authStore.ts
 *
 * Manages auth state: user, isAuthenticated, isInitializing.
 *
 * normalizeUser: ensures user.id and user._id are always plain strings.
 * Needed because lean() Mongoose objects return _id as ObjectId with no .id getter,
 * while login response user has { id } but no { _id }.
 *
 * initialize: called once on app mount (and by OAuthCallbackPage after token storage).
 *   GET /auth/me → { success, message, _id, name, email, ... } (user fields at root)
 *
 * login: POST /auth/login → { success, message, accessToken, user: { id, name, email, role } }
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
      set({ user: null, isAuthenticated: false });
    }
  },

  setUser: (user: User) =>
    set({ user: normalizeUser(user as unknown as Record<string, unknown>) }),
}));

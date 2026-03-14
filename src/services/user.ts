/**
 * services/users.ts — User API calls.
 *
 * Endpoints (from backend userRoutes.js):
 *   GET    /users/search?q=    → search users by name/email
 *   GET    /users/:id          → get user by ID
 *   PATCH  /users/:id          → update profile fields (name, email)
 *
 * Password change is handled via a separate auth route if it exists,
 * or falls back to PATCH /users/:id with { currentPassword, newPassword }.
 */

import api from "../config/axios";
import type { User, ApiResponse } from "../types/types";

export interface UserSearchResult {
  _id: string;
  name: string;
  email: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** Search users by name or email (for invite flows). */
export const searchUsers = async (
  query: string,
): Promise<UserSearchResult[]> => {
  if (!query.trim()) return [];
  const { data } = await api.get<ApiResponse<UserSearchResult[]>>(
    `/users/search?q=${encodeURIComponent(query.trim())}`,
  );
  return data.data ?? [];
};

/** Get a user by ID. */
export const getUserById = async (id: string): Promise<User> => {
  const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
  return data.data;
};

/** Update display name or email. Backend: PATCH /users/:id */
export const updateProfile = async (
  id: string,
  payload: UpdateProfilePayload,
): Promise<User> => {
  const { data } = await api.patch<ApiResponse<User>>(`/users/${id}`, payload);
  return data.data;
};

/** Change password. PATCH /users/:id with password fields. */
export const changePassword = async (
  id: string,
  payload: ChangePasswordPayload,
): Promise<void> => {
  await api.patch(`/users/${id}`, payload);
};

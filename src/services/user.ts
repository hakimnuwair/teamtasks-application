/**
 * services/users.ts
 *
 * GET  /users/search?q= → { success, message, data: UserSearchResult[] }  (array → body.data)
 * GET  /users/:id       → { success, message, ...userFields }              (object flat)
 * PATCH /users/:id      → { success, message, ...userFields }
 */
import api from "../config/axios";
import type { User } from "../types/types";

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

export const searchUsers = async (
  query: string,
): Promise<UserSearchResult[]> => {
  if (!query.trim()) return [];
  const { data } = await api.get<{
    success: boolean;
    message: string;
    data: UserSearchResult[];
  }>(`/users/search?q=${encodeURIComponent(query.trim())}`);
  return data.data ?? [];
};

export const getUserById = async (id: string): Promise<User> => {
  const { data } = await api.get<User & { success: boolean; message: string }>(
    `/users/${id}`,
  );
  return data;
};

export const updateProfile = async (
  id: string,
  payload: UpdateProfilePayload,
): Promise<User> => {
  const { data } = await api.patch<
    User & { success: boolean; message: string }
  >(`/users/${id}`, payload);
  return data;
};

export const changePassword = async (
  id: string,
  payload: ChangePasswordPayload,
): Promise<void> => {
  await api.patch(`/users/${id}`, payload);
};

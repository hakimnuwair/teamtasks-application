/**
 * services/group.ts — Group API calls
 * Types are imported from types/types.ts (no local re-declarations).
 */
import api from "../config/axios";
import type {
  Group,
  ApiResponse,
  PaginatedResponse,
  CreateGroupPayload,
  InviteMemberPayload,
} from "../types/types";

export type { CreateGroupPayload, InviteMemberPayload };

export const getGroups = async (): Promise<Group[]> => {
  const { data } = await api.get<PaginatedResponse<Group>>("/groups");
  return data.groups ?? data.data ?? [];
};

export const getGroupById = async (id: string): Promise<Group> => {
  const { data } = await api.get<ApiResponse<Group>>(`/groups/${id}`);
  return data.data;
};

export const createGroup = async (
  payload: CreateGroupPayload,
): Promise<Group> => {
  const { data } = await api.post<ApiResponse<Group>>("/groups", payload);
  return data.data;
};

export const updateGroup = async (
  id: string,
  payload: Partial<CreateGroupPayload>,
): Promise<Group> => {
  const { data } = await api.put<ApiResponse<Group>>(`/groups/${id}`, payload);
  return data.data;
};

export const deleteGroup = async (id: string): Promise<void> => {
  await api.delete(`/groups/${id}`);
};

export const inviteMember = async (
  groupId: string,
  payload: InviteMemberPayload,
): Promise<Group> => {
  const { data } = await api.post<ApiResponse<Group>>(
    `/groups/${groupId}/members`,
    payload,
  );
  return data.data;
};

export const removeMember = async (
  groupId: string,
  memberId: string,
): Promise<Group> => {
  const { data } = await api.delete<ApiResponse<Group>>(
    `/groups/${groupId}/members/${memberId}`,
  );
  return data.data;
};

/**
 * services/group.ts — Group CRUD API calls only.
 *
 * All invitation calls live in services/invitation.ts and match the
 * backend router at /api/invitations/*.
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

/**
 * removeMember — DELETE /groups/:groupId/members/:memberId
 * Backend returns { message } not a full Group — so we return void and
 * let the caller reload the group via getGroupById.
 */
export const removeMember = async (
  groupId: string,
  memberId: string,
): Promise<void> => {
  await api.delete(`/groups/${groupId}/members/${memberId}`);
};

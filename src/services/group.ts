/**
 * services/group.ts
 *
 * GET /groups       → { success, message, data: Group[] }      (array → body.data)
 * GET /groups/:id   → { success, message, ...groupFields }      (object → flat)
 * POST /groups      → { success, message, ...groupFields }      (201)
 * PATCH /groups/:id → { success, message, ...groupFields }
 * DELETE /groups/:id → { success, message }
 * DELETE /groups/:id/members/:uid → { success, message }
 */
import api from "../config/axios";
import type {
  Group,
  CreateGroupPayload,
  InviteMemberPayload,
} from "../types/types";

export type { CreateGroupPayload, InviteMemberPayload };

export const getGroups = async (): Promise<Group[]> => {
  const { data } = await api.get<{
    success: boolean;
    message: string;
    data: Group[];
  }>("/groups");
  return data.data ?? [];
};

export const getGroupById = async (id: string): Promise<Group> => {
  const { data } = await api.get<Group & { success: boolean; message: string }>(
    `/groups/${id}`,
  );
  return data;
};

export const createGroup = async (
  payload: CreateGroupPayload,
): Promise<Group> => {
  const { data } = await api.post<
    Group & { success: boolean; message: string }
  >("/groups", payload);
  return data;
};

export const updateGroup = async (
  id: string,
  payload: Partial<CreateGroupPayload>,
): Promise<Group> => {
  const { data } = await api.patch<
    Group & { success: boolean; message: string }
  >(`/groups/${id}`, payload);
  return data;
};

export const deleteGroup = async (id: string): Promise<void> => {
  await api.delete(`/groups/${id}`);
};

export const removeMember = async (
  groupId: string,
  memberId: string,
): Promise<void> => {
  await api.delete(`/groups/${groupId}/members/${memberId}`);
};

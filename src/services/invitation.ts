/**
 * services/invitation.ts
 */
import api from "../config/axios";
import type { GroupInvitation, InviteMemberPayload } from "../types/types";

export const sendInvitation = async (
  groupId: string,
  payload: InviteMemberPayload,
): Promise<GroupInvitation> => {
  const { data } = await api.post<
    GroupInvitation & { success: boolean; message: string }
  >(`/invitations/groups/${groupId}/invite`, payload);
  return data;
};

export const getMyInvitations = async (): Promise<GroupInvitation[]> => {
  const { data } = await api.get<{
    success: boolean;
    message: string;
    data: GroupInvitation[];
  }>("/invitations/me");
  // Always unwrap the nested data array — never return the wrapper object
  return Array.isArray(data?.data) ? data.data : [];
};

/**
 * GET /groups/:groupId/invitations
 * Response shape: { success: true, data: GroupInvitation[] }
 *
 * IMPORTANT: unwrap data.data, not data — axios puts the whole response
 * body in res.data, so the array lives at res.data.data.
 */
export const getSentInvitationsForGroup = async (
  groupId: string,
): Promise<GroupInvitation[]> => {
  const { data } = await api.get<{
    success: boolean;
    data: GroupInvitation[];
  }>(`/groups/${groupId}/invitations`);
  // data here is { success, data: [...] } — return the inner array
  return Array.isArray(data?.data) ? data.data : [];
};

export const respondToInvitation = async (
  invitationId: string,
  accept: boolean,
): Promise<{ accepted: boolean }> => {
  const { data } = await api.patch<{
    success: boolean;
    message: string;
    accepted: boolean;
  }>(`/invitations/${invitationId}/respond`, { accept });
  return { accepted: data.accepted };
};

export const cancelInvitation = async (invitationId: string): Promise<void> => {
  await api.patch(`/invitations/${invitationId}/cancel`);
};

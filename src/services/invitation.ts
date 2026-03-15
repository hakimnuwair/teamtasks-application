/**
 * services/invitation.ts
 *
 * POST /invitations/groups/:id/invite → { success, message, ...invitationFields }  (201, object flat)
 * GET  /invitations/me                → { success, message, data: GroupInvitation[] } (array → body.data)
 * PATCH /invitations/:id/respond      → { success, message, ...resultFields }
 * PATCH /invitations/:id/cancel       → { success, message }
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
  return data.data ?? [];
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

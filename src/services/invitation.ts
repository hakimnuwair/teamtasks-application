/**
 * services/invitation.ts
 *
 * Matches backend invitation router exactly:
 *   POST   /api/invitations/groups/:groupId/invite   → sendInvitation
 *   GET    /api/invitations/me                        → getMyInvitations
 *   PATCH  /api/invitations/:id/respond               → respondToInvitation  { accept: boolean }
 *   PATCH  /api/invitations/:id/cancel                → cancelInvitation
 *
 * Note: there is no GET /groups/:groupId/invitations on the backend.
 * Pending invitations are fetched per-user via GET /invitations/me.
 */

import api from "../config/axios";
import type {
  GroupInvitation,
  InviteMemberPayload,
  ApiResponse,
} from "../types/types";

// Send a group invitation (admin only)
// POST /api/invitations/groups/:groupId/invite
export const sendInvitation = async (
  groupId: string,
  payload: InviteMemberPayload,
): Promise<GroupInvitation> => {
  const { data } = await api.post<ApiResponse<GroupInvitation>>(
    `/invitations/groups/${groupId}/invite`,
    payload,
  );
  return data.data;
};

// Get the current user's incoming pending invitations
// GET /api/invitations/me
export const getMyInvitations = async (): Promise<GroupInvitation[]> => {
  const { data } =
    await api.get<ApiResponse<GroupInvitation[]>>("/invitations/me");
  return data.data ?? [];
};

// Accept or decline an invitation
// PATCH /api/invitations/:id/respond  { accept: boolean }
export const respondToInvitation = async (
  invitationId: string,
  accept: boolean,
): Promise<{ accepted: boolean }> => {
  const { data } = await api.patch<ApiResponse<{ accepted: boolean }>>(
    `/invitations/${invitationId}/respond`,
    { accept },
  );
  return data.data;
};

// Cancel a pending invitation (admin only)
// PATCH /api/invitations/:id/cancel
export const cancelInvitation = async (invitationId: string): Promise<void> => {
  await api.patch(`/invitations/${invitationId}/cancel`);
};

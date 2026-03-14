import { useEffect, useCallback, useState } from "react";
import toast from "react-hot-toast";
import * as invitationService from "../services/invitation";
import type { GroupInvitation } from "../types/types";

/**
 * Hook for the logged-in user's incoming group invitations.
 * Call respond(id, true) to accept, respond(id, false) to decline.
 */
export const useInvitations = () => {
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInvitations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await invitationService.getMyInvitations();
      setInvitations(data);
    } catch {
      // silently ignore — non-critical background fetch
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const respond = async (invitationId: string, accept: boolean) => {
    try {
      await invitationService.respondToInvitation(invitationId, accept);
      toast.success(accept ? "Joined group!" : "Invitation declined");
      // Remove from local list immediately; group list will re-fetch on next mount
      setInvitations((prev) => prev.filter((i) => i._id !== invitationId));
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not respond to invitation";
      toast.error(msg);
    }
  };

  return { invitations, isLoading, fetchInvitations, respond };
};

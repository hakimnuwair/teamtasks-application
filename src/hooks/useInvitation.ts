/**
 * hooks/useInvitations.ts
 *
 * Wraps invitation service calls so components never import services directly.
 *
 * Architecture: Component → useInvitations → invitationService → backend
 */
import { useState, useCallback } from "react";
import * as invitationService from "../services/invitation";
import toast from "react-hot-toast";
import type { GroupInvitation } from "../types/types";

export const useInvitations = () => {
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMyInvitations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await invitationService.getMyInvitations();
      setInvitations(data);
    } catch {
      // Fail silently — not critical
    } finally {
      setIsLoading(false);
    }
  }, []);

  const respond = useCallback(
    async (invitationId: string, accept: boolean, groupName?: string) => {
      try {
        await invitationService.respondToInvitation(invitationId, accept);
        toast.success(
          accept
            ? `Joined ${groupName ?? "the group"}!`
            : "Invitation declined",
        );
        setInvitations((prev) => prev.filter((i) => i._id !== invitationId));
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Could not respond to invitation",
        );
        throw err;
      }
    },
    [],
  );

  const cancel = useCallback(async (invitationId: string) => {
    try {
      await invitationService.cancelInvitation(invitationId);
      toast.success("Invitation cancelled");
      setInvitations((prev) => prev.filter((i) => i._id !== invitationId));
    } catch {
      toast.error("Could not cancel invitation");
    }
  }, []);

  return {
    invitations,
    isLoading,
    fetchMyInvitations,
    respond,
    cancel,
    setInvitations,
  };
};

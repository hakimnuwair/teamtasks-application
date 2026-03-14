/**
 * hooks/useGroups.ts — Groups data hook.
 *
 * invite() → invitationService.sendInvitation (POST /invitations/groups/:id/invite)
 * removeMember() → groupService.removeMember  (DELETE /groups/:id/members/:memberId)
 */
import { useEffect, useCallback } from "react";
import { useGroupStore } from "../store/groupStore";
import * as groupService from "../services/group";
import * as invitationService from "../services/invitation";
import toast from "react-hot-toast";
import type { CreateGroupPayload, InviteMemberPayload } from "../types/types";

export const useGroups = () => {
  const {
    groups,
    isLoading,
    error,
    setGroups,
    addGroup,
    removeGroup,
    setLoading,
    setError,
  } = useGroupStore();

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await groupService.getGroups();
      setGroups(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, [setGroups, setLoading, setError]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const create = async (payload: CreateGroupPayload) => {
    try {
      const group = await groupService.createGroup(payload);
      addGroup(group);
      toast.success("Group created!");
      return group;
    } catch {
      toast.error("Failed to create group");
      throw new Error("Failed to create group");
    }
  };

  const remove = async (id: string) => {
    try {
      await groupService.deleteGroup(id);
      removeGroup(id);
      toast.success("Group deleted");
    } catch {
      toast.error("Could not delete group");
    }
  };

  /**
   * Sends an invitation via the invitation service.
   * The invited user appears as a group member only AFTER they accept.
   */
  const invite = async (groupId: string, payload: InviteMemberPayload) => {
    try {
      await invitationService.sendInvitation(groupId, payload);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not send invitation";
      toast.error(msg);
      throw err;
    }
  };

  /**
   * Removes a member. Re-fetches the group list so member counts update.
   */
  const removeMember = async (groupId: string, memberId: string) => {
    try {
      await groupService.removeMember(groupId, memberId);
      await fetchGroups();
      toast.success("Member removed");
    } catch {
      toast.error("Could not remove member");
    }
  };

  return {
    groups,
    isLoading,
    error,
    fetchGroups,
    create,
    remove,
    invite,
    removeMember,
  };
};

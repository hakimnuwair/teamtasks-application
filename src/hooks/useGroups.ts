/**
 * hooks/useGroups.ts — Groups data hook
 */
import { useEffect, useCallback } from "react";
import { useGroupStore } from "../store/groupStore";
import * as groupService from "../services/group";
import toast from "react-hot-toast";
import type { CreateGroupPayload, InviteMemberPayload } from "../types/types";

export const useGroups = () => {
  const {
    groups,
    isLoading,
    error,
    setGroups,
    addGroup,
    updateGroup,
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

  const invite = async (
    groupId: string,
    email: string,
    role?: InviteMemberPayload["role"],
  ) => {
    try {
      const updated = await groupService.inviteMember(groupId, { email, role });
      updateGroup(updated);
      toast.success("Member invited!");
      return updated;
    } catch {
      toast.error("Could not invite member");
      throw new Error("invite failed");
    }
  };

  const removeMember = async (groupId: string, memberId: string) => {
    try {
      const updated = await groupService.removeMember(groupId, memberId);
      updateGroup(updated);
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

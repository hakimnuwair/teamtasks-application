/**
 * hooks/useGroups.ts
 *
 * Single source of truth for group data.
 * Components never call groupService directly — they call this hook.
 *
 * Architecture: Component → useGroups → groupStore ← groupService
 *
 * Fetches on first mount if store is empty (login-fresh state).
 * Subsequent mounts skip the fetch so navigating between pages
 * doesn't redundantly re-fetch unchanged group data.
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

  // Fetch only when the store is empty (first load after login / after logout-reset).
  // Pages that need fresh data can call fetchGroups() explicitly.
  useEffect(() => {
    if (groups.length === 0 && !isLoading) {
      fetchGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const removeMember = async (groupId: string, memberId: string) => {
    try {
      await groupService.removeMember(groupId, memberId);
      await fetchGroups();
      toast.success("Member removed");
    } catch {
      toast.error("Could not remove member");
    }
  };

  /**
   * Fetches full group detail (with populated members) for a single group.
   * Result is returned, not stored globally — callers own the state.
   * Used by CreateTaskModal to load member list for Specific assignment.
   */
  const getGroupById = async (id: string) => {
    const data = await groupService.getGroupById(id);
    return data;
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
    getGroupById,
  };
};

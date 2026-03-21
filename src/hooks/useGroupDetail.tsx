/**
 * hooks/useGroupDetail.ts
 *
 * Encapsulates all data-fetching for a single group's detail view.
 * GroupDetailPage uses this hook — it never calls groupService,
 * reminderService, or invitationService directly.
 *
 * Architecture: GroupDetailPage → useGroupDetail → services → backend
 *
 * Note: Group detail data lives in this hook's local state (not groupStore),
 * because it holds full nested detail (members populated, reminders, etc.)
 * that is separate from the global groups list used by the sidebar and modal.
 */
import { useState, useCallback } from "react";
import * as groupService from "../services/group";
import * as reminderService from "../services/reminder";
import * as invitationService from "../services/invitation";
import toast from "react-hot-toast";
import type { Group, Reminder, GroupInvitation } from "../types/types";

export const useGroupDetail = (id: string | undefined) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [myInvitations, setMyInvitations] = useState<GroupInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  /** Load group + reminders + invitations in parallel */
  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [g, r, invs] = await Promise.all([
        groupService.getGroupById(id),
        reminderService.getGroupReminders(id),
        invitationService
          .getMyInvitations()
          .catch(() => [] as GroupInvitation[]),
      ]);
      setGroup(g);
      setReminders(r.reminders);
      setMyInvitations(invs);
    } catch {
      throw new Error("Failed to load group");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  /** Re-fetch only the reminders list (after create / complete) */
  const reloadReminders = useCallback(async () => {
    if (!id) return;
    const r = await reminderService.getGroupReminders(id).catch(() => null);
    if (r) setReminders(r.reminders);
  }, [id]);

  /** Re-fetch only the group detail (after member add/remove) */
  const reloadGroup = useCallback(async () => {
    if (!id) return;
    const g = await groupService.getGroupById(id).catch(() => null);
    if (g) setGroup(g);
  }, [id]);

  /** Mark a reminder complete for the current user */
  const completeReminder = useCallback(
    async (reminderId: string) => {
      setCompletingId(reminderId);
      try {
        await reminderService.completeReminder(reminderId);
        toast.success("Marked complete!");
        await reloadReminders();
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Could not complete reminder",
        );
      } finally {
        setCompletingId(null);
      }
    },
    [reloadReminders],
  );

  /** Remove a member from the group */
  const removeMember = useCallback(
    async (memberId: string) => {
      if (!group) return;
      setRemovingId(memberId);
      try {
        await groupService.removeMember(group._id, memberId);
        await reloadGroup();
        toast.success("Member removed");
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Could not remove member",
        );
      } finally {
        setRemovingId(null);
      }
    },
    [group, reloadGroup],
  );

  /** Respond to own pending invitation */
  const respondToInvitation = useCallback(
    async (invId: string, accept: boolean) => {
      try {
        await invitationService.respondToInvitation(invId, accept);
        toast.success(accept ? "Joined the group!" : "Invitation declined");
        setMyInvitations((prev) => prev.filter((i) => i._id !== invId));
        if (accept) await reloadGroup();
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Could not respond to invitation",
        );
      }
    },
    [reloadGroup],
  );

  /** Cancel a sent invitation */
  const cancelInvitation = useCallback(async (invId: string) => {
    setCancellingId(invId);
    try {
      await invitationService.cancelInvitation(invId);
      toast.success("Invitation cancelled");
    } catch {
      toast.error("Could not cancel invitation");
    } finally {
      setCancellingId(null);
    }
  }, []);

  /** Send a single invitation — used by InviteModal */
  const sendInvitation = useCallback(
    async (
      groupId: string,
      payload: { email: string; role?: import("../types/types").GroupRole },
    ) => {
      return invitationService.sendInvitation(groupId, payload);
    },
    [],
  );

  return {
    group,
    reminders,
    myInvitations,
    isLoading,
    completingId,
    removingId,
    cancellingId,
    load,
    reloadReminders,
    reloadGroup,
    completeReminder,
    removeMember,
    respondToInvitation,
    cancelInvitation,
    sendInvitation,
    setGroup,
    setReminders,
    setMyInvitations,
  };
};

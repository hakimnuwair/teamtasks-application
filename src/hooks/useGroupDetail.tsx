/**
 * hooks/useGroupDetail.ts
 */
import { useState, useCallback } from "react";
import * as groupService from "../services/group";
import * as reminderService from "../services/reminder";
import * as invitationService from "../services/invitation";
import toast from "react-hot-toast";
import type {
  Group,
  Reminder,
  GroupInvitation,
  SentInvite,
} from "../types/types";

function mapToSentInvite(inv: GroupInvitation): SentInvite {
  const invitedUser = inv.invitedUser as
    | { _id: string; name: string; email: string }
    | string
    | undefined;
  return {
    id: inv._id,
    email: typeof invitedUser === "object" ? (invitedUser?.email ?? "") : "",
    name:
      typeof invitedUser === "object"
        ? (invitedUser?.name ?? "Unknown")
        : "Unknown",
    role: inv.role,
    status: inv.status as "PENDING" | "DECLINED" | "CANCELLED",
    sentAt: inv.createdAt,
  };
}

export const useGroupDetail = (id: string | undefined) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [myInvitations, setMyInvitations] = useState<GroupInvitation[]>([]);
  const [sentInvites, setSentInvites] = useState<SentInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [g, r, invs, sentInvsRaw] = await Promise.all([
        groupService.getGroupById(id),
        reminderService.getGroupReminders(id),
        invitationService
          .getMyInvitations()
          .catch(() => [] as GroupInvitation[]),
        invitationService
          .getSentInvitationsForGroup(id)
          .catch(() => [] as GroupInvitation[]),
      ]);
      setGroup(g);
      setReminders(Array.isArray(r?.reminders) ? r.reminders : []);
      setMyInvitations(Array.isArray(invs) ? invs : []);
      const validSent = Array.isArray(sentInvsRaw) ? sentInvsRaw : [];
      setSentInvites(
        validSent
          .filter((inv) => inv.status !== "ACCEPTED")
          .map(mapToSentInvite),
      );
    } catch {
      throw new Error("Failed to load group");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const reloadReminders = useCallback(async () => {
    if (!id) return;
    try {
      const r = await reminderService.getGroupReminders(id);
      setReminders(Array.isArray(r?.reminders) ? r.reminders : []);
    } catch {
      /* silent */
    }
  }, [id]);

  const reloadGroup = useCallback(async () => {
    if (!id) return;
    const g = await groupService.getGroupById(id).catch(() => null);
    if (g) setGroup(g);
  }, [id]);

  const reloadSentInvites = useCallback(async () => {
    if (!id) return;
    try {
      const data = await invitationService.getSentInvitationsForGroup(id);
      const valid = Array.isArray(data) ? data : [];
      setSentInvites(
        valid.filter((inv) => inv.status !== "ACCEPTED").map(mapToSentInvite),
      );
    } catch {
      /* non-critical */
    }
  }, [id]);

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
    sentInvites,
    setSentInvites,
    load,
    reloadReminders,
    reloadGroup,
    reloadSentInvites,
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

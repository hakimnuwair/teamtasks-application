// ─── API RESPONSE WRAPPERS ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  reminders?: T[];
  groups?: T[];
  logs?: T[];
  notifications?: T[];
  data?: T[];
  pagination: Pagination;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  groups: string[];
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
export interface AuthResponse {
  accessToken: string;
  user: User;
}

// ─── GROUP ────────────────────────────────────────────────────────────────────

export type GroupRole = "ADMIN" | "MEMBER";

export interface GroupMember {
  userId: { _id: string; name: string; email: string };
  role: GroupRole;
  joinedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  members: GroupMember[];
  createdBy: { _id: string; name: string; email: string };
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
}
export interface InviteMemberPayload {
  email: string;
  role?: GroupRole;
}

// ─── REMINDER ─────────────────────────────────────────────────────────────────

export type ReminderStatus = "PENDING" | "COMPLETED" | "OVERDUE";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

// Per-user completion entry — stored in userCompletions[]
export interface UserCompletion {
  userId: { _id: string; name: string; email: string } | string;
  completedAt: string;
}

export interface Reminder {
  _id: string;
  title: string;
  description: string;
  dueDateTime: string;
  recurrence: Recurrence;
  groupId: { _id: string; name: string } | null;
  createdBy: { _id: string; name: string; email: string };
  assignedUsers: { _id: string; name: string; email: string }[];
  // Per-user completions — present on group reminders
  userCompletions: UserCompletion[];
  // Top-level status — COMPLETED only when ALL assigned users complete
  status: ReminderStatus;
  priority: Priority;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Set when this Reminder is a sub-reminder of another Reminder; null/undefined for top-level reminders
  parentId?: string | null;
}

export interface CreateReminderPayload {
  title: string;
  description?: string;
  dueDateTime: string;
  recurrence?: Recurrence;
  groupId?: string | null;
  assignedUsers?: string[]; // [] or omitted = all group members
  priority?: Priority;
}

// Sub-reminders inherit groupId/assignedUsers from the parent and never recur
export interface CreateSubReminderPayload {
  title: string;
  description?: string;
  dueDateTime: string;
  priority?: Priority;
}

// ─── NOTIFICATION ─────────────────────────────────────────────────────────────

export type NotificationType =
  | "REMINDER_DUE"
  | "GROUP_INVITE"
  | "REMINDER_ASSIGNED"
  | "SYSTEM";

export interface Notification {
  _id: string;
  userId: string;
  reminderId: { _id: string; title: string; dueDateTime: string } | null;
  groupId: { _id: string; name: string } | null;
  type: NotificationType;
  message: string;
  isRead: boolean;
  readAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ─── ACTIVITY LOG ─────────────────────────────────────────────────────────────

export type ActivityAction =
  | "GROUP_CREATED"
  | "GROUP_UPDATED"
  | "GROUP_DELETED"
  | "GROUP_MEMBER_ADDED"
  | "GROUP_MEMBER_REMOVED"
  | "GROUP_ROLE_CHANGED"
  | "GROUP_INVITATION_SENT"
  | "GROUP_INVITATION_ACCEPTED"
  | "GROUP_INVITATION_DECLINED"
  | "GROUP_INVITATION_CANCELLED"
  | "REMINDER_CREATED"
  | "REMINDER_UPDATED"
  | "REMINDER_DELETED"
  | "REMINDER_COMPLETED"
  | "REMINDER_OVERDUE";

export interface ActivityLog {
  _id: string;
  userId: { _id: string; name: string; email: string };
  groupId: { _id: string; name: string } | null;
  reminderId: { _id: string; title: string } | null;
  action: ActivityAction;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ─── GROUP INVITATIONS ────────────────────────────────────────────────────────

export type InvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED";

export interface GroupInvitation {
  _id: string;
  groupId: { _id: string; name: string; description?: string };
  invitedBy: { _id: string; name: string; email: string };
  invitedUser: string;
  role: GroupRole;
  status: InvitationStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SentInvite {
  id: string;
  email: string;
  name: string;
  role: GroupRole;
  status: "PENDING" | "DECLINED" | "CANCELLED";
  sentAt: string;
}

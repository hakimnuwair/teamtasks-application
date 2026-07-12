/**
 * lib/validations.ts
 *
 * Zod schemas for all user-facing forms.
 * Each schema is co-located with its inferred TypeScript type.
 * Used in: CreateReminderModal, CreateGroupModal, InviteMember, Login, Register.
 */

import { z } from "zod";

// ─── HELPER ───────────────────────────────────────────────────────────────────
/**
 * parseForm — parse raw form values with a Zod schema.
 * Returns typed data on success, or a flat { field: message } errors map.
 *
 * Usage:
 *   const { data, errors } = parseForm(createGroupSchema, { name: "", description: "" });
 *   if (errors) { setErrors(errors); return; }
 *   await api.post("/groups", data);
 */
export function parseForm<T>(
  schema: z.ZodType<T>,
  values: unknown,
): { data: T; errors: null } | { data: null; errors: Record<string, string> } {
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data, errors: null };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    if (!errors[key]) errors[key] = issue.message;
  }
  return { data: null, errors };
}

// ─── REMINDER ─────────────────────────────────────────────────────────────────

export const createReminderSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be under 200 characters")
    .transform((s) => s.trim()),

  description: z
    .string()
    .max(1000, "Description must be under 1000 characters")
    .optional()
    .transform((s) => s?.trim() || undefined),

  dueDateTime: z
    .string()
    .min(1, "Due date & time is required")
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
    .refine(
      (val) => new Date(val) > new Date(),
      "Due date must be in the future",
    ),

  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),

  recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).default("NONE"),

  groupId: z
    .string()
    .optional()
    .nullable()
    .transform((v) => v || null),
});

export type CreateReminderFormData = z.infer<typeof createReminderSchema>;

// ─── SUB-REMINDER ─────────────────────────────────────────────────────────────
// No recurrence/groupId — sub-reminders don't recur and inherit groupId from the parent.

export const createSubReminderSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be under 200 characters")
    .transform((s) => s.trim()),

  description: z
    .string()
    .max(1000, "Description must be under 1000 characters")
    .optional()
    .transform((s) => s?.trim() || undefined),

  dueDateTime: z
    .string()
    .min(1, "Due date & time is required")
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
    .refine(
      (val) => new Date(val) > new Date(),
      "Due date must be in the future",
    ),

  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

export type CreateSubReminderFormData = z.infer<
  typeof createSubReminderSchema
>;

// ─── GROUP ────────────────────────────────────────────────────────────────────

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name must be under 100 characters")
    .transform((s) => s.trim()),

  description: z
    .string()
    .max(500, "Description must be under 500 characters")
    .optional()
    .transform((s) => s?.trim() || undefined),
});

export type CreateGroupFormData = z.infer<typeof createGroupSchema>;

// ─── INVITE MEMBER ────────────────────────────────────────────────────────────

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .transform((s) => s.trim().toLowerCase()),

  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be under 50 characters")
      .transform((s) => s.trim()),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// ─── REMINDER (with assignedUsers) ───────────────────────────────────────────

export const createReminderWithAssignmentSchema = createReminderSchema.extend({
  assignedUsers: z.array(z.string()).optional(),
});

export type CreateReminderWithAssignmentData = z.infer<
  typeof createReminderWithAssignmentSchema
>;

import { format, isToday, isTomorrow, isYesterday, isPast } from "date-fns";
import type { TaskStatus } from "../types/types";

/**
 * Formats due date nicely for UI display.
 * Examples:
 *  - Today at 5:00 PM
 *  - Tomorrow at 9:30 AM
 *  - Mar 21 at 4:15 PM
 */
export const formatDueDate = (dateString: string): string => {
  const date = new Date(dateString);

  if (isToday(date)) {
    return `Today at ${format(date, "h:mm a")}`;
  }

  if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, "h:mm a")}`;
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, "h:mm a")}`;
  }

  return format(date, "MMM d 'at' h:mm a");
};

/**
 * Determines if a task is overdue.
 * A task is overdue if:
 *  - status is not COMPLETED
 *  - due date is in the past
 */
export const isOverdue = (
  dateString: string,
  status: TaskStatus,
): boolean => {
  if (status === "COMPLETED") return false;

  const date = new Date(dateString);
  return isPast(date);
};

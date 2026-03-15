/**
 * services/activity.ts
 *
 * GET /activity            → { success, message, logs: [], pagination: {} }
 * GET /groups/:id/activity → same shape
 *   (activityLogService returns { logs, pagination } → Object.assign flat)
 */
import api from "../config/axios";
import type { ActivityLog, Pagination } from "../types/types";

export interface GetActivityParams {
  page?: number;
  limit?: number;
}
export interface GetActivityResult {
  logs: ActivityLog[];
  pagination: Pagination | undefined;
}

interface ActivityResponse {
  success: boolean;
  message: string;
  logs: ActivityLog[];
  pagination: Pagination;
}

export const getUserActivity = async (
  params: GetActivityParams = {},
): Promise<GetActivityResult> => {
  const { data } = await api.get<ActivityResponse>("/activity", { params });
  return { logs: data.logs ?? [], pagination: data.pagination };
};

export const getGroupActivity = async (
  groupId: string,
  params: GetActivityParams = {},
): Promise<GetActivityResult> => {
  const { data } = await api.get<ActivityResponse>(
    `/groups/${groupId}/activity`,
    { params },
  );
  return { logs: data.logs ?? [], pagination: data.pagination };
};

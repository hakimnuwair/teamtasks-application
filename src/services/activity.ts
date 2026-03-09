/**
 * services/activity.ts — Activity log API calls
 */
import api from "../config/axios";
import type { ActivityLog, PaginatedResponse } from "../types/types";

export interface GetActivityParams {
  page?: number;
  limit?: number;
}

export interface GetActivityResult {
  logs: ActivityLog[];
  pagination: PaginatedResponse<ActivityLog>["pagination"];
}

export const getUserActivity = async (
  params: GetActivityParams = {},
): Promise<GetActivityResult> => {
  const { data } = await api.get<PaginatedResponse<ActivityLog>>("/activity", {
    params,
  });
  return {
    logs: data.logs ?? data.data ?? [],
    pagination: data.pagination,
  };
};

export const getGroupActivity = async (
  groupId: string,
  params: GetActivityParams = {},
): Promise<GetActivityResult> => {
  const { data } = await api.get<PaginatedResponse<ActivityLog>>(
    `/groups/${groupId}/activity`,
    { params },
  );
  return {
    logs: data.logs ?? data.data ?? [],
    pagination: data.pagination,
  };
};

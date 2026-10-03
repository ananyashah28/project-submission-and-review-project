/**
 * Activity Feed Service (Zoho Projects Audit Trail)
 */
import { api } from "@/utils/api-method";
import { ActivityLogListResponse } from "@/types";

export const getActivities = async (
  projectId: string,
  limit: number = 50
): Promise<ActivityLogListResponse> => {
  return api.get<ActivityLogListResponse>(`/projects/${projectId}/activities`, { limit });
};

const activityService = {
  getActivities,
};

export default activityService;

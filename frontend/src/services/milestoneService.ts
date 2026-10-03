/**
 * Milestone Service (Zoho Projects Sprints & Milestones)
 */
import { api } from "@/utils/api-method";
import { Milestone, MilestoneCreate, MilestoneUpdate } from "@/types";

export interface MilestoneListResponse {
  total: number;
  milestones: Milestone[];
}

export const getMilestones = async (
  projectId: string,
  params?: { status?: string }
): Promise<MilestoneListResponse> => {
  return api.get<MilestoneListResponse>(`/projects/${projectId}/milestones`, params);
};

export const createMilestone = async (
  projectId: string,
  milestoneData: MilestoneCreate
): Promise<Milestone> => {
  return api.post<Milestone>(`/projects/${projectId}/milestones`, milestoneData);
};

export const updateMilestone = async (
  milestoneId: string,
  milestoneData: MilestoneUpdate
): Promise<Milestone> => {
  return api.patch<Milestone>(`/milestones/${milestoneId}`, milestoneData);
};

export const deleteMilestone = async (milestoneId: string): Promise<void> => {
  return api.delete<void>(`/milestones/${milestoneId}`);
};

const milestoneService = {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
};

export default milestoneService;

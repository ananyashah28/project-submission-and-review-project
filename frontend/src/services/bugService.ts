/**
 * Bug Tracker Service
 * Handles API calls for Zoho Projects style issue/bug tracking
 */
import { api } from "@/utils/api-method";
import { Bug, BugCreate, BugUpdate } from "@/types";

export interface BugQueryParams {
  status?: string;
  severity?: string;
  task_id?: string;
  search?: string;
}

export interface BugListResponse {
  total: number;
  bugs: Bug[];
}

export const getBugs = async (
  projectId: string,
  params?: BugQueryParams
): Promise<BugListResponse> => {
  return api.get<BugListResponse>(`/projects/${projectId}/bugs`, params);
};

export const getTaskBugs = async (taskId: string): Promise<BugListResponse> => {
  return api.get<BugListResponse>(`/tasks/${taskId}/bugs`);
};

export const createBug = async (
  projectId: string,
  bugData: BugCreate
): Promise<Bug> => {
  return api.post<Bug>(`/projects/${projectId}/bugs`, bugData);
};

export const updateBug = async (
  bugId: string,
  bugData: BugUpdate
): Promise<Bug> => {
  return api.patch<Bug>(`/bugs/${bugId}`, bugData);
};

export const deleteBug = async (bugId: string): Promise<void> => {
  return api.delete<void>(`/bugs/${bugId}`);
};

const bugService = {
  getBugs,
  getTaskBugs,
  createBug,
  updateBug,
  deleteBug,
};

export default bugService;

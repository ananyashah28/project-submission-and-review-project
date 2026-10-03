/**
 * Project Member Service (Zoho Projects & Jira style Team Collaboration)
 */
import { apiMethod } from "@/utils/api-method";
import {
  ProjectMember,
  ProjectMemberCreate,
  ProjectMemberUpdate,
  ProjectMemberListResponse,
} from "@/types";

export const getProjectMembers = async (
  projectId: string
): Promise<ProjectMemberListResponse> => {
  return apiMethod<ProjectMemberListResponse>(`/projects/${projectId}/members`, "get");
};

export const addProjectMember = async (
  projectId: string,
  data: ProjectMemberCreate
): Promise<ProjectMember> => {
  return apiMethod<ProjectMember>(`/projects/${projectId}/members`, "post", data);
};

export const removeProjectMember = async (
  projectId: string,
  userId: string
): Promise<{ message: string }> => {
  return apiMethod<{ message: string }>(`/projects/${projectId}/members/${userId}`, "delete");
};

export const updateMemberRole = async (
  projectId: string,
  userId: string,
  data: ProjectMemberUpdate
): Promise<ProjectMember> => {
  return apiMethod<ProjectMember>(`/projects/${projectId}/members/${userId}`, "patch", data);
};

const projectMemberService = {
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  updateMemberRole,
};

export default projectMemberService;

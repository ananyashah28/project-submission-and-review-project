/**
 * Project Service
 * Handles all project-related API calls
 * Authentication via httpOnly cookies (automatic)
 */
import { apiMethod } from "@/utils/api-method";
import { Project, ProjectCreate, ProjectUpdate, ProjectStatus } from "@/types";

// API Endpoints
const PROJECT_ENDPOINTS = {
  BASE: "/projects",
  STATS: "/projects/stats",
  REVIEW_PENDING: "/projects/review/pending",
  BY_ID: (id: string) => `/projects/${id}`,
  SUBMIT: (id: string) => `/projects/${id}/submit`,
  REVIEW: (id: string) => `/projects/${id}/review`,
  STATUS: (id: string) => `/projects/${id}/status`,
};

/**
 * Query parameters for listing projects
 */
export interface ProjectQueryParams {
  skip?: number;
  limit?: number;
  status?: ProjectStatus;
}

/**
 * Project statistics response
 */
export interface ProjectStats {
  total: number;
  draft: number;
  submitted: number;
  under_review: number;
  approved: number;
  changes_requested: number;
}

/**
 * Status update data for project
 */
export interface ProjectStatusUpdate {
  status: ProjectStatus;
  review_comment?: string;
}

/**
 * Review request data
 */
export interface ReviewRequest {
  status: "approved" | "changes_requested";
  review_comment?: string;
}

/**
 * Get list of user's projects
 */
export const getProjects = async (params?: ProjectQueryParams): Promise<Project[]> => {
  return apiMethod<Project[]>(PROJECT_ENDPOINTS.BASE, "get", params);
};

/**
 * Get project statistics for current user
 */
export const getProjectStats = async (): Promise<ProjectStats> => {
  return apiMethod<ProjectStats>(PROJECT_ENDPOINTS.STATS, "get");
};

/**
 * Get single project by ID (includes files)
 */
export const getProject = async (id: string): Promise<Project> => {
  return apiMethod<Project>(PROJECT_ENDPOINTS.BY_ID(id), "get");
};

/**
 * Create a new project
 */
export const createProject = async (projectData: ProjectCreate): Promise<Project> => {
  return apiMethod<Project>(PROJECT_ENDPOINTS.BASE, "post", projectData);
};

/**
 * Update an existing project
 */
export const updateProject = async (id: string, projectData: ProjectUpdate): Promise<Project> => {
  return apiMethod<Project>(PROJECT_ENDPOINTS.BY_ID(id), "put", projectData);
};

/**
 * Delete a project
 */
export const deleteProject = async (id: string): Promise<void> => {
  return apiMethod<void>(PROJECT_ENDPOINTS.BY_ID(id), "delete");
};

/**
 * Submit project for review
 */
export const submitProject = async (id: string, submissionComment?: string): Promise<Project> => {
  const data = submissionComment ? { submission_comment: submissionComment } : undefined;
  return apiMethod<Project>(PROJECT_ENDPOINTS.SUBMIT(id), "post", data);
};

/**
 * Update project status (for reviewers or testing)
 */
export const updateProjectStatus = async (
  id: string,
  statusUpdate: ProjectStatusUpdate
): Promise<Project> => {
  return apiMethod<Project>(PROJECT_ENDPOINTS.STATUS(id), "patch", statusUpdate);
};

/**
 * Get projects pending review
 */
export const getProjectsForReview = async (params?: { skip?: number; limit?: number }): Promise<Project[]> => {
  return apiMethod<Project[]>(PROJECT_ENDPOINTS.REVIEW_PENDING, "get", params);
};

/**
 * Review a project (approve or request changes)
 */
export const reviewProject = async (id: string, reviewData: ReviewRequest): Promise<Project> => {
  return apiMethod<Project>(PROJECT_ENDPOINTS.REVIEW(id), "post", reviewData);
};

const projectService = {
  getProjects,
  getProjectStats,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  submitProject,
  updateProjectStatus,
  getProjectsForReview,
  reviewProject,
};

export default projectService;

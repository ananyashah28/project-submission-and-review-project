/**
 * Services Index
 * Export all API services
 */

// Auth Service
export { default as authService } from "./authService";
export {
  register,
  login,
  logout,
  getCurrentUser,
  checkAuth,
  refreshToken,
} from "./authService";

// Project Service
export { default as projectService } from "./projectService";
export {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  submitProject,
  reviewProject,
  getProjectStats,
  getProjectsForReview,
  updateProjectStatus,
} from "./projectService";
export type { ProjectQueryParams, ReviewRequest, ProjectStats, ProjectStatusUpdate } from "./projectService";

// File Service
export { default as fileService } from "./fileService";
export {
  getProjectFiles,
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  getFileDownloadUrl,
  downloadFile,
} from "./fileService";
export type { FileUploadResponse, FileDeleteResponse } from "./fileService";

// User Service
export { default as userService } from "./userService";
export { getProfile, updateProfile, changePassword } from "./userService";
export type { UserUpdateData, PasswordChangeData } from "./userService";

// Task Service
export { default as taskService } from "./taskService";
export * from "./taskService";

// Bug Service
export { default as bugService } from "./bugService";
export * from "./bugService";

// Milestone Service
export { default as milestoneService } from "./milestoneService";
export * from "./milestoneService";

// TimeLog Service
export { default as timelogService } from "./timelogService";
export * from "./timelogService";

// Activity Service
export { default as activityService } from "./activityService";
export * from "./activityService";

// Project Member Service
export { default as projectMemberService } from "./projectMemberService";
export * from "./projectMemberService";

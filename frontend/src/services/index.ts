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
  isAuthenticated,
  getToken,
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
} from "./projectService";
export type { ProjectQueryParams, ProjectReviewData } from "./projectService";

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

/**
 * File Service
 * Handles file upload, download, and management for projects
 */
import { apiMethod } from "@/utils/api-method";
import axiosInstance from "@/lib/axios";
import { ProjectFile } from "@/types";

// API Endpoints
const FILE_ENDPOINTS = {
  PROJECT_FILES: (projectId: string) => `/projects/${projectId}/files`,
  FILE_BY_ID: (fileId: string) => `/files/${fileId}`,
  DOWNLOAD: (fileId: string) => `/files/${fileId}/download`,
};

/**
 * File upload response
 */
export interface FileUploadResponse {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  message: string;
}

/**
 * File delete response
 */
export interface FileDeleteResponse {
  id: string;
  file_name: string;
  message: string;
}

/**
 * Get all files for a project
 */
export const getProjectFiles = async (projectId: string): Promise<ProjectFile[]> => {
  return apiMethod<ProjectFile[]>(FILE_ENDPOINTS.PROJECT_FILES(projectId), "get", {});
};

/**
 * Upload a file to a project
 */
export const uploadFile = async (
  projectId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const response = await axiosInstance.post<FileUploadResponse>(
    FILE_ENDPOINTS.PROJECT_FILES(projectId),
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    }
  );

  return response.data;
};

/**
 * Upload multiple files to a project
 */
export const uploadMultipleFiles = async (
  projectId: string,
  files: File[],
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<FileUploadResponse[]> => {
  const results: FileUploadResponse[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadFile(
      projectId,
      files[i],
      onProgress ? (progress) => onProgress(i, progress) : undefined
    );
    results.push(result);
  }

  return results;
};

/**
 * Delete a file
 */
export const deleteFile = async (fileId: string): Promise<FileDeleteResponse> => {
  return apiMethod<FileDeleteResponse>(FILE_ENDPOINTS.FILE_BY_ID(fileId), "delete", {});
};

/**
 * Get file download URL
 */
export const getFileDownloadUrl = async (fileId: string): Promise<string> => {
  const response = await apiMethod<{ url: string }>(FILE_ENDPOINTS.DOWNLOAD(fileId), "get", {});
  return response.url;
};

/**
 * Download a file directly
 */
export const downloadFile = async (fileId: string, fileName: string): Promise<void> => {
  const url = await getFileDownloadUrl(fileId);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const fileService = {
  getProjectFiles,
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  getFileDownloadUrl,
  downloadFile,
};

export default fileService;

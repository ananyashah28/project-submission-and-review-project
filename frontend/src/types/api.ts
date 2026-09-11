/**
 * API-related type definitions
 */

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  status?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

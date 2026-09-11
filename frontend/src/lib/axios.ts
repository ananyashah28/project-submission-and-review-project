/**
 * Axios Instance Configuration
 * Single source of truth for API client with httpOnly cookie support
 */
import axios, { AxiosInstance, AxiosError } from "axios";
import { ApiError } from "@/types";

const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  if (typeof window !== "undefined") {
    const currentHost = window.location.hostname;

    // Ignore legacy dead IP 13.235.71.134 if present
    if (envUrl && !envUrl.includes("13.235.71.134") && envUrl.includes(currentHost)) {
      return envUrl;
    }

    // Dynamically resolve to current page IP/domain on port 8000
    return `http://${currentHost}:8000`;
  }

  if (envUrl && !envUrl.includes("13.235.71.134")) {
    return envUrl;
  }
  return "http://35.154.152.233:8000";
};

/**
 * Create axios instance with credentials support for httpOnly cookies
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Essential for sending/receiving httpOnly cookies
  timeout: 30000,
});

/**
 * Request interceptor - Dynamically set target API URL in browser
 */
axiosInstance.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

/**
 * Flag to prevent multiple refresh attempts
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

/**
 * Response interceptor - Handle token refresh on 401
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry for auth endpoints - just reject
      if (
        originalRequest.url?.includes("/auth/refresh") ||
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/register")
      ) {
        return Promise.reject(error);
      }

      // For /auth/me endpoint, don't try to refresh if we're already on login/register page
      if (originalRequest.url?.includes("/auth/me")) {
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (currentPath === "/login" || currentPath === "/register") {
            // Don't refresh or redirect, just reject silently
            return Promise.reject(error);
          }
        }
      }

      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        await axiosInstance.post("/auth/refresh");
        processQueue(null);
        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        // Refresh failed - redirect to login only if not already there
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (currentPath !== "/login" && currentPath !== "/register") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extract error message from axios error
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    if (axiosError.response?.data?.detail) {
      return axiosError.response.data.detail;
    }
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
};

export default axiosInstance;

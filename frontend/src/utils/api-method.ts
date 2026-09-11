/**
 * Common API Method Utility
 * Reusable function for making API calls
 * Authentication is handled automatically via httpOnly cookies
 */
import axiosInstance from "@/lib/axios";

type Method = "get" | "post" | "put" | "delete" | "patch";

/**
 * Generic API method for making HTTP requests
 * Cookies are sent automatically with withCredentials: true
 * 
 * @param url - API endpoint URL
 * @param method - HTTP method (get, post, put, delete, patch)
 * @param data - Request payload (body for POST/PUT/PATCH, params for GET)
 * @returns Promise with response data
 */
export const apiMethod = async <T>(
  url: string,
  method: Method,
  data: any = {}
): Promise<T> => {
  try {
    const response = await axiosInstance({
      url,
      method,
      data: method !== "get" ? data : undefined,
      params: method === "get" ? data : undefined,
    });

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail || 
      error?.response?.data?.message || 
      "Something went wrong"
    );
  }
};

/**
 * Convenience methods for common HTTP operations
 * All requests automatically include cookies for authentication
 */
export const api = {
  get: <T>(url: string, params?: any) =>
    apiMethod<T>(url, "get", params),

  post: <T>(url: string, data?: any) =>
    apiMethod<T>(url, "post", data),

  put: <T>(url: string, data?: any) =>
    apiMethod<T>(url, "put", data),

  patch: <T>(url: string, data?: any) =>
    apiMethod<T>(url, "patch", data),

  delete: <T>(url: string, data?: any) =>
    apiMethod<T>(url, "delete", data),
};

export default apiMethod;

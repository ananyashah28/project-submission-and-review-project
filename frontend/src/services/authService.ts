/**
 * Authentication Service
 * Handles user registration, login, logout
 * Auth tokens are managed via httpOnly cookies (handled by backend)
 */
import { apiMethod } from "@/utils/api-method";
import axiosInstance from "@/lib/axios";
import { User, UserCreate, UserLogin } from "@/types";

// API Endpoints
const AUTH_ENDPOINTS = {
  REGISTER: "/auth/register",
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  REFRESH: "/auth/refresh",
  ME: "/auth/me",
};

/**
 * Register a new user
 * Sets auth cookies automatically via backend response
 */
export const register = async (userData: UserCreate): Promise<User> => {
  return apiMethod<User>(AUTH_ENDPOINTS.REGISTER, "post", userData);
};

/**
 * Login user
 * FastAPI OAuth2 expects form data for token endpoint
 * Sets auth cookies automatically via backend response
 */
export const login = async (credentials: UserLogin): Promise<void> => {
  const formData = new URLSearchParams();
  formData.append("username", credentials.email);
  formData.append("password", credentials.password);

  await axiosInstance.post(AUTH_ENDPOINTS.LOGIN, formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

/**
 * Logout user
 * Clears auth cookies via backend response
 */
export const logout = async (): Promise<void> => {
  try {
    await apiMethod<void>(AUTH_ENDPOINTS.LOGOUT, "post");
  } catch (error) {
    // Even if logout fails, redirect to login
    console.error("Logout error:", error);
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<User> => {
  return apiMethod<User>(AUTH_ENDPOINTS.ME, "get");
};

/**
 * Refresh access token
 * Called automatically by axios interceptor on 401
 */
export const refreshToken = async (): Promise<void> => {
  await apiMethod<void>(AUTH_ENDPOINTS.REFRESH, "post");
};

/**
 * Check if user is authenticated by trying to get current user
 * Since we use httpOnly cookies, we can't check localStorage
 */
export const checkAuth = async (): Promise<User | null> => {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  checkAuth,
};

export default authService;

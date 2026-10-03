/**
 * User Service
 * Handles user profile and account management
 * Authentication via httpOnly cookies (automatic)
 */
import { apiMethod } from "@/utils/api-method";
import { User } from "@/types";

// API Endpoints
const USER_ENDPOINTS = {
  ME: "/users/me",
  UPDATE_PROFILE: "/users/me",
  CHANGE_PASSWORD: "/users/me/password",
};

/**
 * User update data
 */
export interface UserUpdateData {
  name?: string;
  email?: string;
}

/**
 * Password change data
 */
export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<User> => {
  return apiMethod<User>(USER_ENDPOINTS.ME, "get");
};

/**
 * Update user profile
 */
export const updateProfile = async (data: UserUpdateData): Promise<User> => {
  return apiMethod<User>(USER_ENDPOINTS.UPDATE_PROFILE, "put", data);
};

/**
 * Change user password
 */
export const changePassword = async (data: PasswordChangeData): Promise<void> => {
  return apiMethod<void>(USER_ENDPOINTS.CHANGE_PASSWORD, "put", data);
};

/**
 * List / search users to collaborate with or add to project
 */
export const searchUsers = async (query?: string): Promise<User[]> => {
  const q = query ? `?query=${encodeURIComponent(query)}` : "";
  return apiMethod<User[]>(`/users${q}`, "get");
};

const userService = {
  getProfile,
  updateProfile,
  changePassword,
  searchUsers,
};

export default userService;

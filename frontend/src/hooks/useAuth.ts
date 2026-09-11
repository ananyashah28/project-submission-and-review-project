"use client";

/**
 * Hook to access authentication context
 * Re-exported from context for convenience
 */
import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import { User, UserLogin, UserCreate } from "@/types";

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 *
 * @returns AuthContextType with user state and auth methods
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default useAuth;

"use client";

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

interface UseRequireAuthOptions {
  redirectTo?: string;
}

export const useRequireAuth = (options: UseRequireAuthOptions = {}) => {
  const { redirectTo = "/login" } = options;
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isReady: !isLoading && isAuthenticated,
  };
};

export default useRequireAuth;

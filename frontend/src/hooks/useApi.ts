"use client";

/**
 * Custom hook for API operations with loading and error states
 * Provides a standardized way to handle API calls
 */
import { useState, useCallback } from "react";
import { getErrorMessage } from "@/lib/axios";

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

/**
 * Hook for handling API operations with loading and error states
 *
 * @param apiFunction - The async function to execute
 * @returns Object with data, loading state, error, and execute function
 *
 * @example
 * const { data, isLoading, error, execute } = useApi(fetchProjects);
 * // Call execute() to trigger the API call
 * await execute();
 */
export function useApi<T, Args extends unknown[] = unknown[]>(
  apiFunction: (...args: Args) => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await apiFunction(...args);
        setState({ data: result, isLoading: false, error: null });
        return result;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
        return null;
      }
    },
    [apiFunction]
  ) as (...args: unknown[]) => Promise<T | null>;

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
  };
}

/**
 * Hook for API operations that execute immediately on mount
 *
 * @param apiFunction - The async function to execute
 * @param deps - Dependencies array for re-fetching
 * @returns Object with data, loading state, error, and refetch function
 */
export function useApiOnMount<T>(
  apiFunction: () => Promise<T>,
  deps: React.DependencyList = []
): UseApiReturn<T> & { refetch: () => Promise<T | null> } {
  const api = useApi(apiFunction);

  // Execute on mount and when deps change
  useState(() => {
    api.execute();
  });

  return {
    ...api,
    refetch: api.execute,
  };
}

export default useApi;

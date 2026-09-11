/**
 * Context exports
 */
export { AuthProvider } from "./AuthContext";
export type { AuthContextType } from "./AuthContext";

// Re-export useAuth from hooks for backward compatibility
// Note: useAuth is defined in hooks/useAuth.ts and imports AuthContext directly
export { useAuth } from "../hooks/useAuth";

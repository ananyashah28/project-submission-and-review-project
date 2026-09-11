/**
 * Authentication-related type definitions
 */

export interface Token {
  access_token: string;
  token_type: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

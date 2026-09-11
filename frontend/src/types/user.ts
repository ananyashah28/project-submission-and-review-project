/**
 * User-related type definitions
 */

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

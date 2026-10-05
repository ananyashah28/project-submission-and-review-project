/**
 * Project Member type definitions (Zoho Projects & Jira style Team Collaboration)
 */

export type ProjectRole = "owner" | "admin" | "member" | "viewer";

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  email: string;
  role: ProjectRole;
  joined_at: string;
  is_owner: boolean;
}

export interface ProjectMemberCreate {
  email?: string;
  user_id?: string;
  role?: ProjectRole;
}

export interface ProjectMemberUpdate {
  role: ProjectRole;
}

export interface ProjectMemberListResponse {
  total: number;
  members: ProjectMember[];
}

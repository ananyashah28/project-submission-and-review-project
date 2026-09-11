/**
 * Project-related type definitions
 */

export type ProjectStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "changes_requested";

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  technologies: string[];
  github_url: string | null;
  demo_url: string | null;
  status: ProjectStatus;
  review_comment: string | null;
  submission_comment: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string | null;
  can_edit: boolean;
  can_submit: boolean;
  files?: ProjectFile[];
}

export interface ProjectCreate {
  title: string;
  description?: string;
  category?: string;
  technologies?: string[];
  github_url?: string;
  demo_url?: string;
}

export interface ProjectUpdate extends Partial<ProjectCreate> {}

export interface ProjectFile {
  id: string;
  project_id: string;
  file_name: string;
  file_type: string | null;
  s3_key: string;
  file_size: number | null;
  created_at: string;
}

export interface ProjectStats {
  total: number;
  draft: number;
  submitted: number;
  under_review: number;
  approved: number;
  changes_requested: number;
}

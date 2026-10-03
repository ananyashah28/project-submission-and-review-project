/**
 * Bug Tracker type definitions (Zoho Projects style Issue Tracker)
 */

export type BugSeverity = "low" | "medium" | "high" | "critical";
export type BugStatus = "open" | "in_progress" | "resolved" | "closed";

export interface Bug {
  id: string;
  project_id: string;
  task_id: string | null;
  task_title: string | null;
  title: string;
  description: string | null;
  reproduction_steps: string | null;
  severity: BugSeverity;
  status: BugStatus;
  reported_by: string | null;
  assigned_to?: string | null;
  assignee_id?: string | null;
  assignee_name?: string | null;
  assignee_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BugCreate {
  title: string;
  description?: string;
  reproduction_steps?: string;
  severity?: BugSeverity;
  status?: BugStatus;
  reported_by?: string;
  assigned_to?: string;
  assignee_id?: string;
  task_id?: string;
}

export interface BugUpdate {
  title?: string;
  description?: string;
  reproduction_steps?: string;
  severity?: BugSeverity;
  status?: BugStatus;
  reported_by?: string;
  assigned_to?: string | null;
  assignee_id?: string | null;
  task_id?: string | null;
}

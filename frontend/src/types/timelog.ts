/**
 * TimeLog type definitions (Zoho Projects Timesheets)
 */

export interface TimeLog {
  id: string;
  project_id: string;
  task_id: string | null;
  task_title: string | null;
  bug_id: string | null;
  bug_title: string | null;
  user_name: string;
  hours: number;
  date: string;
  description: string | null;
  is_billable: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeLogCreate {
  hours: number;
  date?: string;
  description?: string;
  is_billable?: boolean;
  user_name?: string;
  task_id?: string;
  bug_id?: string;
}

export interface TimeLogUpdate {
  hours?: number;
  date?: string;
  description?: string;
  is_billable?: boolean;
  user_name?: string;
  task_id?: string | null;
  bug_id?: string | null;
}

export interface TimeLogListResponse {
  total_hours: number;
  billable_hours: number;
  total: number;
  logs: TimeLog[];
}

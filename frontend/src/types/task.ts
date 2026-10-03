/**
 * Task and Subtask type definitions (Zoho Projects style)
 */

export type TaskStatus = "todo" | "in_progress" | "in_review" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubtaskCreate {
  title: string;
  due_date?: string;
}

export interface SubtaskUpdate {
  title?: string;
  is_completed?: boolean;
  due_date?: string | null;
}

export interface Task {
  id: string;
  project_id: string;
  milestone_id: string | null;
  milestone_title: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assigned_to: string | null;
  assignee_id?: string | null;
  assignee_name?: string | null;
  assignee_email?: string | null;
  created_at: string;
  updated_at: string;
  subtasks_count: number;
  subtasks_completed_count: number;
  bugs_count: number;
}

export interface TaskDetail extends Task {
  subtasks: Subtask[];
}

export interface TaskCreate {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  assigned_to?: string;
  assignee_id?: string;
  milestone_id?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  assigned_to?: string | null;
  assignee_id?: string | null;
  milestone_id?: string | null;
}

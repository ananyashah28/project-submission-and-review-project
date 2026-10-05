/**
 * Milestone type definitions (Zoho Projects Sprints & Milestones)
 */

export type MilestoneStatus = "upcoming" | "active" | "completed";

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  tasks_count: number;
  tasks_completed_count: number;
}

export interface MilestoneCreate {
  title: string;
  description?: string;
  status?: MilestoneStatus;
  start_date?: string;
  end_date?: string;
}

export interface MilestoneUpdate {
  title?: string;
  description?: string;
  status?: MilestoneStatus;
  start_date?: string | null;
  end_date?: string | null;
}

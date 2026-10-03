/**
 * ActivityLog type definitions (Zoho Projects Audit Trail)
 */

export interface ActivityLog {
  id: string;
  project_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string;
  user_name: string;
  created_at: string;
}

export interface ActivityLogListResponse {
  total: number;
  activities: ActivityLog[];
}

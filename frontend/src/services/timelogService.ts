/**
 * TimeLog Service (Zoho Projects Timesheets)
 */
import { api } from "@/utils/api-method";
import { TimeLog, TimeLogCreate, TimeLogUpdate, TimeLogListResponse } from "@/types";

export interface TimeLogQueryParams {
  task_id?: string;
  bug_id?: string;
}

export const getTimelogs = async (
  projectId: string,
  params?: TimeLogQueryParams
): Promise<TimeLogListResponse> => {
  return api.get<TimeLogListResponse>(`/projects/${projectId}/timelogs`, params);
};

export const createTimelog = async (
  projectId: string,
  logData: TimeLogCreate
): Promise<TimeLog> => {
  return api.post<TimeLog>(`/projects/${projectId}/timelogs`, logData);
};

export const updateTimelog = async (
  logId: string,
  logData: TimeLogUpdate
): Promise<TimeLog> => {
  return api.patch<TimeLog>(`/timelogs/${logId}`, logData);
};

export const deleteTimelog = async (logId: string): Promise<void> => {
  return api.delete<void>(`/timelogs/${logId}`);
};

const timelogService = {
  getTimelogs,
  createTimelog,
  updateTimelog,
  deleteTimelog,
};

export default timelogService;

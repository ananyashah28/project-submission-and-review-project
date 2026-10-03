/**
 * Task and Subtask Service
 * Handles API calls for Zoho Projects style tasks & subtasks
 */
import { api } from "@/utils/api-method";
import {
  Task,
  TaskDetail,
  TaskCreate,
  TaskUpdate,
  Subtask,
  SubtaskCreate,
  SubtaskUpdate,
} from "@/types";

export interface TaskQueryParams {
  status?: string;
  priority?: string;
  search?: string;
}

export interface TaskListResponse {
  total: number;
  tasks: Task[];
}

export const getTasks = async (
  projectId: string,
  params?: TaskQueryParams
): Promise<TaskListResponse> => {
  return api.get<TaskListResponse>(`/projects/${projectId}/tasks`, params);
};

export const getTask = async (taskId: string): Promise<TaskDetail> => {
  return api.get<TaskDetail>(`/tasks/${taskId}`);
};

export const createTask = async (
  projectId: string,
  taskData: TaskCreate
): Promise<Task> => {
  return api.post<Task>(`/projects/${projectId}/tasks`, taskData);
};

export const updateTask = async (
  taskId: string,
  taskData: TaskUpdate
): Promise<Task> => {
  return api.patch<Task>(`/tasks/${taskId}`, taskData);
};

export const deleteTask = async (taskId: string): Promise<void> => {
  return api.delete<void>(`/tasks/${taskId}`);
};

export const createSubtask = async (
  taskId: string,
  subtaskData: SubtaskCreate
): Promise<Subtask> => {
  return api.post<Subtask>(`/tasks/${taskId}/subtasks`, subtaskData);
};

export const updateSubtask = async (
  subtaskId: string,
  subtaskData: SubtaskUpdate
): Promise<Subtask> => {
  return api.patch<Subtask>(`/subtasks/${subtaskId}`, subtaskData);
};

export const deleteSubtask = async (subtaskId: string): Promise<void> => {
  return api.delete<void>(`/subtasks/${subtaskId}`);
};

const taskService = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
};

export default taskService;

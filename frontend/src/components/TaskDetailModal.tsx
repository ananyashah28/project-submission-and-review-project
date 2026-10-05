"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Task, Subtask, Bug, TaskStatus, TaskPriority, ProjectMember } from "@/types";
import { taskService, bugService } from "@/services";

interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  onOpenBugModalForTask?: (taskId: string, taskTitle: string) => void;
  members?: ProjectMember[];
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
  onOpenBugModalForTask,
  members = [],
}) => {
  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [taskBugs, setTaskBugs] = useState<Bug[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTaskDetails = useCallback(async () => {
    if (!taskId) return;
    setIsLoading(true);
    setError(null);
    try {
      const detail = await taskService.getTask(taskId);
      setTask(detail);
      setSubtasks(detail.subtasks || []);

      const bugsRes = await bugService.getTaskBugs(taskId);
      setTaskBugs(bugsRes.bugs || []);
    } catch (err: any) {
      setError(err.message || "Failed to load task details");
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
    }
  }, [isOpen, taskId, fetchTaskDetails]);

  if (!isOpen || !taskId) return null;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    try {
      const updated = await taskService.updateTask(task.id, { status: newStatus });
      setTask((prev) => (prev ? { ...prev, status: updated.status } : null));
      onTaskUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    }
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    if (!task) return;
    try {
      const updated = await taskService.updateTask(task.id, { priority: newPriority });
      setTask((prev) => (prev ? { ...prev, priority: updated.priority } : null));
      onTaskUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to update priority");
    }
  };

  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!task) return;
    try {
      const selectedMember = members.find((m) => m.user_id === newAssigneeId);
      const updated = await taskService.updateTask(task.id, {
        assignee_id: newAssigneeId || null,
        assigned_to: selectedMember ? selectedMember.name : null,
      });
      setTask((prev) =>
        prev
          ? {
              ...prev,
              assignee_id: updated.assignee_id,
              assigned_to: updated.assigned_to,
              assignee_name: updated.assignee_name,
            }
          : null
      );
      onTaskUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to update assignee");
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task) return;
    setIsAddingSubtask(true);
    try {
      const created = await taskService.createSubtask(task.id, {
        title: newSubtaskTitle.trim(),
      });
      setSubtasks((prev) => [...prev, created]);
      setNewSubtaskTitle("");
      onTaskUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to add subtask");
    } finally {
      setIsAddingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    try {
      const updated = await taskService.updateSubtask(subtask.id, {
        is_completed: !subtask.is_completed,
      });
      setSubtasks((prev) =>
        prev.map((s) => (s.id === subtask.id ? updated : s))
      );
      onTaskUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to toggle subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await taskService.deleteSubtask(subtaskId);
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
      onTaskUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to delete subtask");
    }
  };

  const completedCount = subtasks.filter((s) => s.is_completed).length;
  const progressPercent = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;
  const shortKey = `TSK-${task?.id.slice(0, 4).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Jira/Zoho Modal Header */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-xs font-mono font-bold text-slate-500 hover:text-blue-600 cursor-pointer">
              {shortKey}
            </span>
            {task?.milestone_title && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 inline-flex items-center gap-1">
                <svg className="w-3 h-3 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <span>{task.milestone_title}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              title="Close (Esc)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 2-Column Jira / Zoho Body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
            {/* Left Main Section (65%) */}
            <div className="flex-1 p-6 md:p-8 space-y-6 md:border-r border-slate-200">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                  {task?.title}
                </h2>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Description
                </label>
                {task?.description ? (
                  <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap border border-slate-200/80 leading-relaxed font-normal">
                    {task.description}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No description provided for this task.</p>
                )}
              </div>

              {/* SUBTASKS (Child items) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Subtasks
                    </label>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {completedCount} of {subtasks.length} done
                    </span>
                  </div>
                  {subtasks.length > 0 && (
                    <span className="text-xs font-semibold text-blue-600">{progressPercent}%</span>
                  )}
                </div>

                {/* Progress bar */}
                {subtasks.length > 0 && (
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}

                {/* Subtask items table */}
                <div className="space-y-1.5 mb-3">
                  {subtasks.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-2">
                      No subtasks yet. Break this task into steps below.
                    </div>
                  ) : (
                    subtasks.map((st) => (
                      <div
                        key={st.id}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all group ${
                          st.is_completed
                            ? "bg-slate-50 border-slate-200 text-slate-400"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={st.is_completed}
                            onChange={() => handleToggleSubtask(st)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className={`truncate font-medium ${st.is_completed ? "line-through text-slate-400" : ""}`}>
                            {st.title}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubtask(st.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 transition-opacity"
                          title="Delete subtask"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Inline Add Subtask */}
                <form onSubmit={handleAddSubtask} className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="+ Add a subtask (press Enter)..."
                    className="flex-1 px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={isAddingSubtask || !newSubtaskTitle.trim()}
                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50"
                  >
                    Add
                  </button>
                </form>
              </div>

              {/* LINKED BUGS / DEFECTS */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Linked Defects & Bugs
                    </label>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                      {taskBugs.length}
                    </span>
                  </div>
                  {onOpenBugModalForTask && task && (
                    <button
                      type="button"
                      onClick={() => onOpenBugModalForTask(task.id, task.title)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline"
                    >
                      + Report Bug
                    </button>
                  )}
                </div>

                {taskBugs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No defects linked to this task.</p>
                ) : (
                  <div className="space-y-1.5">
                    {taskBugs.map((b) => (
                      <div
                        key={b.id}
                        className="px-3 py-2 bg-red-50/40 border border-red-100 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-4m0 0H4m14-4a5 5 0 00-10 0v4a5 5 0 0010 0v-4zm-8-5l-2-2m10 2l2-2" />
                          </svg>
                          <span className="font-semibold text-slate-800">{b.title}</span>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                            {b.severity}
                          </span>
                        </div>
                        <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Meta Sidebar (35%) */}
            <div className="w-full md:w-72 bg-slate-50/60 p-6 space-y-5 text-xs">
              {/* Status Dropdown */}
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                  Status
                </label>
                <select
                  value={task?.status || "todo"}
                  onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                  className="w-full font-bold text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800 cursor-pointer"
                >
                  <option value="todo">TO DO</option>
                  <option value="in_progress">IN PROGRESS</option>
                  <option value="in_review">IN REVIEW</option>
                  <option value="completed">DONE</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                  Priority
                </label>
                <select
                  value={task?.priority || "medium"}
                  onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                  className="w-full font-semibold text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800 cursor-pointer"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                  Assignee
                </label>
                {members.length > 0 ? (
                  <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-300 shadow-2xs hover:border-blue-400 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                      {task?.assigned_to ? task.assigned_to.slice(0, 2).toUpperCase() : "—"}
                    </div>
                    <select
                      value={task?.assignee_id || ""}
                      onChange={(e) => handleAssigneeChange(e.target.value)}
                      className="w-full text-xs font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                      {task?.assigned_to ? task.assigned_to.slice(0, 2).toUpperCase() : "U"}
                    </div>
                    <span className="font-semibold text-slate-800 text-xs truncate">
                      {task?.assigned_to || "Unassigned"}
                    </span>
                  </div>
                )}
              </div>

              {/* Due Date & Time Allocation */}
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                  Due Date & Time Allocation
                </label>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-medium text-slate-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {task?.due_date
                      ? new Date(task.due_date).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "No deadline allocated"}
                  </span>
                </div>
              </div>

              {/* Milestone */}
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                  Milestone / Sprint
                </label>
                <div className="p-2 bg-white rounded-lg border border-slate-200 font-semibold text-purple-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  <span className="truncate">{task?.milestone_title || "None"}</span>
                </div>
              </div>

              {/* Dates Audit */}
              <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400 space-y-1">
                <div>Created: {task?.created_at && new Date(task.created_at).toLocaleDateString()}</div>
                <div>Updated: {task?.updated_at && new Date(task.updated_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailModal;

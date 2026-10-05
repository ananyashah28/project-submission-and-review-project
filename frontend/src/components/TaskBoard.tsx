"use client";

import React, { useState } from "react";
import { Task, TaskPriority, TaskStatus, Milestone, ProjectMember } from "@/types";

interface TaskBoardProps {
  tasks: Task[];
  milestones?: Milestone[];
  members?: ProjectMember[];
  onOpenCreateModal: (defaultStatus?: TaskStatus) => void;
  onOpenTaskDetail: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  milestones = [],
  members = [],
  onOpenCreateModal,
  onOpenTaskDetail,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}) => {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "high" | "has_bugs" | "completed">("all");
  const [milestoneFilter, setMilestoneFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      (t.assigned_to && t.assigned_to.toLowerCase().includes(search.toLowerCase()));

    const matchesMilestone = milestoneFilter === "all" || t.milestone_id === milestoneFilter;

    const matchesAssignee =
      assigneeFilter === "all" ||
      (assigneeFilter === "unassigned" && !t.assigned_to && !t.assignee_id) ||
      t.assignee_id === assigneeFilter ||
      (t.assigned_to && members.find((m) => m.user_id === assigneeFilter)?.name === t.assigned_to);

    let matchesFilter = true;
    if (filterMode === "high") {
      matchesFilter = t.priority === "urgent" || t.priority === "high";
    } else if (filterMode === "has_bugs") {
      matchesFilter = t.bugs_count > 0;
    } else if (filterMode === "completed") {
      matchesFilter = t.status === "completed";
    }

    return matchesSearch && matchesMilestone && matchesAssignee && matchesFilter;
  });

  const columns: {
    id: TaskStatus;
    label: string;
    bg: string;
    headerAccent: string;
    border: string;
  }[] = [
    {
      id: "todo",
      label: "TO DO",
      bg: "bg-slate-100/75",
      headerAccent: "border-slate-400 text-slate-700",
      border: "border-slate-200",
    },
    {
      id: "in_progress",
      label: "IN PROGRESS",
      bg: "bg-blue-50/40",
      headerAccent: "border-blue-500 text-blue-800",
      border: "border-blue-200",
    },
    {
      id: "in_review",
      label: "IN REVIEW",
      bg: "bg-amber-50/40",
      headerAccent: "border-amber-500 text-amber-800",
      border: "border-amber-200",
    },
    {
      id: "completed",
      label: "DONE",
      bg: "bg-emerald-50/40",
      headerAccent: "border-emerald-500 text-emerald-800",
      border: "border-emerald-200",
    },
  ];

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return (
          <span title="Urgent Priority" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-2xs">
            <svg className="w-3.5 h-3.5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l-7 7h4v9h6v-9h4l-7-7z" />
            </svg>
            <span className="uppercase text-xs tracking-wider">Urgent</span>
          </span>
        );
      case "high":
        return (
          <span title="High Priority" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 shadow-2xs">
            <svg className="w-3.5 h-3.5 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l-7 7h4v9h6v-9h4l-7-7z" />
            </svg>
            <span className="uppercase text-xs tracking-wider">High</span>
          </span>
        );
      case "medium":
        return (
          <span title="Medium Priority" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 10h16v4H4z" />
            </svg>
            <span className="uppercase text-xs tracking-wider">Med</span>
          </span>
        );
      case "low":
        return (
          <span title="Low Priority" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
            <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 20l7-7h-4V4h-6v9H5l7 7z" />
            </svg>
            <span className="uppercase text-xs tracking-wider">Low</span>
          </span>
        );
    }
  };

  const getStatusBadgeStyle = (status: TaskStatus) => {
    switch (status) {
      case "todo":
        return "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
      case "in_review":
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(colId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDragOverColumn(null);
    setDraggedTaskId(null);

    if (taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== colId) {
        await onStatusChange(taskId, colId);
      }
    }
  };

  return (
    <div className="space-y-3.5">
      {/* ========================================================================= */}
      {/* Jira/Zoho Filter & Action Toolbar                                         */}
      {/* ========================================================================= */}
      <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search & Filter Chips */}
        <div className="flex items-center gap-2.5 flex-wrap flex-1">
          {/* Search Box */}
          <div className="relative min-w-[220px] max-w-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search board..."
              className="w-full pl-8 pr-7 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <svg
              className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                title="Clear search"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterMode === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilterMode("high")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                filterMode === "high"
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2c1.1 0 2 .9 2 2 0 .7-.4 1.4-1 1.7V8c2.8.5 5 2.9 5 5.9 0 3.4-2.7 6.1-6 6.1s-6-2.7-6-6.1c0-3 2.2-5.4 5-5.9V5.7c-.6-.3-1-1-1-1.7 0-1.1.9-2 2-2z" />
              </svg>
              <span>Urgent / High</span>
            </button>
            <button
              onClick={() => setFilterMode("has_bugs")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                filterMode === "has_bugs"
                  ? "bg-red-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-4m0 0H4m14-4a5 5 0 00-10 0v4a5 5 0 0010 0v-4zm-8-5l-2-2m10 2l2-2" />
              </svg>
              <span>Has Bugs</span>
            </button>
            <button
              onClick={() => setFilterMode("completed")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                filterMode === "completed"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span>Done</span>
            </button>
          </div>

          {/* Milestone Filter Dropdown */}
          {milestones.length > 0 && (
            <div className="relative">
              <select
                value={milestoneFilter}
                onChange={(e) => setMilestoneFilter(e.target.value)}
                className="text-xs font-semibold py-1.5 pl-3 pr-7 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none cursor-pointer hover:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">All Milestones</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Assignee Filter Dropdown */}
          {members.length > 0 && (
            <div className="relative">
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="text-xs font-semibold py-1.5 pl-3 pr-7 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none cursor-pointer hover:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: View mode switcher & New Task action */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                viewMode === "kanban"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 5h4v14H4zm6 0h4v14h-4zm6 0h4v14h-4z" />
              </svg>
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-bold rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
              </svg>
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => onOpenCreateModal()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span className="text-base font-bold">+</span>
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KANBAN BOARD VIEW                                                         */}
      {/* ========================================================================= */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            const isHovered = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`rounded-xl border transition-all duration-150 flex flex-col min-h-[520px] ${col.border} ${
                  isHovered ? "bg-blue-50/80 ring-2 ring-blue-400 border-blue-400" : col.bg
                } p-3`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-2 py-2 mb-2.5 border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm tracking-wider text-slate-800 uppercase">
                      {col.label}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Inline quick-create task button */}
                  <button
                    onClick={() => onOpenCreateModal(col.id)}
                    className="w-7 h-7 rounded-md hover:bg-white text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors text-base font-bold"
                    title={`Add task to ${col.label}`}
                  >
                    +
                  </button>
                </div>

                {/* Column Task Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-12 text-sm text-slate-400 border-2 border-dashed border-slate-200/80 rounded-lg m-1">
                      <p className="font-medium">No tasks</p>
                      <button
                        onClick={() => onOpenCreateModal(col.id)}
                        className="mt-1 text-xs text-blue-600 hover:underline font-semibold"
                      >
                        + Create a task
                      </button>
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const shortKey = `TSK-${task.id.slice(0, 4).toUpperCase()}`;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => onOpenTaskDetail(task.id)}
                          className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group relative"
                        >
                          {/* Top: Issue Type & Monospace Key + Priority */}
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <div className="flex items-center gap-2">
                              {/* Blue Task checkbox icon (Jira style) */}
                              <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center p-0.5 shadow-2xs">
                                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                                {shortKey}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {getPriorityBadge(task.priority)}
                            </div>
                          </div>

                          {/* Title */}
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug line-clamp-2 mb-2.5 group-hover:text-blue-700 transition-colors">
                            {task.title}
                          </h4>

                          {/* Milestone tag */}
                          {task.milestone_title && (
                            <div className="mb-2.5">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                <svg className="w-3.5 h-3.5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                </svg>
                                <span className="truncate max-w-[150px]">{task.milestone_title}</span>
                              </span>
                            </div>
                          )}

                          {/* Bottom Row: Subtasks progress, Bugs alert, Due Date/Time, Assignee */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Allocated Due Date & Time */}
                              {task.due_date && (
                                <span
                                  className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1 shadow-2xs"
                                  title={`Allocated Deadline: ${new Date(task.due_date).toLocaleString()}`}
                                >
                                  <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>
                                    {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} •{" "}
                                    {new Date(task.due_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                  </span>
                                </span>
                              )}

                              {/* Subtasks checklist count */}
                              {task.subtasks_count > 0 && (
                                <span
                                  className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1"
                                  title={`Subtasks: ${task.subtasks_completed_count}/${task.subtasks_count}`}
                                >
                                  <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>
                                    {task.subtasks_completed_count}/{task.subtasks_count}
                                  </span>
                                </span>
                              )}

                              {/* Bugs count */}
                              {task.bugs_count > 0 && (
                                <span
                                  className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 flex items-center gap-1"
                                  title={`${task.bugs_count} bug(s) linked`}
                                >
                                  <svg className="w-3.5 h-3.5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-4m0 0H4m14-4a5 5 0 00-10 0v4a5 5 0 0010 0v-4zm-8-5l-2-2m10 2l2-2" />
                                  </svg>
                                  <span>{task.bugs_count}</span>
                                </span>
                              )}
                            </div>

                            {/* Assignee Pill Badge */}
                            <div className="flex items-center shrink-0">
                              {task.assigned_to ? (
                                <div
                                  className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/90 text-slate-800 transition-colors shadow-xs"
                                  title={`Assigned to ${task.assigned_to}`}
                                >
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                                    {task.assigned_to.slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-semibold text-slate-700 truncate max-w-[110px]">
                                    {task.assigned_to}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium italic">Unassigned</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Column Footer: + Add Issue shortcut */}
                <button
                  onClick={() => onOpenCreateModal(col.id)}
                  className="mt-2 w-full py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-white/80 rounded-md border border-transparent hover:border-slate-200 transition-all flex items-center justify-center gap-1"
                >
                  <span>+</span>
                  <span>Create issue</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* JIRA & LINEAR LIST / BACKLOG VIEW                                         */
        /* ========================================================================= */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-3.5 py-3.5 w-28">Key</th>
                  <th className="px-3.5 py-3.5 min-w-[170px]">Summary</th>
                  <th className="px-3.5 py-3.5 w-36">Status</th>
                  <th className="px-3 py-3.5 w-28">Priority</th>
                  <th className="px-3.5 py-3.5 w-48">Due Date & Time</th>
                  <th className="px-2 py-3.5 w-24 text-center">Subtasks</th>
                  <th className="px-2 py-3.5 w-20 text-center">Bugs</th>
                  <th className="px-3 py-3.5 w-32">Milestone</th>
                  <th className="px-3.5 py-3.5 w-40">Assignee</th>
                  <th className="px-3.5 py-3.5 w-28 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <p className="font-semibold text-base text-slate-700">No tasks match your filter</p>
                        <p className="text-sm text-slate-400">Try adjusting your search criteria or create a new task</p>
                        <button
                          onClick={() => onOpenCreateModal()}
                          className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
                        >
                          + Create Task
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => onOpenTaskDetail(t.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Key */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap font-mono font-bold text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center p-0.5 flex-shrink-0 shadow-sm">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <span className="text-slate-600 group-hover:text-blue-600 transition-colors">
                            TSK-{t.id.slice(0, 4).toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Summary */}
                      <td className="px-3.5 py-3.5 max-w-[240px]">
                        <span className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors block truncate">
                          {t.title}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <select
                            value={t.status}
                            onChange={(e) => onStatusChange(t.id, e.target.value as TaskStatus)}
                            className={`appearance-none text-xs font-bold uppercase tracking-wider py-1.5 pl-3 pr-7 rounded-full border cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs ${getStatusBadgeStyle(t.status)}`}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="in_review">In Review</option>
                            <option value="completed">Done</option>
                          </select>
                          <svg className="w-3.5 h-3.5 text-current pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {getPriorityBadge(t.priority)}
                      </td>

                      {/* Due Date & Time Allocation */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap">
                        {t.due_date ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold shadow-2xs">
                            <svg className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            <span className="text-blue-300 font-bold">•</span>
                            <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-mono text-xs font-bold">
                              {new Date(t.due_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-medium text-sm">—</span>
                        )}
                      </td>

                      {/* Subtasks */}
                      <td className="px-2 py-3.5 whitespace-nowrap text-center">
                        {t.subtasks_count > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <svg className="w-3 h-3 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{t.subtasks_completed_count}/{t.subtasks_count}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 font-medium text-sm">—</span>
                        )}
                      </td>

                      {/* Bugs */}
                      <td className="px-2 py-3.5 whitespace-nowrap text-center">
                        {t.bugs_count > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            <svg className="w-3 h-3 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-4m0 0H4m14-4a5 5 0 00-10 0v4a5 5 0 0010 0v-4zm-8-5l-2-2m10 2l2-2" />
                            </svg>
                            <span>{t.bugs_count}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 font-medium text-sm">—</span>
                        )}
                      </td>

                      {/* Milestone */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {t.milestone_title ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
                            <svg className="w-3 h-3 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                            </svg>
                            <span className="truncate max-w-[120px]">{t.milestone_title}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 font-medium text-sm">—</span>
                        )}
                      </td>

                      {/* Assignee */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-700">
                        {t.assigned_to ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                              {t.assigned_to.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-sm text-slate-800">{t.assigned_to}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-sm">Unassigned</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3.5 py-3.5 text-right whitespace-nowrap pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditTask(t)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Task"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDeleteTask(t.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Task"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onOpenTaskDetail(t.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;

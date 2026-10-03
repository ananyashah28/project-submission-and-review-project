"use client";

import React, { useState } from "react";
import { Bug, BugSeverity, BugStatus, Task, ProjectMember } from "@/types";

interface BugTrackerProps {
  bugs: Bug[];
  tasks: Task[];
  members?: ProjectMember[];
  onOpenCreateBugModal: () => void;
  onEditBug: (bug: Bug) => void;
  onDeleteBug: (bugId: string) => void;
  onStatusChange: (bugId: string, newStatus: BugStatus) => Promise<void>;
}

export const BugTracker: React.FC<BugTrackerProps> = ({
  bugs,
  tasks,
  members = [],
  onOpenCreateBugModal,
  onEditBug,
  onDeleteBug,
  onStatusChange,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [expandedBugId, setExpandedBugId] = useState<string | null>(null);

  const filteredBugs = bugs.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(search.toLowerCase())) ||
      (b.reported_by && b.reported_by.toLowerCase().includes(search.toLowerCase())) ||
      (b.assigned_to && b.assigned_to.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || b.severity === severityFilter;
    const matchesTask = taskFilter === "all" || b.task_id === taskFilter;

    const matchesAssignee =
      assigneeFilter === "all" ||
      (assigneeFilter === "unassigned" && !b.assigned_to && !b.assignee_id) ||
      b.assignee_id === assigneeFilter ||
      (b.assigned_to && members.find((m) => m.user_id === assigneeFilter)?.name === b.assigned_to);

    return matchesSearch && matchesStatus && matchesSeverity && matchesTask && matchesAssignee;
  });

  const getSeverityBadge = (severity: BugSeverity) => {
    switch (severity) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            Critical
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
            High
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
            Medium
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            Low
          </span>
        );
    }
  };

  const counts = {
    total: bugs.length,
    open: bugs.filter((b) => b.status === "open").length,
    in_progress: bugs.filter((b) => b.status === "in_progress").length,
    resolved: bugs.filter((b) => b.status === "resolved").length,
  };

  return (
    <div className="space-y-3.5">
      {/* ========================================================================= */}
      {/* Zoho / Jira Defect Summary Ribbon                                         */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* KPI Strip */}
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
              statusFilter === "all" ? "bg-slate-900 text-white font-bold" : "hover:bg-slate-100 text-slate-600"
            }`}
          >
            <span className="text-xs uppercase tracking-wider">All Defects:</span>
            <span className={`text-sm font-black px-1.5 py-0.2 rounded-full ${
              statusFilter === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-900 font-bold"
            }`}>
              {counts.total}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("open")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
              statusFilter === "open" ? "bg-red-600 text-white font-bold" : "hover:bg-red-50 text-red-600"
            }`}
          >
            <span className="text-xs uppercase tracking-wider">Open:</span>
            <span className={`text-sm font-black px-1.5 py-0.2 rounded-full ${
              statusFilter === "open" ? "bg-white/20 text-white" : "bg-red-100 text-red-700 font-bold"
            }`}>
              {counts.open}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("in_progress")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
              statusFilter === "in_progress" ? "bg-amber-500 text-white font-bold" : "hover:bg-amber-50 text-amber-700"
            }`}
          >
            <span className="text-xs uppercase tracking-wider">In Progress:</span>
            <span className={`text-sm font-black px-1.5 py-0.2 rounded-full ${
              statusFilter === "in_progress" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800 font-bold"
            }`}>
              {counts.in_progress}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("resolved")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
              statusFilter === "resolved" ? "bg-emerald-600 text-white font-bold" : "hover:bg-emerald-50 text-emerald-700"
            }`}
          >
            <span className="text-xs uppercase tracking-wider">Resolved:</span>
            <span className={`text-sm font-black px-1.5 py-0.2 rounded-full ${
              statusFilter === "resolved" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800 font-bold"
            }`}>
              {counts.resolved}
            </span>
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={onOpenCreateBugModal}
          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Report Bug</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* Search & Filter Controls                                                  */}
      {/* ========================================================================= */}
      <div className="bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] max-w-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bugs or reporter..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-red-500 focus:border-red-500 text-slate-800 placeholder-slate-400 outline-none"
            />
            <svg
              className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Severity Dropdown */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs font-semibold py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Task Linkage Filter */}
          {tasks.length > 0 && (
            <select
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
              className="text-xs font-semibold py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="all">All Linked Tasks</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  TSK-{t.id.slice(0, 4).toUpperCase()}: {t.title}
                </option>
              ))}
            </select>
          )}

          {/* Assignee Filter */}
          {members.length > 0 && (
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="text-xs font-semibold py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}

          {(search || severityFilter !== "all" || taskFilter !== "all" || statusFilter !== "all" || assigneeFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setSeverityFilter("all");
                setTaskFilter("all");
                setStatusFilter("all");
                setAssigneeFilter("all");
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Showing <span className="text-slate-900 font-bold">{filteredBugs.length}</span> of {bugs.length} issues
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Jira/Zoho Issue Navigator Table                                           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Key</th>
              <th className="px-3 py-3">Summary</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Severity</th>
              <th className="px-3 py-3">Linked Task</th>
              <th className="px-3 py-3">Assignee</th>
              <th className="px-3 py-3">Reporter</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredBugs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-slate-400 italic">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-4m0 0H4m14-4a5 5 0 00-10 0v4a5 5 0 0010 0v-4zm-8-5l-2-2m10 2l2-2" />
                      </svg>
                    </div>
                    <p className="font-semibold text-slate-700">No bugs match your filter criteria.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;Report Bug&quot; to log defects.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredBugs.map((bug) => {
                const isExpanded = expandedBugId === bug.id;
                const bugKey = `BUG-${bug.id.slice(0, 4).toUpperCase()}`;

                return (
                  <React.Fragment key={bug.id}>
                    <tr
                      onClick={() => setExpandedBugId(isExpanded ? null : bug.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Bug Key */}
                      <td className="px-4 py-3.5 font-mono font-bold text-red-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <svg
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span>{bugKey}</span>
                        </div>
                      </td>

                      {/* Bug Title */}
                      <td className="px-3 py-3.5 max-w-md">
                        <span className="font-semibold text-slate-900 group-hover:text-red-700 transition-colors line-clamp-1">
                          {bug.title}
                        </span>
                        {bug.description && !isExpanded && (
                          <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {bug.description}
                          </span>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-3 py-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={bug.status}
                          onChange={(e) => onStatusChange(bug.id, e.target.value as BugStatus)}
                          className={`text-[11px] font-bold uppercase py-1 px-2.5 rounded border outline-none ${
                            bug.status === "open"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : bug.status === "in_progress"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : bug.status === "resolved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>

                      {/* Severity */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {getSeverityBadge(bug.severity)}
                      </td>

                      {/* Linked Task */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {bug.task_title ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-semibold max-w-[160px] truncate">
                            <svg className="w-3 h-3 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="truncate">{bug.task_title}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 italic">—</span>
                        )}
                      </td>

                      {/* Assignee */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-slate-700">
                        {bug.assigned_to ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center">
                              {bug.assigned_to.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-800">{bug.assigned_to}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Reporter */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-slate-700">
                        {bug.reported_by || "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditBug(bug)}
                            className="px-2 py-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded font-semibold transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteBug(bug.id)}
                            className="px-2 py-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded font-semibold transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Reproduction Steps & Details Accordion */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-b border-slate-200">
                        <td colSpan={7} className="px-8 py-4">
                          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-2xs space-y-3">
                            <div>
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Full Description
                              </h5>
                              <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                                {bug.description || "No full description provided."}
                              </p>
                            </div>

                            {bug.reproduction_steps && (
                              <div className="pt-2 border-t border-slate-100">
                                <h5 className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-1">
                                  Steps to Reproduce
                                </h5>
                                <div className="p-2.5 bg-red-50/50 rounded-md border border-red-100 font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed">
                                  {bug.reproduction_steps}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BugTracker;

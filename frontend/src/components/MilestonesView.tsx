"use client";

import React from "react";
import { Milestone, Task, MilestoneStatus } from "@/types";

interface MilestonesViewProps {
  milestones: Milestone[];
  tasks: Task[];
  onOpenCreateMilestone: () => void;
  onEditMilestone: (m: Milestone) => void;
  onDeleteMilestone: (mId: string) => void;
  onStatusChange: (mId: string, status: MilestoneStatus) => Promise<void>;
  onFilterByMilestone?: (milestoneId: string) => void;
}

export const MilestonesView: React.FC<MilestonesViewProps> = ({
  milestones,
  tasks,
  onOpenCreateMilestone,
  onEditMilestone,
  onDeleteMilestone,
  onStatusChange,
  onFilterByMilestone,
}) => {
  const getStatusBadge = (status: MilestoneStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Active
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Completed
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            <span>Project Milestones & Sprints</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              {milestones.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Group tasks into key delivery milestones and track sprint completion.
          </p>
        </div>

        <button
          onClick={onOpenCreateMilestone}
          className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all gap-1.5"
        >
          <span className="text-sm font-bold leading-none">+</span>
          <span>New Milestone</span>
        </button>
      </div>

      {/* Milestones List */}
      <div className="space-y-4">
        {milestones.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-2xs">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">No milestones created yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your first milestone or sprint to organize tasks into clear delivery deadlines.
            </p>
            <button
              onClick={onOpenCreateMilestone}
              className="mt-4 px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              + Create Milestone
            </button>
          </div>
        ) : (
          milestones.map((milestone) => {
            const milestoneTasks = tasks.filter((t) => t.milestone_id === milestone.id);
            const completedCount = milestoneTasks.filter((t) => t.status === "completed").length;
            const progress = milestoneTasks.length > 0 ? Math.round((completedCount / milestoneTasks.length) * 100) : 0;

            return (
              <div
                key={milestone.id}
                className="bg-white rounded-xl shadow-2xs border border-slate-200 hover:border-purple-300 transition-all p-5 space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {getStatusBadge(milestone.status)}
                      <h4 className="font-bold text-base text-slate-900">{milestone.title}</h4>
                    </div>
                    {milestone.description && (
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{milestone.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <select
                      value={milestone.status}
                      onChange={(e) => onStatusChange(milestone.id, e.target.value as MilestoneStatus)}
                      className="text-xs font-semibold py-1 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 cursor-pointer outline-none"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>

                    <button
                      onClick={() => onEditMilestone(milestone)}
                      className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                      title="Edit milestone"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => onDeleteMilestone(milestone.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete milestone"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Dates & Task Count */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  {milestone.start_date && (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Start: <strong>{new Date(milestone.start_date).toLocaleDateString()}</strong></span>
                    </span>
                  )}
                  {milestone.end_date && (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Target: <strong>{new Date(milestone.end_date).toLocaleDateString()}</strong></span>
                    </span>
                  )}
                  <span className="ml-auto font-semibold text-purple-700">
                    {completedCount} / {milestoneTasks.length} tasks completed ({progress}%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Tasks inside this milestone */}
                {milestoneTasks.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Linked Tasks:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {milestoneTasks.map((t) => (
                        <span
                          key={t.id}
                          className={`text-sm px-3 py-1.5 rounded-lg border font-medium flex items-center gap-2 ${
                            t.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 line-through"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {t.status === "completed" ? (
                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                          )}
                          <span>{t.title}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MilestonesView;

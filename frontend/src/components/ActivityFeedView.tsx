"use client";

import React from "react";
import { ActivityLog } from "@/types";

interface ActivityFeedViewProps {
  activities: ActivityLog[];
}

export const ActivityFeedView: React.FC<ActivityFeedViewProps> = ({ activities }) => {
  const getActionIcon = (entityType: string) => {
    switch (entityType) {
      case "task":
        return (
          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case "subtask":
        return (
          <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        );
      case "bug":
        return (
          <svg className="w-3.5 h-3.5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-4m0 0H4m14-4a5 5 0 00-10 0v4a5 5 0 0010 0v-4zm-8-5l-2-2m10 2l2-2" />
          </svg>
        );
      case "milestone":
        return (
          <svg className="w-3.5 h-3.5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
        );
      case "timelog":
        return (
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "moved":
      case "updated":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "completed":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "deleted":
        return "bg-red-50 text-red-700 border border-red-200";
      case "logged_time":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-2xs border border-slate-200">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Project Activity Feed & Audit Trail</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            {activities.length} events
          </span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time record of all actions, task progressions, bug reports, and logged hours.
        </p>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200 p-6">
        {activities.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 italic">
            No activity recorded yet. Create a task or log hours to see history here.
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                {/* Timeline node icon */}
                <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-2xs group-hover:border-blue-500 transition-colors">
                  {getActionIcon(act.entity_type)}
                </div>

                <div className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 transition-all">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{act.user_name}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${getActionBadgeColor(act.action)}`}>
                        {act.action}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(act.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">{act.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeedView;

"use client";

import React, { useState } from "react";
import { TimeLog } from "@/types";

interface TimesheetsViewProps {
  timelogs: TimeLog[];
  totalHours: number;
  billableHours: number;
  onOpenLogModal: () => void;
  onEditLog: (log: TimeLog) => void;
  onDeleteLog: (logId: string) => void;
}

export const TimesheetsView: React.FC<TimesheetsViewProps> = ({
  timelogs,
  totalHours,
  billableHours,
  onOpenLogModal,
  onEditLog,
  onDeleteLog,
}) => {
  const [filterType, setFilterType] = useState<"all" | "billable" | "non_billable">("all");

  const nonBillableHours = Math.max(0, totalHours - billableHours);

  const filteredLogs = timelogs.filter((l) => {
    if (filterType === "billable") return l.is_billable;
    if (filterType === "non_billable") return !l.is_billable;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Logged Time</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalHours.toFixed(1)} hrs</div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Billable Hours</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{billableHours.toFixed(1)} hrs</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Non-Billable</span>
            <div className="text-2xl font-bold text-slate-700 mt-1">{nonBillableHours.toFixed(1)} hrs</div>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-2xs border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filter:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterType === "all" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Logs ({timelogs.length})
            </button>
            <button
              onClick={() => setFilterType("billable")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterType === "billable" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Billable
            </button>
            <button
              onClick={() => setFilterType("non_billable")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterType === "non_billable" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Non-Billable
            </button>
          </div>
        </div>

        <button
          onClick={onOpenLogModal}
          className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all gap-1.5"
        >
          <span className="text-sm font-bold leading-none">+</span>
          <span>Log Work Time</span>
        </button>
      </div>

      {/* Table of logs */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-3.5 py-3.5">Member</th>
                <th className="px-3.5 py-3.5">Linked Work Item</th>
                <th className="px-3.5 py-3.5">Description</th>
                <th className="px-3.5 py-3.5">Type</th>
                <th className="px-3.5 py-3.5 text-right">Hours</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-slate-400 italic">
                    No time entries found. Click &quot;Log Work Time&quot; to record hours.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      {new Date(log.date).toLocaleDateString()}
                    </td>
                    <td className="px-3.5 py-3.5 text-sm text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6.5 h-6.5 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center shadow-2xs">
                          {log.user_name ? log.user_name.slice(0, 2).toUpperCase() : "US"}
                        </div>
                        <span className="font-semibold text-slate-800">{log.user_name}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3.5 text-sm max-w-xs truncate">
                      {log.task_title ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 text-xs shadow-2xs">
                          <svg className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="truncate">{log.task_title}</span>
                        </span>
                      ) : log.bug_title ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-100 text-xs shadow-2xs">
                          <svg className="w-3.5 h-3.5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-4m0 0H4m14-4a5 5 0 00-10 0v4a5 5 0 0010 0v-4zm-8-5l-2-2m10 2l2-2" />
                          </svg>
                          <span className="truncate">{log.bug_title}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">General Project</span>
                      )}
                    </td>
                    <td className="px-3.5 py-3.5 text-sm text-slate-600 max-w-sm truncate">
                      {log.description || "—"}
                    </td>
                    <td className="px-3.5 py-3.5 whitespace-nowrap">
                      {log.is_billable ? (
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Billable
                        </span>
                      ) : (
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Non-billable
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3.5 text-right font-bold text-base text-slate-900 whitespace-nowrap">
                      {log.hours.toFixed(1)} h
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditLog(log)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteLog(log.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
    </div>
  );
};

export default TimesheetsView;

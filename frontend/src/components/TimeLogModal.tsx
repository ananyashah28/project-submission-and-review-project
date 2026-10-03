"use client";

import React, { useState, useEffect } from "react";
import { TimeLog, TimeLogCreate, Task, Bug } from "@/types";

interface TimeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TimeLogCreate) => Promise<void>;
  tasks: Task[];
  bugs: Bug[];
  initialData?: TimeLog | null;
  defaultTaskId?: string;
  defaultBugId?: string;
}

export const TimeLogModal: React.FC<TimeLogModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tasks,
  bugs,
  initialData,
  defaultTaskId,
  defaultBugId,
}) => {
  const [hours, setHours] = useState<number>(1);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [isBillable, setIsBillable] = useState(true);
  const [userName, setUserName] = useState("");
  const [targetType, setTargetType] = useState<"task" | "bug" | "general">("task");
  const [taskId, setTaskId] = useState("");
  const [bugId, setBugId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setHours(initialData.hours);
      setDate(initialData.date ? initialData.date.substring(0, 10) : "");
      setDescription(initialData.description || "");
      setIsBillable(initialData.is_billable);
      setUserName(initialData.user_name || "");
      if (initialData.task_id) {
        setTargetType("task");
        setTaskId(initialData.task_id);
      } else if (initialData.bug_id) {
        setTargetType("bug");
        setBugId(initialData.bug_id);
      } else {
        setTargetType("general");
      }
    } else {
      setHours(1);
      setDate(new Date().toISOString().substring(0, 10));
      setDescription("");
      setIsBillable(true);
      setUserName("");
      if (defaultTaskId) {
        setTargetType("task");
        setTaskId(defaultTaskId);
      } else if (defaultBugId) {
        setTargetType("bug");
        setBugId(defaultBugId);
      } else {
        setTargetType("task");
        setTaskId(tasks[0]?.id || "");
      }
    }
    setError(null);
  }, [initialData, defaultTaskId, defaultBugId, isOpen, tasks, bugs]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hours <= 0 || hours > 24) {
      setError("Please enter valid hours (between 0.1 and 24)");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        hours: Number(hours),
        date: date ? new Date(date).toISOString() : undefined,
        description: description.trim() || undefined,
        is_billable: isBillable,
        user_name: userName.trim() || undefined,
        task_id: targetType === "task" && taskId ? taskId : undefined,
        bug_id: targetType === "bug" && bugId ? bugId : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to log time");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fadeIn">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            {initialData ? "Edit Time Log" : "Log Hours (Timesheet)"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Target type switcher */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Log Time For:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetType("task")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                  targetType === "task"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Task</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType("bug")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                  targetType === "bug"
                    ? "bg-red-50 border-red-500 text-red-700"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-4m0 0H4m14-4a5 5 0 00-10 0v4a5 5 0 0010 0v-4zm-8-5l-2-2m10 2l2-2" />
                </svg>
                <span>Bug</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType("general")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                  targetType === "general"
                    ? "bg-gray-100 border-gray-500 text-gray-800"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>General</span>
              </button>
            </div>
          </div>

          {/* Select task if task */}
          {targetType === "task" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Select Task</label>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 text-sm bg-white"
              >
                <option value="">(None - General Project Time)</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Select bug if bug */}
          {targetType === "bug" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Select Bug</label>
              <select
                value={bugId}
                onChange={(e) => setBugId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 text-sm bg-white"
              >
                <option value="">(None)</option>
                {bugs.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Hours Worked <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.25"
                min="0.1"
                max="24"
                required
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 text-sm bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Work Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on or accomplish?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 text-sm resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <span className="font-semibold text-sm text-gray-900 block">Billable Time</span>
              <span className="text-xs text-gray-500">Should this time be invoiced to client?</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isBillable}
                onChange={(e) => setIsBillable(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Logging..." : initialData ? "Save Changes" : "Log Hours"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeLogModal;

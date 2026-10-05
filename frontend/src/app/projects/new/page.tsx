"use client";

/**
 * Create New Project Page
 * - Standard, comfortable typography and generous spacing
 * - Team Members / Assignee Permission Multi-Select Dropdown
 * - Users selected will be given access to the project workspace and appear in task/bug assignee dropdowns
 */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute, AppLayout } from "@/components";
import { ProjectCreate, User } from "@/types";
import projectService from "@/services/projectService";
import userService from "@/services/userService";
import { useAuth } from "@/context";

const CATEGORIES = [
  "Web Application",
  "Mobile Application",
  "Desktop Application",
  "API/Backend",
  "Data Science",
  "Machine Learning",
  "DevOps",
  "Other",
];

function CreateProjectContent() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [techInput, setTechInput] = useState("");

  // All available system users for team assignment
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const [formData, setFormData] = useState<ProjectCreate>({
    title: "",
    description: "",
    category: "",
    technologies: [],
    github_url: "",
    demo_url: "",
  });

  // Fetch available users to add as project members
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await userService.searchUsers();
        setAvailableUsers(users);
      } catch (err) {
        console.error("Failed to load users:", err);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleAddTech = () => {
    const tech = techInput.trim();
    if (tech && !formData.technologies?.includes(tech)) {
      setFormData((prev) => ({
        ...prev,
        technologies: [...(prev.technologies || []), tech],
      }));
      setTechInput("");
    }
  };

  const handleRemoveTech = (techToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies?.filter((t) => t !== techToRemove) || [],
    }));
  };

  const handleTechKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTech();
    }
  };

  // Team member toggling
  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  // Filtered available users (exclude current user who is owner by default)
  const selectableUsers = availableUsers.filter(
    (u) => u.id !== currentUser?.id
  );

  const filteredSelectableUsers = selectableUsers.filter((u) => {
    if (!userSearchQuery) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  const selectedUsers = availableUsers.filter((u) =>
    selectedUserIds.includes(u.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: ProjectCreate = {
        ...formData,
        member_ids: selectedUserIds,
      };
      const project = await projectService.createProject(payload);
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.title.trim().length > 0;

  return (
    <AppLayout showFooter={false}>
      <main className="max-w-4xl mx-auto py-10 px-6 sm:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-4"
          >
            <svg
              className="h-4 w-4 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </Link>
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xs">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Create New Project
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1">
                Configure your project workspace, assign team members, and set permissions.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-5 flex items-start space-x-3">
              <svg
                className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* 1. Basic Information Card */}
          <div className="bg-white shadow-xs rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <svg
                  className="h-5 w-5 mr-2.5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Basic Information
              </h2>
            </div>
            <div className="p-6 sm:p-7 space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-bold text-slate-800 mb-2"
                >
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 text-base rounded-xl border border-slate-300 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 placeholder-slate-400"
                  placeholder="e.g., Customer Portal Redesign"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-bold text-slate-800 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-slate-300 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 placeholder-slate-400 resize-none leading-relaxed"
                  placeholder="Describe project objectives, key deliverables, and scope..."
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-bold text-slate-800 mb-2"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-slate-300 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 bg-white cursor-pointer"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Team Members & Permissions Selection Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <svg
                  className="h-5 w-5 mr-2.5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Project Team & Assignees
              </h2>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {selectedUserIds.length + 1} Total ({selectedUserIds.length} Members + 1 Owner)
              </span>
            </div>

            <div className="p-6 sm:p-7 space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                Add team members who will have access to view this project in their dashboard. 
                Only users assigned here will appear in the task and bug assignee dropdowns inside this workspace.
              </p>

              {/* Add Colleagues from Directory */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-800">
                  Add People to Workspace
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search available colleagues by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder-slate-400 transition-all"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Directory List for fast 1-click Add */}
                <div className="border border-slate-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white shadow-2xs">
                  {filteredSelectableUsers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      {selectableUsers.length === 0
                        ? "No other colleagues found in directory."
                        : "No matching users found."}
                    </div>
                  ) : (
                    filteredSelectableUsers.map((u) => {
                      const isSelected = selectedUserIds.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-slate-900 truncate">{u.name}</div>
                              <div className="text-xs text-slate-500 truncate">{u.email}</div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleUser(u.id)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shrink-0 ${
                              isSelected
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                            }`}
                          >
                            {isSelected ? "✓ In Project (Remove)" : "+ Add to Project"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Active Workspace Team Members List */}
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-bold text-slate-800">
                  Active Workspace Team ({selectedUsers.length + 1})
                </label>

                <div className="space-y-2.5">
                  {/* Owner Display */}
                  <div className="p-3.5 bg-slate-50/90 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "ME"}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <span>{currentUser?.name || "You"}</span>
                          <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-md">
                            Owner & Admin
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">{currentUser?.email}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      Permanent Owner
                    </span>
                  </div>

                  {/* Selected Members */}
                  {selectedUsers.length === 0 ? (
                    <div className="p-4 bg-slate-50/60 border border-dashed border-slate-200 rounded-xl text-center text-sm text-slate-500">
                      No additional team members added yet. Search and click &quot;+ Add to Project&quot; above to invite colleagues.
                    </div>
                  ) : (
                    selectedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-between transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                              <span>{u.name}</span>
                              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md">
                                Team Member / Assignee
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveMember(u.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <span>Remove</span>
                          <span>×</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Technologies Card */}
          <div className="bg-white shadow-xs rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <svg
                  className="h-5 w-5 mr-2.5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                Technologies & Stack
              </h2>
            </div>
            <div className="p-6 sm:p-7 space-y-4">
              <label className="block text-sm font-bold text-slate-800">
                Technologies Used
              </label>
              <div className="flex space-x-2.5">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={handleTechKeyDown}
                  className="flex-1 px-4 py-3 text-sm sm:text-base rounded-xl border border-slate-300 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 placeholder-slate-400"
                  placeholder="e.g., React, Node.js, FastAPI, PostgreSQL"
                />
                <button
                  type="button"
                  onClick={handleAddTech}
                  disabled={!techInput.trim()}
                  className="px-5 py-3 bg-slate-100 text-slate-800 rounded-xl border border-slate-300 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-sm"
                >
                  Add
                </button>
              </div>

              {formData.technologies && formData.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {formData.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(tech)}
                        className="ml-2 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-500 hover:bg-blue-200 hover:text-blue-700 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. Links Card */}
          <div className="bg-white shadow-xs rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <svg
                  className="h-5 w-5 mr-2.5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Repository & Demo Links
              </h2>
            </div>
            <div className="p-6 sm:p-7 space-y-5">
              <div>
                <label
                  htmlFor="github_url"
                  className="block text-sm font-bold text-slate-800 mb-2"
                >
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  id="github_url"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-slate-300 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 placeholder-slate-400"
                  placeholder="https://github.com/username/project"
                />
              </div>

              <div>
                <label
                  htmlFor="demo_url"
                  className="block text-sm font-bold text-slate-800 mb-2"
                >
                  Live Demo URL
                </label>
                <input
                  type="url"
                  id="demo_url"
                  name="demo_url"
                  value={formData.demo_url}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-slate-300 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 placeholder-slate-400"
                  placeholder="https://my-demo-app.com"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-bold text-sm"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm shadow-xs flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Creating Workspace...</span>
                </>
              ) : (
                <span>Create Workspace</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </AppLayout>
  );
}

export default function CreateProjectPage() {
  return (
    <ProtectedRoute>
      <CreateProjectContent />
    </ProtectedRoute>
  );
}

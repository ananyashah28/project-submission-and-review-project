"use client";

/**
 * Edit Project Page
 * - Standard, comfortable typography and generous spacing
 * - Built-in Team Members & Assignees Management (No clipped popups)
 * - Update existing project details and manage team access permissions
 */
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute, AppLayout } from "@/components";
import { ProjectUpdate, User, ProjectMember } from "@/types";
import projectService from "@/services/projectService";
import userService from "@/services/userService";
import projectMemberService from "@/services/projectMemberService";
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

function EditProjectContent() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { user: currentUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [techInput, setTechInput] = useState("");

  // Team members management
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [projectOwnerId, setProjectOwnerId] = useState<string>("");

  const [formData, setFormData] = useState<ProjectUpdate>({
    title: "",
    description: "",
    category: "",
    technologies: [],
    github_url: "",
    demo_url: "",
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [project, membersData, users] = await Promise.all([
          projectService.getProject(projectId),
          projectMemberService.getProjectMembers(projectId).catch(() => ({ members: [] })),
          userService.searchUsers().catch(() => []),
        ]);

        setFormData({
          title: project.title,
          description: project.description || "",
          category: project.category || "",
          technologies: project.technologies || [],
          github_url: project.github_url || "",
          demo_url: project.demo_url || "",
        });

        setProjectOwnerId(project.user_id);
        setAvailableUsers(users);

        // Populate selected members from existing members (excluding owner)
        const existingMemberIds = (membersData.members || [])
          .filter((m: ProjectMember) => m.user_id !== project.user_id)
          .map((m: ProjectMember) => m.user_id);

        setSelectedUserIds(existingMemberIds);
      } catch (err: any) {
        setError(err.message || "Failed to load project details");
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchAllData();
    }
  }, [projectId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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

  // Filtered available users (exclude project owner)
  const selectableUsers = availableUsers.filter(
    (u) => u.id !== projectOwnerId
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

  const ownerUser = availableUsers.find((u) => u.id === projectOwnerId) || currentUser;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: ProjectUpdate = {
        ...formData,
        member_ids: selectedUserIds,
      };
      await projectService.updateProject(projectId, payload);
      router.push(`/projects/${projectId}`);
    } catch (err: any) {
      setError(err.message || "Failed to update project");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout showFooter={false}>
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFooter={false}>
      <main className="max-w-4xl mx-auto py-10 px-6 sm:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors"
          >
            <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Project Workspace
          </Link>
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xs">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Edit Project Workspace
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1">
                Update details, manage assigned team members, and configure workspace options.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-5 flex items-start space-x-3">
              <svg className="h-5 w-5 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* 1. Basic Info Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <svg className="h-5 w-5 mr-2.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Basic Information
              </h2>
            </div>
            <div className="p-6 sm:p-7 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-bold text-slate-800 mb-2">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-900 placeholder-slate-400"
                  placeholder="Enter project title"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-bold text-slate-800 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-900 placeholder-slate-400 resize-none leading-relaxed"
                  placeholder="Describe what your project does, its features, and goals..."
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-bold text-slate-800 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-900 bg-white cursor-pointer"
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
                <svg className="h-5 w-5 mr-2.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Project Team & Assignees
              </h2>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {selectedUserIds.length + 1} Total ({selectedUserIds.length} Members + 1 Owner)
              </span>
            </div>

            <div className="p-6 sm:p-7 space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                Add or remove team members. Users assigned to this workspace will be able to view it in their dashboard 
                and will be available in the task and bug assignee dropdowns.
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
                  {/* Owner Card */}
                  <div className="p-3.5 bg-slate-50/90 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {ownerUser?.name ? ownerUser.name.slice(0, 2).toUpperCase() : "OW"}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <span>{ownerUser?.name || "Project Owner"}</span>
                          <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-md">
                            Owner & Admin
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">{ownerUser?.email}</div>
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
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <svg className="h-5 w-5 mr-2.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Technologies
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
                  className="flex-1 px-4 py-3 text-sm sm:text-base rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-900 placeholder-slate-400"
                  placeholder="e.g., React, TypeScript, FastAPI"
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
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <svg className="h-5 w-5 mr-2.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Links
              </h2>
            </div>
            <div className="p-6 sm:p-7 space-y-5">
              <div>
                <label htmlFor="github_url" className="block text-sm font-bold text-slate-800 mb-2">
                  GitHub URL
                </label>
                <input
                  type="url"
                  id="github_url"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-900 placeholder-slate-400"
                  placeholder="https://github.com/username/project"
                />
              </div>

              <div>
                <label htmlFor="demo_url" className="block text-sm font-bold text-slate-800 mb-2">
                  Demo URL
                </label>
                <input
                  type="url"
                  id="demo_url"
                  name="demo_url"
                  value={formData.demo_url}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-900 placeholder-slate-400"
                  placeholder="https://demo.example.com"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <Link
              href={`/projects/${projectId}`}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-bold text-sm"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title?.trim()}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm shadow-xs flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </AppLayout>
  );
}

export default function EditProjectPage() {
  return (
    <ProtectedRoute>
      <EditProjectContent />
    </ProtectedRoute>
  );
}

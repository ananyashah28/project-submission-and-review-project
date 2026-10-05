"use client";

/**
 * Enterprise Projects Portfolio & Directory
 * - Modeled after Atlassian Jira "Projects" and Zoho Projects "Project Portfolio"
 * - Portfolio KPI Summary Strip
 * - Real-time Search, Status Filtering, and Grid / Table view toggle
 * - Member count and role indicators
 * - Direct "Open Workspace →" link to Kanban board, bugs, milestones, and timesheets
 */
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ProtectedRoute, AppLayout, ConfirmModal, StatusBadge } from "@/components";
import { Project, ProjectStatus } from "@/types";
import projectService from "@/services/projectService";

interface DeleteModalState {
  isOpen: boolean;
  projectId: string | null;
  projectTitle: string;
}

function ProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    projectId: null,
    projectTitle: "",
  });

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await projectService.getProjects();
        setProjects(data);
      } catch (err: any) {
        setError(err.message || "Failed to load projects");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(search.toLowerCase())) ||
        (p.technologies && p.technologies.some((t) => t.toLowerCase().includes(search.toLowerCase())));

      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      total: projects.length,
      draft: projects.filter((p) => p.status === "draft").length,
      review: projects.filter((p) => p.status === "submitted" || p.status === "under_review").length,
      approved: projects.filter((p) => p.status === "approved").length,
    };
  }, [projects]);

  const handleDelete = (projectId: string, projectTitle: string) => {
    setDeleteModal({ isOpen: true, projectId, projectTitle });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.projectId) return;

    setIsDeleting(true);
    try {
      await projectService.deleteProject(deleteModal.projectId);
      setProjects((prev) => prev.filter((p) => p.id !== deleteModal.projectId));
      setDeleteModal({ isOpen: false, projectId: null, projectTitle: "" });
    } catch (err: any) {
      alert(err.message || "Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AppLayout showFooter={false}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8">
        {/* ========================================================================= */}
        {/* Jira / Zoho Projects Header                                              */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">Projects Portfolio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Projects Portfolio
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Manage your engineering workspaces, assignments, deliverables, and submissions.
            </p>
          </div>

          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Project</span>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* Quick KPI Strip                                                           */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div
            onClick={() => setStatusFilter("all")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10"
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Projects
            </div>
            <div className="text-2xl sm:text-3xl font-black mt-2">{counts.total}</div>
          </div>

          <div
            onClick={() => setStatusFilter("draft")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === "draft"
                ? "bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-800/10"
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              In Preparation
            </div>
            <div className="text-2xl sm:text-3xl font-black mt-2">{counts.draft}</div>
          </div>

          <div
            onClick={() => setStatusFilter("under_review")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === "under_review" || statusFilter === "submitted"
                ? "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-600/10"
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Under Review
            </div>
            <div className="text-2xl sm:text-3xl font-black mt-2">{counts.review}</div>
          </div>

          <div
            onClick={() => setStatusFilter("approved")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === "approved"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-600/10"
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-500">
              Approved
            </div>
            <div className="text-2xl sm:text-3xl font-black mt-2">{counts.approved}</div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Filter and View Controls Toolbar                                          */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {/* Search Input */}
            <div className="relative min-w-[240px] max-w-sm flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects by name, category, tech..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "all")}
              className="text-sm font-semibold py-2 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer hover:bg-white transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="changes_requested">Changes Requested</option>
            </select>

            {(search || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="text-sm font-semibold text-slate-500 hover:text-slate-900 underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === "grid" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z" />
              </svg>
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === "table" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
              </svg>
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Main Projects Display Area                                                */}
        {/* ========================================================================= */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
              <p className="text-sm font-semibold text-slate-500">Loading projects...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700 text-sm">
            {error}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">No projects found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== "all"
                ? "No projects match your search or filter criteria."
                : "Get started by creating your first project workspace."}
            </p>
            <Link
              href="/projects/new"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Project</span>
            </Link>
          </div>
        ) : viewMode === "grid" ? (
          /* ========================================================================= */
          /* JIRA / ZOHO PROJECT CARDS GRID                                            */
          /* ========================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const initials = project.title.slice(0, 2).toUpperCase();
              const shortKey = `PRJ-${project.id.slice(0, 4).toUpperCase()}`;
              const membersCount = project.members_count ?? 1;
              const isOwner = project.is_owner ?? true;

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Avatar + Title + Status */}
                    <div className="flex items-start justify-between gap-3 mb-3.5">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-xs flex-shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/projects/${project.id}`}
                            className="font-bold text-base text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                            title={project.title}
                          >
                            {project.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="font-mono text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                              {shortKey}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-500 truncate max-w-[130px]">
                              {project.category || "Software Project"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <StatusBadge status={project.status} size="sm" />
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          isOwner
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {isOwner ? "Owner" : "Member"}
                        </span>
                      </div>
                    </div>

                    {/* Members Count */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 font-medium">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>{membersCount} {membersCount === 1 ? "team member" : "team members"}</span>
                    </div>

                    {/* Description preview */}
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
                      {project.description || "No project description provided."}
                    </p>

                    {/* Tech Stack Chips */}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {project.technologies.slice(0, 3).map((tech, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > 3 && (
                          <span className="text-xs text-slate-400 self-center">
                            +{project.technologies.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Date + Primary "Open Workspace" Button */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-sm">
                    <span className="text-xs text-slate-400">
                      Created {formatDate(project.created_at)}
                    </span>

                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <>
                          <Link
                            href={`/projects/${project.id}/edit`}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Project Settings"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </Link>

                          <button
                            onClick={() => handleDelete(project.id, project.title)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Project"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}

                      <Link
                        href={`/projects/${project.id}`}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>Workspace</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ========================================================================= */
          /* JIRA PROJECTS DIRECTORY TABLE                                             */
          /* ========================================================================= */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-5 py-4">Key</th>
                  <th className="px-4 py-4">Project Name</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Team</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Created</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((project) => {
                  const shortKey = `PRJ-${project.id.slice(0, 4).toUpperCase()}`;
                  const isOwner = project.is_owner ?? true;

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-slate-400 group-hover:text-blue-600 whitespace-nowrap">
                        {shortKey}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors block text-base"
                        >
                          {project.title}
                        </Link>
                        {project.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {project.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-600 text-sm">
                        {project.category || "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600 text-sm whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {project.members_count ?? 1}
                        </span>{" "}
                        members
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={project.status} size="sm" />
                      </td>
                      <td className="px-4 py-4 text-slate-400 text-xs whitespace-nowrap">
                        {formatDate(project.created_at)}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {isOwner && (
                            <>
                              <Link
                                href={`/projects/${project.id}/edit`}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </Link>
                              <button
                                onClick={() => handleDelete(project.id, project.title)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                          <Link
                            href={`/projects/${project.id}`}
                            className="px-3.5 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
                          >
                            Workspace →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          title="Delete Project Workspace"
          message={`Are you sure you want to delete "${deleteModal.projectTitle}"? All associated Kanban tasks, bug reports, sprint milestones, and timesheets will be permanently removed.`}
          confirmText={isDeleting ? "Deleting..." : "Delete Project"}
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal({ isOpen: false, projectId: null, projectTitle: "" })}
        />
      </div>
    </AppLayout>
  );
}

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <ProjectsContent />
    </ProtectedRoute>
  );
}

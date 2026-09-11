"use client";

/**
 * Projects List Page
 */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProtectedRoute, AppLayout, ConfirmModal } from "@/components";
import { Project, ProjectStatus } from "@/types";
import projectService from "@/services/projectService";

interface DeleteModalState {
  isOpen: boolean;
  projectId: string | null;
  projectTitle: string;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  changes_requested: "Changes Requested",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  changes_requested: "bg-red-100 text-red-800",
};

function ProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
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
        const params = statusFilter ? { status: statusFilter as ProjectStatus } : {};
        const data = await projectService.getProjects(params);
        setProjects(data);
      } catch (err: any) {
        setError(err.message || "Failed to load projects");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [statusFilter]);

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
    <AppLayout>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">My Projects</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage and track your project submissions
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                href="/projects/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Project
              </Link>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex items-center space-x-4">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
              Filter by status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "")}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="changes_requested">Changes Requested</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 rounded-lg p-4 text-red-800">{error}</div>
          ) : projects.length === 0 ? (
            <div className="bg-white shadow rounded-lg">
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {statusFilter
                    ? `No projects with status "${STATUS_LABELS[statusFilter]}"`
                    : "Get started by creating your first project"}
                </p>
                {!statusFilter && (
                  <div className="mt-6">
                    <Link
                      href="/projects/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Create Project
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <ul className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <li key={project.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/projects/${project.id}`}
                            className="text-lg font-medium text-blue-600 hover:text-blue-800 truncate"
                          >
                            {project.title}
                          </Link>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            {project.category && <span>{project.category}</span>}
                            <span>Created {formatDate(project.created_at)}</span>
                          </div>
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {project.technologies.slice(0, 5).map((tech, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {tech}
                                </span>
                              ))}
                              {project.technologies.length > 5 && (
                                <span className="text-xs text-gray-500">
                                  +{project.technologies.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              STATUS_COLORS[project.status]
                            }`}
                          >
                            {STATUS_LABELS[project.status]}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/projects/${project.id}/edit`}
                              className="text-gray-400 hover:text-gray-600"
                              title="Edit"
                            >
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDelete(project.id, project.title)}
                              className="text-gray-400 hover:text-red-600"
                              title="Delete"
                            >
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          title="Delete Project"
          message={`Are you sure you want to delete "${deleteModal.projectTitle}"? This action cannot be undone and all associated files will be permanently removed.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal({ isOpen: false, projectId: null, projectTitle: "" })}
          isLoading={isDeleting}
        />
      </main>
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

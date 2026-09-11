"use client";

/**
 * Reviewer Dashboard Page
 * Shows all projects pending review with approve/reject functionality
 */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProtectedRoute, AppLayout, StatusBadge, ConfirmModal, useToast } from "@/components";
import { Project } from "@/types";
import projectService from "@/services/projectService";

interface ReviewModalState {
  isOpen: boolean;
  project: Project | null;
  decision: "approved" | "changes_requested" | null;
}

function ReviewDashboardContent() {
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<ReviewModalState>({
    isOpen: false,
    project: null,
    decision: null,
  });
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const data = await projectService.getProjectsForReview();
      setProjects(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openReviewModal = (project: Project, decision: "approved" | "changes_requested") => {
    setReviewModal({ isOpen: true, project, decision });
    setReviewComment("");
  };

  const closeReviewModal = () => {
    setReviewModal({ isOpen: false, project: null, decision: null });
    setReviewComment("");
  };

  const handleSubmitReview = async () => {
    if (!reviewModal.project || !reviewModal.decision) return;

    setIsSubmitting(true);
    try {
      await projectService.reviewProject(reviewModal.project.id, {
        status: reviewModal.decision,
        review_comment: reviewComment || undefined,
      });
      
      // Remove the project from the list
      setProjects((prev) => prev.filter((p) => p.id !== reviewModal.project!.id));
      closeReviewModal();
      
      if (reviewModal.decision === "approved") {
        toast.success("Project Approved", "The project has been approved successfully.");
      } else {
        toast.info("Changes Requested", "Feedback has been sent to the project author.");
      }
    } catch (err: any) {
      toast.error("Review Failed", err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="px-4 sm:px-0 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Review Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Review and approve submitted projects
          </p>
        </div>

        {error && (
          <div className="px-4 sm:px-0 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
              <button
                onClick={fetchProjects}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Projects List */}
        <div className="px-4 sm:px-0">
          {projects.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No projects pending review
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                All submitted projects have been reviewed. Check back later for new submissions.
              </p>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  {projects.length} project{projects.length !== 1 ? "s" : ""} pending review
                </span>
              </div>
              <ul className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <li key={project.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/projects/${project.id}`}
                            className="text-lg font-medium text-blue-600 hover:text-blue-800 truncate"
                          >
                            {project.title}
                          </Link>
                          <StatusBadge status={project.status} size="sm" />
                        </div>
                        
                        {project.category && (
                          <p className="mt-1 text-sm text-gray-500">{project.category}</p>
                        )}
                        
                        {project.description && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {project.description}
                          </p>
                        )}

                        {project.technologies && project.technologies.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {project.technologies.slice(0, 5).map((tech, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
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

                        {/* Submission Comment */}
                        {project.submission_comment && (
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-md">
                            <p className="text-xs font-medium text-blue-700 mb-1">Author&apos;s Note:</p>
                            <p className="text-sm text-blue-800">{project.submission_comment}</p>
                          </div>
                        )}

                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span>Submitted: {formatDate(project.submitted_at)}</span>
                          {project.github_url && (
                            <a
                              href={project.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                              </svg>
                              GitHub
                            </a>
                          )}
                          {project.demo_url && (
                            <a
                              href={project.demo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Demo
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="ml-4 flex flex-col gap-2">
                        <button
                          onClick={() => openReviewModal(project, "approved")}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                        >
                          <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => openReviewModal(project, "changes_requested")}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
                        >
                          <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Request Changes
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      {/* Review Modal */}
      {reviewModal.isOpen && reviewModal.project && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={closeReviewModal}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                {reviewModal.decision === "approved" ? (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {reviewModal.decision === "approved" ? "Approve Project" : "Request Changes"}
                  </h3>
                  <p className="text-sm text-gray-500 truncate max-w-xs">
                    {reviewModal.project.title}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="review-comment"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {reviewModal.decision === "approved"
                    ? "Comment (optional)"
                    : "Feedback for the author"}
                </label>
                <textarea
                  id="review-comment"
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    reviewModal.decision === "approved"
                      ? "Add any comments for the project author..."
                      : "Explain what changes are needed..."
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                {reviewModal.decision === "changes_requested" && !reviewComment && (
                  <p className="mt-1 text-xs text-amber-600">
                    Consider adding feedback to help the author improve their project
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeReviewModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${
                    reviewModal.decision === "approved"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isSubmitting
                    ? "Submitting..."
                    : reviewModal.decision === "approved"
                    ? "Approve"
                    : "Request Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function ReviewDashboardPage() {
  return (
    <ProtectedRoute>
      <ReviewDashboardContent />
    </ProtectedRoute>
  );
}

"use client";

/**
 * Project Detail Page
 */
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute, AppLayout, FileUpload, ConfirmModal, StatusBadge, useToast } from "@/components";
import { Project } from "@/types";
import projectService from "@/services/projectService";
import axiosInstance, { getErrorMessage } from "@/lib/axios";

interface ProjectFileResponse {
  id: string;
  project_id: string;
  file_name: string;
  file_type: string | null;
  s3_key: string;
  file_size: number | null;
  created_at: string;
  download_url: string | null;
  is_image: boolean;
}

interface DeleteModalState {
  isOpen: boolean;
  type: "project" | "file";
  fileId?: string;
  fileName?: string;
}

interface SubmitModalState {
  isOpen: boolean;
  comment: string;
}

function ProjectDetailContent() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const toast = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFileResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    type: "file",
  });
  const [submitModal, setSubmitModal] = useState<SubmitModalState>({
    isOpen: false,
    comment: "",
  });

  const fetchFiles = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/projects/${projectId}/files`);
      setFiles(response.data.files || []);
    } catch (err) {
      console.error("Failed to fetch files:", err);
    }
  }, [projectId]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await projectService.getProject(projectId);
        setProject(data);
        await fetchFiles();
      } catch (err: any) {
        setError(err.message || "Failed to load project");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId, fetchFiles]);

  const handleSubmitForReview = () => {
    setSubmitModal({ isOpen: true, comment: "" });
  };

  const handleConfirmSubmit = async () => {
    if (!project) return;
    setIsSubmitting(true);

    try {
      const updated = await projectService.submitProject(projectId, submitModal.comment || undefined);
      setProject(updated);
      setSubmitModal({ isOpen: false, comment: "" });
      toast.success("Project Submitted", "Your project has been submitted for review.");
    } catch (err: any) {
      toast.error("Submission Failed", err.message || "Failed to submit project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleteModal({ isOpen: true, type: "project" });
  };

  const handleConfirmDeleteProject = async () => {
    setIsDeletingProject(true);
    try {
      await projectService.deleteProject(projectId);
      toast.success("Project Deleted", "Your project has been deleted.");
      router.push("/projects");
    } catch (err: any) {
      setDeleteModal({ isOpen: false, type: "project" });
      toast.error("Delete Failed", err.message || "Failed to delete project");
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleFileUploadSuccess = (file: any) => {
    setFiles((prev) => [
      {
        id: file.id,
        project_id: projectId,
        file_name: file.file_name,
        file_type: file.file_type,
        s3_key: "",
        file_size: file.file_size,
        created_at: new Date().toISOString(),
        download_url: file.download_url,
        is_image: file.is_image,
      },
      ...prev,
    ]);
    setShowUpload(false);
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    setDeleteModal({ isOpen: true, type: "file", fileId, fileName });
  };

  const handleConfirmDeleteFile = async () => {
    if (!deleteModal.fileId) return;
    
    const fileId = deleteModal.fileId;
    setDeletingFileId(fileId);
    
    try {
      await axiosInstance.delete(`/files/${fileId}`);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      setDeleteModal({ isOpen: false, type: "file" });
      toast.success("File Deleted", "The file has been removed.");
    } catch (err) {
      toast.error("Delete Failed", getErrorMessage(err) || "Failed to delete file");
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleDownloadFile = async (fileId: string) => {
    try {
      const response = await axiosInstance.get(`/files/${fileId}/download`);
      if (response.data.download_url) {
        window.open(response.data.download_url, "_blank");
      }
    } catch (err) {
      toast.error("Download Failed", getErrorMessage(err) || "Failed to download file");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string | null, isImage: boolean) => {
    if (isImage) {
      return (
        <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (fileType?.includes("pdf")) {
      return (
        <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    if (fileType?.includes("zip")) {
      return (
        <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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

  if (error || !project) {
    return (
      <AppLayout>
        <main className="max-w-4xl mx-auto py-6 px-4">
          <div className="bg-red-50 rounded-lg p-6 text-center">
            <p className="text-red-800">{error || "Project not found"}</p>
            <Link href="/projects" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
              Back to Projects
            </Link>
          </div>
        </main>
      </AppLayout>
    );
  }

  const canSubmit = project.can_submit;
  const canEdit = project.can_edit;

  return (
    <AppLayout>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="px-4 sm:px-0 mb-6">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/projects" className="text-gray-500 hover:text-gray-700">
              Projects
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium truncate">{project.title}</span>
          </nav>
        </div>

        {/* Project Header */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                  <StatusBadge status={project.status} size="md" showIcon showTooltip />
                </div>
                {project.category && (
                  <p className="mt-1 text-sm text-gray-500">{project.category}</p>
                )}
              </div>
              <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
                {canEdit && (
                  <Link
                    href={`/projects/${project.id}/edit`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Link>
                )}
                {canSubmit && (
                  <button
                    onClick={handleSubmitForReview}
                    disabled={isSubmitting}
                    className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit for Review"}
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Review Comment (if any) */}
        {project.review_comment && (
          <div className="px-4 sm:px-0 mb-6">
            <div className={`rounded-lg p-4 border ${
              project.status === "approved" 
                ? "bg-green-50 border-green-200" 
                : project.status === "changes_requested"
                ? "bg-red-50 border-red-200"
                : "bg-yellow-50 border-yellow-200"
            }`}>
              <div className="flex">
                {project.status === "approved" ? (
                  <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : project.status === "changes_requested" ? (
                  <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                )}
                <div className="ml-3 flex-1">
                  <h3 className={`text-sm font-medium ${
                    project.status === "approved" 
                      ? "text-green-800" 
                      : project.status === "changes_requested"
                      ? "text-red-800"
                      : "text-yellow-800"
                  }`}>
                    {project.status === "approved" ? "Approval Comment" : 
                     project.status === "changes_requested" ? "Changes Requested" : 
                     "Reviewer Feedback"}
                  </h3>
                  <p className={`mt-1 text-sm ${
                    project.status === "approved" 
                      ? "text-green-700" 
                      : project.status === "changes_requested"
                      ? "text-red-700"
                      : "text-yellow-700"
                  }`}>
                    {project.review_comment}
                  </p>
                  {project.reviewed_at && (
                    <p className={`mt-2 text-xs ${
                      project.status === "approved" 
                        ? "text-green-600" 
                        : project.status === "changes_requested"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}>
                      Reviewed on {formatDate(project.reviewed_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Project Details */}
        <div className="px-4 sm:px-0 space-y-6">
          {/* Description */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
            {project.description ? (
              <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
            ) : (
              <p className="text-gray-400 italic">No description provided</p>
            )}
          </div>

          {/* Technologies */}
          {project.technologies && project.technologies.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Technologies</h2>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {(project.github_url || project.demo_url) && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Links</h2>
              <div className="space-y-3">
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                    GitHub Repository
                  </a>
                )}
                {project.demo_url && (
                  <a
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Live Demo
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Files Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Files</h2>
              {canEdit && (
                <button
                  onClick={() => setShowUpload(!showUpload)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {showUpload ? "Cancel" : "Upload Files"}
                </button>
              )}
            </div>
            
            {/* File Upload Component */}
            {showUpload && canEdit && (
              <div className="mb-6">
                <FileUpload
                  projectId={projectId}
                  onUploadSuccess={handleFileUploadSuccess}
                  onUploadError={(error) => console.error("Upload error:", error)}
                />
              </div>
            )}
            
            {/* File List */}
            {files.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {files.map((file) => (
                  <li key={file.id} className="py-3 flex items-center justify-between group">
                    <div className="flex items-center min-w-0 flex-1">
                      {getFileIcon(file.file_type, file.is_image)}
                      <div className="ml-3 min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.file_size)}
                          {file.created_at && ` • ${new Date(file.created_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDownloadFile(file.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        title="Download"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteFile(file.id, file.file_name)}
                          disabled={deletingFileId === file.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingFileId === file.id ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6">
                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No files uploaded yet</p>
                {canEdit && !showUpload && (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Upload your first file
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(project.created_at)}</dd>
              </div>
              {project.updated_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(project.updated_at)}</dd>
                </div>
              )}
              {project.submitted_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Submitted</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(project.submitted_at)}</dd>
                </div>
              )}
              {project.reviewed_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Reviewed</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(project.reviewed_at)}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Project ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{project.id}</dd>
              </div>
            </dl>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.type === "project" ? "Delete Project" : "Delete File"}
        message={
          deleteModal.type === "project"
            ? "Are you sure you want to delete this project? This action cannot be undone and all associated files will be permanently removed."
            : `Are you sure you want to delete "${deleteModal.fileName}"? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={deleteModal.type === "project" ? handleConfirmDeleteProject : handleConfirmDeleteFile}
        onCancel={() => setDeleteModal({ isOpen: false, type: "file" })}
        isLoading={deleteModal.type === "project" ? isDeletingProject : deletingFileId !== null}
      />

      {/* Submit for Review Modal */}
      {submitModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => !isSubmitting && setSubmitModal({ isOpen: false, comment: "" })}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Submit for Review</h3>
                  <p className="text-sm text-gray-500">Your project will be sent for review</p>
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="submission-comment"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Add a comment (optional)
                </label>
                <textarea
                  id="submission-comment"
                  rows={4}
                  value={submitModal.comment}
                  onChange={(e) => setSubmitModal({ ...submitModal, comment: e.target.value })}
                  placeholder="Any notes or context for the reviewer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSubmitModal({ isOpen: false, comment: "" })}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit for Review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function ProjectDetailPage() {
  return (
    <ProtectedRoute>
      <ProjectDetailContent />
    </ProtectedRoute>
  );
}

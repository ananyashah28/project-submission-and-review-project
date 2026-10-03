"use client";

/**
 * Enterprise Jira & Zoho Projects Workspace Architecture
 * - Seamless full-width layout with AppLayout fluid mode
 * - Modern collapsible Left Navigation Rail (expanded & collapsed icon modes)
 * - Mobile slide-over drawer (never stacks awkwardly above canvas)
 * - Single unified "+ Create" dropdown (like Jira & Zoho Projects)
 * - Clean Workspace Canvas: Board, Milestones, Bugs, Timesheets, Activity, Files, Overview
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ProtectedRoute,
  AppLayout,
  FileUpload,
  ConfirmModal,
  StatusBadge,
  useToast,
  TaskBoard,
  TaskModal,
  TaskDetailModal,
  BugTracker,
  BugModal,
  MilestonesView,
  MilestoneModal,
  TimesheetsView,
  TimeLogModal,
  ActivityFeedView,
} from "@/components";
import { TeamView } from "@/components/TeamView";
import {
  Project,
  Task,
  TaskCreate,
  TaskStatus,
  Bug,
  BugCreate,
  BugStatus,
  Milestone,
  MilestoneCreate,
  MilestoneStatus,
  TimeLog,
  TimeLogCreate,
  ActivityLog,
  ProjectMember,
} from "@/types";
import projectService from "@/services/projectService";
import taskService from "@/services/taskService";
import bugService from "@/services/bugService";
import milestoneService from "@/services/milestoneService";
import timelogService from "@/services/timelogService";
import activityService from "@/services/activityService";
import projectMemberService from "@/services/projectMemberService";
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
  type: "project" | "file" | "task" | "bug" | "milestone" | "timelog";
  targetId?: string;
  targetName?: string;
}

interface SubmitModalState {
  isOpen: boolean;
  comment: string;
}

type TabType = "board" | "milestones" | "bugs" | "team" | "timesheets" | "activities" | "files" | "overview";

function ProjectDetailContent() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const toast = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFileResponse[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [timelogs, setTimelogs] = useState<TimeLog[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [billableHours, setBillableHours] = useState(0);

  const [activeTab, setActiveTab] = useState<TabType>("board");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Sidebar states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Create Dropdown state
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const createDropdownRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalDefaultStatus, setTaskModalDefaultStatus] = useState<TaskStatus>("todo");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);

  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [editingBug, setEditingBug] = useState<Bug | null>(null);
  const [bugDefaultTaskId, setBugDefaultTaskId] = useState<string | null>(null);

  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  const [isTimeLogModalOpen, setIsTimeLogModalOpen] = useState(false);
  const [editingTimeLog, setEditingTimeLog] = useState<TimeLog | null>(null);

  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    type: "file",
  });
  const [submitModal, setSubmitModal] = useState<SubmitModalState>({
    isOpen: false,
    comment: "",
  });

  // Close create dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (createDropdownRef.current && !createDropdownRef.current.contains(e.target as Node)) {
        setIsCreateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchFiles = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/projects/${projectId}/files`);
      setFiles(response.data.files || []);
    } catch (err) {
      console.error("Failed to fetch files:", err);
    }
  }, [projectId]);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await taskService.getTasks(projectId);
      setTasks(res.tasks || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  }, [projectId]);

  const fetchBugs = useCallback(async () => {
    try {
      const res = await bugService.getBugs(projectId);
      setBugs(res.bugs || []);
    } catch (err) {
      console.error("Failed to fetch bugs:", err);
    }
  }, [projectId]);

  const fetchMilestones = useCallback(async () => {
    try {
      const res = await milestoneService.getMilestones(projectId);
      setMilestones(res.milestones || []);
    } catch (err) {
      console.error("Failed to fetch milestones:", err);
    }
  }, [projectId]);

  const fetchTimelogs = useCallback(async () => {
    try {
      const res = await timelogService.getTimelogs(projectId);
      setTimelogs(res.logs || []);
      setTotalHours(res.total_hours || 0);
      setBillableHours(res.billable_hours || 0);
    } catch (err) {
      console.error("Failed to fetch timelogs:", err);
    }
  }, [projectId]);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await activityService.getActivities(projectId, 40);
      setActivities(res.activities || []);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    }
  }, [projectId]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await projectMemberService.getProjectMembers(projectId);
      setMembers(res.members || []);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  }, [projectId]);

  useEffect(() => {
    let mounted = true;

    async function loadAllProjectData() {
      setIsLoading(true);
      setError(null);
      try {
        const proj = await projectService.getProject(projectId);
        if (mounted) {
          setProject(proj);
        }
        await Promise.all([
          fetchFiles(),
          fetchTasks(),
          fetchBugs(),
          fetchMilestones(),
          fetchTimelogs(),
          fetchActivities(),
          fetchMembers(),
        ]);
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load project details");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    if (projectId) {
      loadAllProjectData();
    }

    return () => {
      mounted = false;
    };
  }, [projectId, fetchFiles, fetchTasks, fetchBugs, fetchMilestones, fetchTimelogs, fetchActivities, fetchMembers]);

  // Project Submit / Review
  const handleSubmitForReview = () => {
    setSubmitModal({ isOpen: true, comment: "" });
  };

  const handleConfirmSubmit = async () => {
    if (!project) return;
    setIsSubmitting(true);
    try {
      const updated = await projectService.submitProject(project.id, submitModal.comment || undefined);
      setProject(updated);
      setSubmitModal({ isOpen: false, comment: "" });
      toast.success("Submitted for Review", "Your project has been submitted for evaluation.");
      await fetchActivities();
    } catch (err: any) {
      toast.error("Submission Failed", err.message || "Failed to submit project");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete Dispatcher
  const handleConfirmDelete = async () => {
    if (deleteModal.type === "file" && deleteModal.targetId) {
      setDeletingFileId(deleteModal.targetId);
      try {
        await axiosInstance.delete(`/files/${deleteModal.targetId}`);
        toast.success("File Deleted", "File has been removed.");
        setDeleteModal({ isOpen: false, type: "file" });
        await Promise.all([fetchFiles(), fetchActivities()]);
      } catch (err: any) {
        toast.error("Delete Failed", getErrorMessage(err) || "Failed to delete file");
      } finally {
        setDeletingFileId(null);
      }
    } else if (deleteModal.type === "project") {
      setIsDeletingProject(true);
      try {
        await projectService.deleteProject(projectId);
        toast.success("Project Deleted", "Project has been permanently removed.");
        router.push("/projects");
      } catch (err: any) {
        toast.error("Delete Failed", err.message || "Failed to delete project");
        setIsDeletingProject(false);
      }
    } else if (deleteModal.type === "task" && deleteModal.targetId) {
      try {
        await taskService.deleteTask(deleteModal.targetId);
        setTasks((prev) => prev.filter((t) => t.id !== deleteModal.targetId));
        setDeleteModal({ isOpen: false, type: "task" });
        toast.success("Task Deleted", "Task removed from board.");
        await Promise.all([fetchMilestones(), fetchActivities()]);
      } catch (err: any) {
        toast.error("Delete Failed", err.message || "Failed to delete task");
      }
    } else if (deleteModal.type === "bug" && deleteModal.targetId) {
      try {
        await bugService.deleteBug(deleteModal.targetId);
        setBugs((prev) => prev.filter((b) => b.id !== deleteModal.targetId));
        setDeleteModal({ isOpen: false, type: "bug" });
        toast.success("Bug Deleted", "Bug report removed.");
        await fetchActivities();
      } catch (err: any) {
        toast.error("Delete Failed", err.message || "Failed to delete bug");
      }
    } else if (deleteModal.type === "milestone" && deleteModal.targetId) {
      try {
        await milestoneService.deleteMilestone(deleteModal.targetId);
        setMilestones((prev) => prev.filter((m) => m.id !== deleteModal.targetId));
        setDeleteModal({ isOpen: false, type: "milestone" });
        toast.success("Milestone Deleted", "Milestone removed from project.");
        await Promise.all([fetchTasks(), fetchActivities()]);
      } catch (err: any) {
        toast.error("Delete Failed", err.message || "Failed to delete milestone");
      }
    } else if (deleteModal.type === "timelog" && deleteModal.targetId) {
      try {
        await timelogService.deleteTimelog(deleteModal.targetId);
        setDeleteModal({ isOpen: false, type: "timelog" });
        toast.success("Time Log Deleted", "Hours removed from timesheet.");
        await Promise.all([fetchTimelogs(), fetchActivities()]);
      } catch (err: any) {
        toast.error("Delete Failed", err.message || "Failed to delete time log");
      }
    }
  };

  // Files
  const handleFileUploadSuccess = () => {
    fetchFiles();
    setShowUpload(false);
    toast.success("Upload Complete", "File uploaded successfully.");
    fetchActivities();
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

  // Task Actions
  const handleCreateOrUpdateTask = async (taskData: TaskCreate) => {
    if (editingTask) {
      const updated = await taskService.updateTask(editingTask.id, taskData);
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updated : t)));
      toast.success("Task Updated", "Task details have been saved.");
    } else {
      const created = await taskService.createTask(projectId, taskData);
      setTasks((prev) => [created, ...prev]);
      toast.success("Task Created", "New task added to project.");
    }
    setEditingTask(null);
    await Promise.all([fetchMilestones(), fetchActivities()]);
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const updated = await taskService.updateTask(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      toast.success("Status Updated", `Task moved to ${newStatus.replace("_", " ")}`);
      await Promise.all([fetchMilestones(), fetchActivities()]);
    } catch (err: any) {
      toast.error("Update Failed", err.message || "Failed to change task status");
    }
  };

  // Bug Actions
  const handleCreateOrUpdateBug = async (bugData: BugCreate) => {
    if (editingBug) {
      const updated = await bugService.updateBug(editingBug.id, bugData);
      setBugs((prev) => prev.map((b) => (b.id === editingBug.id ? updated : b)));
      toast.success("Bug Updated", "Issue report updated successfully.");
    } else {
      const created = await bugService.createBug(projectId, bugData);
      setBugs((prev) => [created, ...prev]);
      toast.success("Bug Logged", "New bug reported for the project.");
    }
    setEditingBug(null);
    setBugDefaultTaskId(null);
    await Promise.all([fetchTasks(), fetchActivities()]);
  };

  const handleBugStatusChange = async (bugId: string, newStatus: BugStatus) => {
    try {
      const updated = await bugService.updateBug(bugId, { status: newStatus });
      setBugs((prev) => prev.map((b) => (b.id === bugId ? updated : b)));
      toast.success("Bug Updated", `Bug marked as ${newStatus.toUpperCase()}`);
      await fetchActivities();
    } catch (err: any) {
      toast.error("Update Failed", err.message || "Failed to change bug status");
    }
  };

  const handleOpenBugModalForTask = (taskId: string) => {
    setDetailTaskId(null);
    setEditingBug(null);
    setBugDefaultTaskId(taskId);
    setIsBugModalOpen(true);
  };

  // Milestone Actions
  const handleCreateOrUpdateMilestone = async (mData: MilestoneCreate) => {
    if (editingMilestone) {
      const updated = await milestoneService.updateMilestone(editingMilestone.id, mData);
      setMilestones((prev) => prev.map((m) => (m.id === editingMilestone.id ? updated : m)));
      toast.success("Milestone Saved", "Milestone details updated.");
    } else {
      const created = await milestoneService.createMilestone(projectId, mData);
      setMilestones((prev) => [created, ...prev]);
      toast.success("Milestone Created", "New sprint milestone initialized.");
    }
    setEditingMilestone(null);
    await fetchActivities();
  };

  const handleMilestoneStatusChange = async (mId: string, newStatus: MilestoneStatus) => {
    try {
      const updated = await milestoneService.updateMilestone(mId, { status: newStatus });
      setMilestones((prev) => prev.map((m) => (m.id === mId ? updated : m)));
      toast.success("Milestone Updated", `Status changed to ${newStatus}`);
      await fetchActivities();
    } catch (err: any) {
      toast.error("Update Failed", err.message || "Failed to update milestone status");
    }
  };

  // TimeLog Actions
  const handleCreateOrUpdateTimeLog = async (logData: TimeLogCreate) => {
    if (editingTimeLog) {
      await timelogService.updateTimelog(editingTimeLog.id, logData);
      toast.success("Hours Updated", "Timesheet entry updated.");
    } else {
      await timelogService.createTimelog(projectId, logData);
      toast.success("Time Logged", "Work hours recorded in project timesheet.");
    }
    setEditingTimeLog(null);
    await Promise.all([fetchTimelogs(), fetchActivities()]);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
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
      <AppLayout showFooter={false} fluid hideNavLinks>
        <div className="flex items-center justify-center min-h-[75vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading project workspace...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !project) {
    return (
      <AppLayout showFooter={false} fluid hideNavLinks>
        <div className="max-w-xl mx-auto py-16 px-4 text-center">
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
            <h3 className="font-bold text-red-800 text-base mb-1">Project Not Found</h3>
            <p className="text-xs text-red-600 mb-4">{error || "Could not load the requested project."}</p>
            <Link href="/projects" className="text-xs font-semibold px-4 py-2 bg-slate-900 text-white rounded-lg">
              Back to Projects
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const canSubmit = project.can_submit;
  const canEdit = project.can_edit;
  const projectInitials = project.title.slice(0, 2).toUpperCase();
  const openBugsCount = bugs.filter((b) => b.status === "open" || b.status === "in_progress").length;

  interface NavItem {
    id: TabType;
    label: string;
    count?: number;
    countText?: string;
    badgeColor?: string;
    icon: React.ReactNode;
  }

  interface NavGroup {
    label: string;
    items: NavItem[];
  }

  // Sidebar navigation items
  const navGroups: NavGroup[] = [
    {
      label: "PLANNING",
      items: [
        {
          id: "board" as TabType,
          label: "Kanban Board",
          count: tasks.length,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h4v14H4zm6 0h4v14h-4zm6 0h4v14h-4z" />
            </svg>
          ),
        },
        {
          id: "milestones" as TabType,
          label: "Milestones / Sprints",
          count: milestones.length,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "TRACKING",
      items: [
        {
          id: "bugs" as TabType,
          label: "Bug Tracker",
          count: bugs.length,
          badgeColor: openBugsCount > 0 ? "bg-red-500 text-white" : undefined,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-4m0 0H4m14-4a5 5 0 00-10 0v4a5 5 0 0010 0v-4zm-8-5l-2-2m10 2l2-2" />
            </svg>
          ),
        },
        {
          id: "timesheets" as TabType,
          label: "Timesheets",
          countText: `${totalHours.toFixed(1)}h`,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          id: "activities" as TabType,
          label: "Activity Stream",
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "PROJECT",
      items: [
        {
          id: "team" as TabType,
          label: "Team / People",
          count: members.length,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
        {
          id: "files" as TabType,
          label: "Files & Documents",
          count: files.length,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          id: "overview" as TabType,
          label: "Overview & Details",
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <AppLayout showFooter={false} fluid hideNavLinks>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#f8fafc]">
        {/* ========================================================================= */}
        {/* JIRA / ZOHO LEFT NAVIGATION RAIL (Desktop)                                 */}
        {/* ========================================================================= */}
        <aside
          className={`hidden lg:flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-200 select-none z-20 ${
            isSidebarCollapsed ? "w-16" : "w-72"
          }`}
        >
          {/* Project Header Block */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md flex-shrink-0">
                {projectInitials}
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-sm text-white leading-tight break-words" title={project.title}>
                    {project.title}
                  </h2>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {project.category || "Software Project"}
                  </p>
                </div>
              )}
            </div>

            {/* Collapse / Expand Toggle Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isSidebarCollapsed ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-2.5 space-y-4 overflow-y-auto">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {!isSidebarCollapsed && (
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-1.5 mt-1">
                    {group.label}
                  </span>
                )}
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center ${
                        isSidebarCollapsed ? "justify-center px-0 py-2.5" : "justify-between px-3 py-2.5"
                      } rounded-lg text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                      title={isSidebarCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isActive ? "text-white" : "text-slate-400"}>{item.icon}</span>
                        {!isSidebarCollapsed && <span>{item.label}</span>}
                      </div>

                      {!isSidebarCollapsed && (item.count !== undefined || item.countText) && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            item.badgeColor ||
                            (isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-300")
                          }`}
                        >
                          {item.countText || item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom Sidebar Action: Switch Project */}
          <div className="p-2.5 border-t border-slate-800 text-xs">
            <Link
              href="/projects"
              className={`flex items-center ${
                isSidebarCollapsed ? "justify-center p-2" : "gap-2.5 px-3 py-2.5"
              } text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors`}
              title="Switch Project"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {!isSidebarCollapsed && <span>All Projects</span>}
            </Link>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MOBILE SLIDE-OVER DRAWER (For screen < 1024px)                             */}
        {/* ========================================================================= */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            />

            {/* Slide-over Drawer */}
            <div className="relative w-64 bg-slate-900 text-slate-300 h-full flex flex-col shadow-2xl z-10">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {projectInitials}
                  </div>
                  <h2 className="font-bold text-xs text-white truncate max-w-[130px]">{project.title}</h2>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-4 overflow-y-auto text-xs">
                {navGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                      {group.label}
                    </span>
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg font-semibold transition-all ${
                          activeTab === item.id
                            ? "bg-blue-600 text-white"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {(item.count !== undefined || item.countText) && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-800 text-slate-300">
                            {item.countText || item.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RIGHT WORKSPACE (Main Canvas)                                             */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Workspace Sub-Header Bar (Jira & Zoho Style) */}
          <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-2xs z-10 flex-shrink-0">
            {/* Left: Mobile menu button + Breadcrumb + Status */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Hamburger */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                title="Open navigation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <nav className="flex items-center gap-2 text-sm text-slate-500 font-medium truncate">
                <Link href="/projects" className="hover:text-blue-600 transition-colors truncate">
                  Projects
                </Link>
                <span className="text-slate-300">/</span>
                <span className="font-bold text-slate-900 truncate">{project.title}</span>
              </nav>

              <StatusBadge status={project.status} size="sm" showIcon />
            </div>

            {/* Right: Unified "+ Create" Action Dropdown & Project Controls */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              {/* Unified Jira/Zoho "+ Create" Dropdown */}
              <div className="relative" ref={createDropdownRef}>
                <button
                  onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span className="text-sm leading-none font-bold">+</span>
                  <span>Create</span>
                  <svg className="w-3.5 h-3.5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isCreateDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-fadeIn">
                    <button
                      onClick={() => {
                        setIsCreateDropdownOpen(false);
                        setEditingTask(null);
                        setTaskModalDefaultStatus("todo");
                        setIsTaskModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-semibold transition-colors"
                    >
                      <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span>New Task</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsCreateDropdownOpen(false);
                        setEditingBug(null);
                        setBugDefaultTaskId(null);
                        setIsBugModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-semibold transition-colors"
                    >
                      <span className="w-6 h-6 rounded-md bg-red-100 text-red-600 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-4m0 0H4m14-4a5 5 0 00-10 0v4a5 5 0 0010 0v-4zm-8-5l-2-2m10 2l2-2" />
                        </svg>
                      </span>
                      <span>Report Bug</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsCreateDropdownOpen(false);
                        setEditingMilestone(null);
                        setIsMilestoneModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-semibold transition-colors"
                    >
                      <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                      </span>
                      <span>New Milestone</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsCreateDropdownOpen(false);
                        setEditingTimeLog(null);
                        setIsTimeLogModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-semibold transition-colors"
                    >
                      <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <span>Log Time</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsCreateDropdownOpen(false);
                        setActiveTab("team");
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-semibold transition-colors"
                    >
                      <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </span>
                      <span>Add Team Member</span>
                    </button>

                    <div className="h-px bg-slate-100 my-1" />

                    <button
                      onClick={() => {
                        setIsCreateDropdownOpen(false);
                        setActiveTab("files");
                        setShowUpload(true);
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-semibold transition-colors"
                    >
                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <span>Upload Files</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Submit for Review Action */}
              {canSubmit && (
                <button
                  onClick={handleSubmitForReview}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>{isSubmitting ? "Submitting..." : "Submit Review"}</span>
                </button>
              )}

              {/* Settings link */}
              {canEdit && (
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Project Settings"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
              )}
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {/* 1. KANBAN BOARD */}
            {activeTab === "board" && (
              <TaskBoard
                tasks={tasks}
                milestones={milestones}
                members={members}
                onOpenCreateModal={(defaultStatus) => {
                  setEditingTask(null);
                  setTaskModalDefaultStatus(defaultStatus || "todo");
                  setIsTaskModalOpen(true);
                }}
                onOpenTaskDetail={(tId) => setDetailTaskId(tId)}
                onEditTask={(t) => {
                  setEditingTask(t);
                  setTaskModalDefaultStatus(t.status);
                  setIsTaskModalOpen(true);
                }}
                onDeleteTask={(tId) => {
                  setDeleteModal({
                    isOpen: true,
                    type: "task",
                    targetId: tId,
                  });
                }}
                onStatusChange={handleTaskStatusChange}
              />
            )}

            {/* 2. MILESTONES / SPRINTS */}
            {activeTab === "milestones" && (
              <MilestonesView
                milestones={milestones}
                tasks={tasks}
                onOpenCreateMilestone={() => {
                  setEditingMilestone(null);
                  setIsMilestoneModalOpen(true);
                }}
                onEditMilestone={(m) => {
                  setEditingMilestone(m);
                  setIsMilestoneModalOpen(true);
                }}
                onDeleteMilestone={(mId) => {
                  setDeleteModal({
                    isOpen: true,
                    type: "milestone",
                    targetId: mId,
                  });
                }}
                onStatusChange={handleMilestoneStatusChange}
              />
            )}

            {/* 3. BUG TRACKER */}
            {activeTab === "bugs" && (
              <BugTracker
                bugs={bugs}
                tasks={tasks}
                members={members}
                onOpenCreateBugModal={() => {
                  setEditingBug(null);
                  setBugDefaultTaskId(null);
                  setIsBugModalOpen(true);
                }}
                onEditBug={(b) => {
                  setEditingBug(b);
                  setIsBugModalOpen(true);
                }}
                onDeleteBug={(bId) => {
                  setDeleteModal({
                    isOpen: true,
                    type: "bug",
                    targetId: bId,
                  });
                }}
                onStatusChange={handleBugStatusChange}
              />
            )}

            {/* 4. TEAM & PEOPLE */}
            {activeTab === "team" && (
              <TeamView
                projectId={projectId}
                isOwner={canEdit}
              />
            )}

            {/* 4. TIMESHEETS */}
            {activeTab === "timesheets" && (
              <TimesheetsView
                timelogs={timelogs}
                totalHours={totalHours}
                billableHours={billableHours}
                onOpenLogModal={() => {
                  setEditingTimeLog(null);
                  setIsTimeLogModalOpen(true);
                }}
                onEditLog={(l) => {
                  setEditingTimeLog(l);
                  setIsTimeLogModalOpen(true);
                }}
                onDeleteLog={(logId) => {
                  setDeleteModal({
                    isOpen: true,
                    type: "timelog",
                    targetId: logId,
                  });
                }}
              />
            )}

            {/* 5. ACTIVITY STREAM */}
            {activeTab === "activities" && (
              <ActivityFeedView activities={activities} />
            )}

            {/* 6. FILES & ATTACHMENTS */}
            {activeTab === "files" && (
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Project Files & Attachments</h3>
                    <p className="text-xs text-slate-500">Source code, reports, architecture diagrams stored in S3</p>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => setShowUpload(!showUpload)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                    >
                      {showUpload ? "Cancel" : "+ Upload Files"}
                    </button>
                  )}
                </div>

                {showUpload && canEdit && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <FileUpload
                      projectId={projectId}
                      onUploadSuccess={handleFileUploadSuccess}
                      onUploadError={(err) => console.error("Upload error:", err)}
                    />
                  </div>
                )}

                {files.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {files.map((file) => (
                      <div key={file.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-md transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">{file.file_name}</p>
                            <p className="text-[11px] text-slate-400">
                              {formatFileSize(file.file_size)} • {file.created_at && formatDate(file.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadFile(file.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors"
                            title="Download"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => {
                                setDeleteModal({
                                  isOpen: true,
                                  type: "file",
                                  targetId: file.id,
                                  targetName: file.file_name,
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs text-slate-400 italic">
                    No files uploaded yet.
                  </div>
                )}
              </div>
            )}

            {/* 7. PROJECT OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6 max-w-5xl">
                {/* Executive KPI Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Task Completion */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      <span>Tasks Progress</span>
                      <span className="text-blue-600 font-black">
                        {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "completed").length / tasks.length) * 100) : 0}%
                      </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-2">
                      {tasks.filter(t => t.status === "completed").length} / {tasks.length}
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${tasks.length > 0 ? (tasks.filter(t => t.status === "completed").length / tasks.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Bugs Status */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      <span>Open Bugs</span>
                      <span className={`w-2 h-2 rounded-full ${openBugsCount > 0 ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-1">
                      {openBugsCount}
                    </div>
                    <p className="text-xs text-slate-500">
                      {bugs.length - openBugsCount} resolved of {bugs.length} total
                    </p>
                  </div>

                  {/* Total Work Hours */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      <span>Logged Hours</span>
                      <span className="text-emerald-600 font-semibold text-xs">{billableHours.toFixed(1)}h billable</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-1">
                      {totalHours.toFixed(1)}h
                    </div>
                    <p className="text-xs text-slate-500">
                      Across {timelogs.length} logged timesheet entries
                    </p>
                  </div>

                  {/* Team Members */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      <span>Collaborators</span>
                      <span className="text-indigo-600 font-bold text-xs">{milestones.length} sprints</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-1">
                      {members.length}
                    </div>
                    <p className="text-xs text-slate-500">
                      Active team contributors
                    </p>
                  </div>
                </div>

                {/* Description & Details */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Project Description</h3>
                    <p className="text-xs text-slate-500 mb-3">Core objectives, architectural goals, and project scope.</p>
                    {project.description ? (
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                        {project.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No description provided for this project.</p>
                    )}
                  </div>

                  {/* Tech stack */}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Technology Stack</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((t, i) => (
                          <span key={i} className="text-xs font-bold px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* URLs & External Links */}
                  {(project.github_url || project.demo_url) && (
                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Project Resources</h4>
                      <div className="flex flex-wrap gap-3">
                        {project.github_url && (
                          <a
                            href={project.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                            <span>Source Code</span>
                          </a>
                        )}
                        {project.demo_url && (
                          <a
                            href={project.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span>Live Application</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Review feedback if present */}
                  {project.review_comment && (
                    <div className="pt-4 border-t border-slate-100">
                      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-xs text-amber-900">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-amber-800 mb-1">Review Feedback</h4>
                        <p>{project.review_comment}</p>
                      </div>
                    </div>
                  )}

                  {/* Metadata footer */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <div>Project ID: <span className="font-mono text-slate-600">{project.id}</span></div>
                    <div>Created {formatDate(project.created_at)}</div>
                    {project.submitted_at && <div>Submitted for Review {formatDate(project.submitted_at)}</div>}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateOrUpdateTask}
        milestones={milestones}
        members={members}
        initialData={editingTask}
        defaultStatus={taskModalDefaultStatus}
      />

      {/* Task Details Modal (Jira 2-Column issue drawer) */}
      <TaskDetailModal
        taskId={detailTaskId}
        isOpen={detailTaskId !== null}
        onClose={() => setDetailTaskId(null)}
        members={members}
        onTaskUpdated={() => {
          fetchTasks();
          fetchBugs();
          fetchMilestones();
          fetchActivities();
        }}
        onOpenBugModalForTask={handleOpenBugModalForTask}
      />

      {/* Bug Creation / Edit Modal */}
      <BugModal
        isOpen={isBugModalOpen}
        onClose={() => {
          setIsBugModalOpen(false);
          setEditingBug(null);
          setBugDefaultTaskId(null);
        }}
        onSubmit={handleCreateOrUpdateBug}
        tasks={tasks}
        members={members}
        initialData={editingBug}
        defaultTaskId={bugDefaultTaskId}
      />

      {/* Milestone Creation / Edit Modal */}
      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => {
          setIsMilestoneModalOpen(false);
          setEditingMilestone(null);
        }}
        onSubmit={handleCreateOrUpdateMilestone}
        initialData={editingMilestone}
      />

      {/* TimeLog Creation / Edit Modal */}
      <TimeLogModal
        isOpen={isTimeLogModalOpen}
        onClose={() => {
          setIsTimeLogModalOpen(false);
          setEditingTimeLog(null);
        }}
        onSubmit={handleCreateOrUpdateTimeLog}
        tasks={tasks}
        bugs={bugs}
        initialData={editingTimeLog}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={
          deleteModal.type === "project"
            ? "Delete Project"
            : deleteModal.type === "file"
            ? "Delete File"
            : deleteModal.type === "task"
            ? "Delete Task"
            : deleteModal.type === "bug"
            ? "Delete Bug"
            : deleteModal.type === "milestone"
            ? "Delete Milestone"
            : "Delete Time Entry"
        }
        message={
          deleteModal.type === "project"
            ? "Are you sure you want to delete this project? This action cannot be undone."
            : deleteModal.type === "file"
            ? `Delete file "${deleteModal.targetName}"?`
            : deleteModal.type === "task"
            ? "Are you sure you want to delete this task? All subtasks will be removed."
            : deleteModal.type === "bug"
            ? "Are you sure you want to delete this bug report?"
            : deleteModal.type === "milestone"
            ? "Are you sure you want to delete this milestone?"
            : "Are you sure you want to delete this timesheet entry?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, type: "file" })}
        isLoading={isDeletingProject || deletingFileId !== null}
      />

      {/* Submit for Review Modal */}
      {submitModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Submit Project for Review</h3>
            <p className="text-xs text-slate-500 mb-4">
              Your reviewer will be notified to review code, tasks, and deliverables.
            </p>
            <textarea
              rows={3}
              value={submitModal.comment}
              onChange={(e) => setSubmitModal({ ...submitModal, comment: e.target.value })}
              placeholder="Add submission remarks or instructions..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSubmitModal({ isOpen: false, comment: "" })}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Confirm & Submit"}
              </button>
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

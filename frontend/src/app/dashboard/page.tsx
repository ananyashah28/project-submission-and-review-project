"use client";

/**
 * Dashboard Page - Modern UI with enhanced visuals
 */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProtectedRoute, AppLayout } from "@/components";
import { useAuth } from "@/context";
import { Project, ProjectStatus } from "@/types";
import projectService, { ProjectStats } from "@/services/projectService";

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  draft: {
    label: "Draft",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  },
  submitted: {
    label: "Submitted",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
  },
  under_review: {
    label: "Under Review",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  },
  approved: {
    label: "Approved",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  changes_requested: {
    label: "Changes Requested",
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  },
};

function StatCard({
  title,
  value,
  icon,
  color,
  bgColor,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <svg
            className={`w-6 h-6 ${color}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={icon}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const status = STATUS_CONFIG[project.status];
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {project.title}
          </h3>
          {project.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        <span
          className={`ml-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          {project.category && (
            <span className="inline-flex items-center text-gray-500">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              {project.category}
            </span>
          )}
          {project.technologies && project.technologies.length > 0 && (
            <span className="inline-flex items-center text-gray-500">
              <svg
                className="w-4 h-4 mr-1"
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
              {project.technologies.length} tech
            </span>
          )}
        </div>
        <span className="text-gray-400">{formatDate(project.created_at)}</span>
      </div>
    </Link>
  );
}

type SortOption = "newest" | "oldest" | "title_asc" | "title_desc";

function DashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering and sorting state
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, projectsData] = await Promise.all([
          projectService.getProjectStats(),
          projectService.getProjects({}),
        ]);
        setStats(statsData);
        setAllProjects(projectsData);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and sort projects
  const filteredProjects = allProjects
    .filter((project) => {
      // Status filter
      if (statusFilter !== "all" && project.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          project.title.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.category?.toLowerCase().includes(query) ||
          project.technologies?.some((t) => t.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "title_asc":
          return a.title.localeCompare(b.title);
        case "title_desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppLayout>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {getGreeting()}, {user?.name?.split(" ")[0]}!
              </h1>
              <p className="mt-1 text-gray-500">
                Here&apos;s an overview of your project submissions
              </p>
            </div>
            <Link
              href="/projects/new"
              className="mt-4 sm:mt-0 inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <svg
                className="w-5 h-5 mr-2"
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

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading your dashboard...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start space-x-3">
            <svg
              className="w-6 h-6 text-red-500 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Error loading dashboard
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Projects"
                value={stats?.total || 0}
                icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                color="text-blue-600"
                bgColor="bg-blue-100"
              />
              <StatCard
                title="Under Review"
                value={(stats?.submitted || 0) + (stats?.under_review || 0)}
                icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                color="text-amber-600"
                bgColor="bg-amber-100"
              />
              <StatCard
                title="Approved"
                value={stats?.approved || 0}
                icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                color="text-green-600"
                bgColor="bg-green-100"
              />
              <StatCard
                title="Needs Changes"
                value={stats?.changes_requested || 0}
                icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                color="text-red-600"
                bgColor="bg-red-100"
              />
            </div>

            {/* Recent Projects */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Your Projects
                  </h2>
                  
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative">
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-48"
                      />
                    </div>
                    
                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "all")}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="changes_requested">Changes Requested</option>
                    </select>
                    
                    {/* Sort */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="title_asc">Title A-Z</option>
                      <option value="title_desc">Title Z-A</option>
                    </select>
                  </div>
                </div>
                
                {/* Active filters indicator */}
                {(statusFilter !== "all" || searchQuery) && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Showing {filteredProjects.length} of {allProjects.length} projects</span>
                    <button
                      onClick={() => {
                        setStatusFilter("all");
                        setSearchQuery("");
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>

              {filteredProjects.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
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
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {allProjects.length === 0 ? "No projects yet" : "No matching projects"}
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    {allProjects.length === 0 
                      ? "Start by creating your first project submission to get feedback from reviewers."
                      : "Try adjusting your filters or search query."
                    }
                  </p>
                  {allProjects.length === 0 && (
                    <Link
                      href="/projects/new"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
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
                    Create Your First Project
                  </Link>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredProjects.map((project) => (
                    <div key={project.id} className="p-4">
                      <ProjectCard project={project} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {allProjects.length > 0 && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href="/projects/new"
                  className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <svg
                      className="w-6 h-6 text-blue-600"
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
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">New Project</p>
                    <p className="text-sm text-gray-500">
                      Submit a new project
                    </p>
                  </div>
                </Link>

                <Link
                  href="/projects"
                  className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">All Projects</p>
                    <p className="text-sm text-gray-500">
                      View all submissions
                    </p>
                  </div>
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Profile</p>
                    <p className="text-sm text-gray-500">
                      Manage your account
                    </p>
                  </div>
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </AppLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

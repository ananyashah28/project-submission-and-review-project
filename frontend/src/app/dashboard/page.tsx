"use client";

/**
 * Enterprise Jira & Zoho Projects Executive Dashboard
 * - Comfortable typography and standard scale (no tiny/cramped fonts)
 * - KPI Metrics Ribbon with live counts
 * - Project Workspace Cards with direct jump to Board, Bugs, Milestones, and Team
 * - Member count and role indicators
 */
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ProtectedRoute, AppLayout, StatusBadge } from "@/components";
import { useAuth } from "@/context";
import { Project, ProjectStatus } from "@/types";
import projectService, { ProjectStats } from "@/services/projectService";

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

  const filteredProjects = useMemo(() => {
    return allProjects
      .filter((project) => {
        const matchesStatus =
          statusFilter === "all" || project.status === statusFilter;
        const matchesSearch =
          searchQuery === "" ||
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (project.description &&
            project.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (project.category &&
            project.category.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSearch;
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
  }, [allProjects, statusFilter, searchQuery, sortBy]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const userName = user?.name ? user.name.split(" ")[0] : "Developer";

  return (
    <AppLayout showFooter={false}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8">
        {/* ========================================================================= */}
        {/* Jira / Zoho Workspace Welcome Header                                      */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md flex-shrink-0">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Welcome back, {userName}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1">
                Manage your projects, Kanban task boards, bug tracking, and timesheets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/projects"
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              All Projects ({allProjects.length})
            </Link>
            <Link
              href="/projects/new"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Project</span>
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KPI Metrics Ribbon (Zoho Projects Style)                                  */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div
            onClick={() => setStatusFilter("all")}
            className={`p-5 sm:p-6 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10"
                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs text-slate-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider block ${
                statusFilter === "all" ? "text-slate-300" : "text-slate-500"
              }`}>
                Total Projects
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                statusFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">
              {stats?.total || allProjects.length}
            </div>
          </div>

          <div
            onClick={() => setStatusFilter("draft")}
            className={`p-5 sm:p-6 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === "draft"
                ? "bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-800/10"
                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs text-slate-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider block ${
                statusFilter === "draft" ? "text-slate-300" : "text-slate-500"
              }`}>
                In Preparation
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                statusFilter === "draft" ? "bg-slate-700 text-white" : "bg-blue-50 text-blue-600"
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">
              {stats ? stats.draft : allProjects.filter((p) => p.status === "draft").length}
            </div>
          </div>

          <div
            onClick={() => setStatusFilter("under_review")}
            className={`p-5 sm:p-6 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === "under_review" || statusFilter === "submitted"
                ? "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-600/10"
                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs text-slate-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider block ${
                statusFilter === "under_review" ? "text-amber-100" : "text-amber-600"
              }`}>
                Under Review
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                statusFilter === "under_review" ? "bg-amber-700 text-white" : "bg-amber-50 text-amber-600"
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">
              {stats ? stats.under_review + stats.submitted : allProjects.filter((p) => p.status === "under_review" || p.status === "submitted").length}
            </div>
          </div>

          <div
            onClick={() => setStatusFilter("approved")}
            className={`p-5 sm:p-6 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === "approved"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-600/10"
                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs text-slate-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider block ${
                statusFilter === "approved" ? "text-emerald-100" : "text-emerald-600"
              }`}>
                Approved
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                statusFilter === "approved" ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-600"
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">
              {stats ? stats.approved : allProjects.filter((p) => p.status === "approved").length}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Project Workspaces Section (Jira & Zoho Style)                           */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Your Project Workspaces</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Click any project to open its Kanban board, subtasks, bug tracker, team, and timesheets.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                className="text-sm font-semibold py-2 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer hover:bg-white transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title_asc">Title A-Z</option>
                <option value="title_desc">Title Z-A</option>
              </select>
            </div>
          </div>

          {/* Project Cards List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <div className="p-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl text-center">
              {error}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">No matching projects found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "Try resetting your search filter to see more projects."
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
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredProjects.map((project) => {
                const initials = project.title.slice(0, 2).toUpperCase();
                const shortKey = `PRJ-${project.id.slice(0, 4).toUpperCase()}`;
                const membersCount = project.members_count ?? 1;
                const isOwner = project.is_owner ?? true;

                return (
                  <div
                    key={project.id}
                    className="p-6 rounded-2xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-white transition-all shadow-xs hover:shadow-md flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-xs flex-shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/projects/${project.id}`}
                              className="font-bold text-lg text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                              title={project.title}
                            >
                              {project.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="font-mono text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                                {shortKey}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs text-slate-500 truncate max-w-[160px]">
                                {project.category || "Software Project"}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                {membersCount} {membersCount === 1 ? "member" : "members"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                            isOwner 
                              ? "bg-blue-50 text-blue-700 border-blue-200" 
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                            {isOwner ? "Owner" : "Member"}
                          </span>
                          <StatusBadge status={project.status} size="sm" />
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
                        {project.description || "No project description provided."}
                      </p>

                      {/* Tech Stack */}
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.technologies.slice(0, 4).map((tech, idx) => (
                            <span
                              key={idx}
                              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 shadow-2xs"
                            >
                              {tech}
                            </span>
                          ))}
                          {project.technologies.length > 4 && (
                            <span className="text-xs text-slate-400 self-center">
                              +{project.technologies.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions: Jump Links & Primary Workspace CTA */}
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 text-sm">
                      <span className="text-xs text-slate-400">
                        Updated {formatDate(project.updated_at || project.created_at)}
                      </span>

                      <div className="flex items-center gap-2">
                        {isOwner && (
                          <Link
                            href={`/projects/${project.id}/edit`}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                          >
                            Edit
                          </Link>
                        )}
                        <Link
                          href={`/projects/${project.id}`}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                        >
                          <span>Open Workspace</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
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

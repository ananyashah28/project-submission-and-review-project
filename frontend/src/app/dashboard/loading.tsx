/**
 * Dashboard Loading Component
 * Displays skeleton UI while dashboard data is loading
 */
import React from "react";

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 w-16 bg-gray-300 rounded"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="p-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-full mb-1"></div>
            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded-full ml-3"></div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-4 w-16 bg-gray-100 rounded"></div>
            <div className="h-4 w-12 bg-gray-100 rounded"></div>
          </div>
          <div className="h-4 w-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header skeleton */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg"></div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section Skeleton */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-5 w-48 bg-gray-100 rounded animate-pulse"></div>
            </div>
            <div className="mt-4 sm:mt-0 h-10 w-32 bg-blue-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Projects Section Skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="divide-y divide-gray-100">
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </div>
        </div>
      </main>
    </div>
  );
}

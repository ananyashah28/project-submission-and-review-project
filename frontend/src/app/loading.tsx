/**
 * Root Loading Component
 * Displays while the main app content is loading
 */
import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header skeleton */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content loading */}
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="mt-4 text-gray-500 text-sm">Loading...</p>
        </div>
      </main>
    </div>
  );
}

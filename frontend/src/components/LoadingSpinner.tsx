/**
 * Reusable Loading Spinner Component
 */
import React from "react";

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  color?: "blue" | "white" | "gray";
}

const sizeClasses = {
  xs: "h-3 w-3 border",
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
  xl: "h-16 w-16 border-4",
};

const colorClasses = {
  blue: "border-blue-200 border-t-blue-600",
  white: "border-white/30 border-t-white",
  gray: "border-gray-200 border-t-gray-600",
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
  color = "blue",
}) => {
  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Full page loading component
 */
interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ 
  message = "Loading..." 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-500 text-sm">{message}</p>
    </div>
  );
};

/**
 * Skeleton loader for cards
 */
export const CardSkeleton: React.FC = () => {
  return (
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
  );
};

/**
 * Skeleton loader for form inputs
 */
export const InputSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
      <div className="h-10 bg-gray-100 rounded w-full"></div>
    </div>
  );
};

export default LoadingSpinner;

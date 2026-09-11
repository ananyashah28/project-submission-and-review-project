"use client";

import React from "react";
import { ProjectStatus } from "@/types";

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  description: string;
}

const STATUS_CONFIG: Record<ProjectStatus, StatusConfig> = {
  draft: {
    label: "Draft",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200",
    description: "Project is in draft mode and can be edited",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  submitted: {
    label: "Submitted",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200",
    description: "Project has been submitted for review",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  under_review: {
    label: "Under Review",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-200",
    description: "Project is currently being reviewed",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  approved: {
    label: "Approved",
    color: "text-green-700",
    bgColor: "bg-green-100",
    borderColor: "border-green-200",
    description: "Project has been approved",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  changes_requested: {
    label: "Changes Requested",
    color: "text-red-700",
    bgColor: "bg-red-100",
    borderColor: "border-red-200",
    description: "Reviewer has requested changes",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
};

interface StatusBadgeProps {
  status: ProjectStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showTooltip?: boolean;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  showIcon = true,
  showTooltip = false,
  className = "",
}) => {
  const config = STATUS_CONFIG[status];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium border
        ${config.bgColor} ${config.color} ${config.borderColor}
        ${sizeClasses[size]}
        ${className}
      `}
      title={showTooltip ? config.description : undefined}
    >
      {showIcon && config.icon}
      {config.label}
    </span>
  );
};

// Export utility functions for use elsewhere
export const getStatusLabel = (status: ProjectStatus): string => {
  return STATUS_CONFIG[status]?.label || status;
};

export const getStatusColor = (status: ProjectStatus): string => {
  return `${STATUS_CONFIG[status]?.bgColor || ""} ${STATUS_CONFIG[status]?.color || ""}`;
};

export const getStatusDescription = (status: ProjectStatus): string => {
  return STATUS_CONFIG[status]?.description || "";
};

export default StatusBadge;

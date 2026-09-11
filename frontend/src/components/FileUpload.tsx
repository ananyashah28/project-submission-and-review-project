"use client";

import React, { useState, useCallback, useRef } from "react";
import axiosInstance, { getErrorMessage } from "@/lib/axios";

interface UploadedFile {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  download_url: string | null;
  is_image: boolean;
}

interface FileUploadProps {
  projectId: string;
  onUploadSuccess?: (file: UploadedFile) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

const DEFAULT_ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const FileUpload: React.FC<FileUploadProps> = ({
  projectId,
  onUploadSuccess,
  onUploadError,
  maxFileSize = 50,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        return `File type "${file.type}" is not allowed. Please upload images, PDF, ZIP, Word, or PowerPoint files.`;
      }

      // Check file size
      const maxSizeBytes = maxFileSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return `File size (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed size (${maxFileSize} MB).`;
      }

      return null;
    },
    [acceptedTypes, maxFileSize]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        onUploadError?.(validationError);
        return;
      }

      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axiosInstance.post(
          `/projects/${projectId}/files`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percent = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                setUploadProgress(percent);
              }
            },
          }
        );

        const uploadedFile: UploadedFile = response.data;
        onUploadSuccess?.(uploadedFile);
        setUploadProgress(100);
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        onUploadError?.(errorMessage);
      } finally {
        setIsUploading(false);
        // Reset progress after a short delay
        setTimeout(() => setUploadProgress(0), 1000);
      }
    },
    [projectId, validateFile, onUploadSuccess, onUploadError]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        uploadFile(files[0]);
      }
    },
    [uploadFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        uploadFile(files[0]);
      }
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [uploadFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const formatFileTypes = () => {
    const extensions = [".png", ".jpg", ".gif", ".pdf", ".zip", ".doc", ".ppt"];
    return extensions.join(", ");
  };

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }
          ${isUploading ? "pointer-events-none opacity-70" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(",")}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg
                className="animate-spin h-10 w-10 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="text-gray-600">Uploading... {uploadProgress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <svg
                className={`h-12 w-12 ${isDragging ? "text-blue-500" : "text-gray-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-700 font-medium">
                {isDragging
                  ? "Drop your file here"
                  : "Drag and drop a file here, or click to browse"}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Supported: {formatFileTypes()}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Max file size: {maxFileSize} MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

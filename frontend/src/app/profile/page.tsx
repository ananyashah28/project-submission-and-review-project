"use client";

/**
 * Profile Settings Page
 */
import React, { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Header } from "@/components/Header";
import { ConfirmModal } from "@/components";
import { useAuth } from "@/context";

function ProfileContent() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // TODO: Implement profile update API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // TODO: Implement delete account API
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // After successful deletion, logout and redirect
      setMessage({ type: "success", text: "Account deleted successfully" });
      // logout(); // Uncomment when API is implemented
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete account" });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-1 text-gray-500">
            Manage your account information and preferences
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 rounded-lg p-4 flex items-start space-x-3 ${
              message.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <svg
              className={`h-5 w-5 flex-shrink-0 ${
                message.type === "success" ? "text-green-500" : "text-red-500"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {message.type === "success" ? (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            <p
              className={`text-sm ${
                message.type === "success" ? "text-green-700" : "text-red-700"
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg
                  className="h-5 w-5 mr-2 text-gray-500"
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
                Personal Information
              </h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="p-6">
              {/* Avatar */}
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {user?.name}
                  </h3>
                  <p className="text-gray-500">{user?.email}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900"
                    />
                  ) : (
                    <p className="text-gray-900 py-2.5">{user?.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled
                      className="block w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  ) : (
                    <p className="text-gray-900 py-2.5">{user?.email}</p>
                  )}
                  {isEditing && (
                    <p className="mt-1 text-xs text-gray-500">
                      Email cannot be changed
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member Since
                  </label>
                  <p className="text-gray-900 py-2.5">
                    {formatDate(user?.created_at)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {isEditing && (
                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user?.name || "",
                        email: user?.email || "",
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {isSaving ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg
                  className="h-5 w-5 mr-2 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Security
              </h2>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Password</h3>
                  <p className="text-sm text-gray-500">
                    Change your account password
                  </p>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                  Change Password
                </button>
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Active Sessions
                  </h3>
                  <p className="text-sm text-gray-500">
                    Manage your active login sessions
                  </p>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                  View Sessions
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <h2 className="text-lg font-semibold text-red-700 flex items-center">
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Danger Zone
              </h2>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Delete Account
                  </h3>
                  <p className="text-sm text-gray-500">
                    Permanently delete your account and all data
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-300 rounded-lg transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Account Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Account"
          message="Are you sure you want to delete your account? This action is permanent and cannot be undone. All your projects, files, and data will be permanently removed."
          confirmText="Delete Account"
          cancelText="Cancel"
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
          isLoading={isDeleting}
        />
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

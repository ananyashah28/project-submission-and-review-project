"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ProjectMember, ProjectRole, User } from "@/types";
import { projectMemberService, userService } from "@/services";

interface TeamViewProps {
  projectId: string;
  isOwner?: boolean;
}

const roleColors: Record<ProjectRole, { bg: string; text: string; border: string }> = {
  owner: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  admin: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  member: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  viewer: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
};

const getAvatarBg = (name: string) => {
  const colors = [
    "bg-blue-600",
    "bg-indigo-600",
    "bg-purple-600",
    "bg-emerald-600",
    "bg-teal-600",
    "bg-cyan-600",
    "bg-rose-600",
    "bg-amber-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const TeamView: React.FC<TeamViewProps> = ({ projectId, isOwner = false }) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [customEmail, setCustomEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<ProjectRole>("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Remove confirmation
  const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await projectMemberService.getProjectMembers(projectId);
      setMembers(res.members);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load project members");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Search users for add modal
  useEffect(() => {
    if (!isAddModalOpen) return;
    const timer = setTimeout(async () => {
      try {
        const users = await userService.searchUsers(searchQuery);
        // Exclude users already members
        const memberUserIds = new Set(members.map((m) => m.user_id));
        setAvailableUsers(users.filter((u) => !memberUserIds.has(u.id)));
      } catch (e) {
        console.error("Failed to search users", e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, isAddModalOpen, members]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const emailToAdd = selectedUser ? selectedUser.email : customEmail.trim();
    if (!emailToAdd) {
      setModalError("Please select an existing user or enter an email address");
      return;
    }

    try {
      setIsSubmitting(true);
      await projectMemberService.addProjectMember(projectId, {
        email: emailToAdd,
        user_id: selectedUser ? selectedUser.id : undefined,
        role: selectedRole,
      });
      setIsAddModalOpen(false);
      setSelectedUser(null);
      setCustomEmail("");
      setSearchQuery("");
      fetchMembers();
    } catch (err: any) {
      setModalError(err?.response?.data?.detail || "Failed to add member to project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (member: ProjectMember, newRole: ProjectRole) => {
    if (member.is_owner || member.role === "owner") return;
    try {
      await projectMemberService.updateMemberRole(projectId, member.user_id, {
        role: newRole,
      });
      setMembers((prev) =>
        prev.map((m) => (m.user_id === member.user_id ? { ...m, role: newRole } : m))
      );
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to update role");
    }
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    try {
      setIsRemoving(true);
      await projectMemberService.removeProjectMember(projectId, memberToRemove.user_id);
      setMembers((prev) => prev.filter((m) => m.user_id !== memberToRemove.user_id));
      setMemberToRemove(null);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to remove member");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Project People & Team</h2>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200">
              {members.length} {members.length === 1 ? "member" : "members"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            People in this workspace can be assigned to tasks, bugs, timesheets, and milestones.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedUser(null);
            setCustomEmail("");
            setSearchQuery("");
            setModalError(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Roles Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Team</span>
          <span className="text-2xl font-black text-slate-900 mt-0.5 block">{members.length}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">Workspace Lead</span>
          <span className="text-2xl font-black text-amber-900 mt-0.5 block">
            {members.filter((m) => m.is_owner || m.role === "owner").length}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">Admins / Devs</span>
          <span className="text-2xl font-black text-blue-900 mt-0.5 block">
            {members.filter((m) => m.role === "admin" || m.role === "member").length}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Viewers</span>
          <span className="text-2xl font-black text-slate-700 mt-0.5 block">
            {members.filter((m) => m.role === "viewer").length}
          </span>
        </div>
      </div>

      {/* Members Roster Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-xs font-semibold text-slate-500 mt-2">Loading team members...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {error}
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">No team members yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add team members to start assigning tasks and bugs to teammates.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3">Team Member</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => {
                  const initials = member.name
                    ? member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "U";
                  const avatarColor = getAvatarBg(member.name || "User");
                  const badgeStyle = roleColors[member.role] || roleColors.member;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full ${avatarColor} text-white flex items-center justify-center font-bold text-[11px] shadow-2xs`}
                          >
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{member.name}</span>
                            {member.is_owner && (
                              <span className="text-[10px] font-semibold text-amber-700">
                                Project Creator & Owner
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {member.email}
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {member.is_owner || member.role === "owner" ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                          >
                            <svg className="w-3 h-3 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            Owner
                          </span>
                        ) : (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member, e.target.value as ProjectRole)}
                            className={`text-[11px] font-bold py-1 px-2.5 rounded-lg border outline-none cursor-pointer ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                        {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        {member.is_owner || member.role === "owner" ? (
                          <span className="text-slate-400 text-[11px] italic">Owner</span>
                        ) : (
                          <button
                            onClick={() => setMemberToRemove(member)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove from project"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Add Team Member</h3>
                <p className="text-xs text-slate-500 mt-0.5">Invite teammates to collaborate on this workspace</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-5 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {modalError}
                </div>
              )}

              {/* User search / select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select User or Enter Email
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCustomEmail(e.target.value);
                    setSelectedUser(null);
                  }}
                  placeholder="Search user by name or type email..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />

                {/* Suggestions List */}
                {availableUsers.length > 0 && !selectedUser && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 shadow-sm">
                    {availableUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setSearchQuery(`${u.name} (${u.email})`);
                          setCustomEmail(u.email);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center justify-between text-xs transition-colors"
                      >
                        <span className="font-semibold text-slate-900">{u.name}</span>
                        <span className="text-slate-500 font-mono text-[11px]">{u.email}</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedUser && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-blue-900 block">{selectedUser.name}</span>
                      <span className="text-blue-700 text-[11px] font-mono">{selectedUser.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setSearchQuery("");
                        setCustomEmail("");
                      }}
                      className="text-blue-500 hover:text-blue-800 text-xs font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Role selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Project Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["member", "admin", "viewer"] as ProjectRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold capitalize transition-all ${
                        selectedRole === r
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {selectedRole === "admin"
                    ? "Full access to edit project, assign tasks, manage milestones and team members."
                    : selectedRole === "member"
                    ? "Can be assigned tasks and bugs, update task statuses, and log hours."
                    : "Read-only access to view project progress, boards, and reports."}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
                >
                  {isSubmitting ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">Remove Team Member?</h3>
            <p className="text-xs text-slate-600 mt-2">
              Are you sure you want to remove <strong className="text-slate-900">{memberToRemove.name}</strong> from this project team?
              Existing task assignments will remain unlinked.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
              >
                {isRemoving ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamView;

"use client";

import { useState } from "react";
import { TEAM_MEMBERS, TeamMember } from "@/lib/mock-data";
import { formatDate, getStatusColor } from "@/lib/utils";

const ROLE_COLORS: Record<TeamMember["role"], string> = {
  owner: "bg-purple-100 text-purple-800",
  member: "bg-zinc-100 text-zinc-600",
};

type DialogAction =
  | { type: "remove"; member: TeamMember }
  | { type: "promote"; member: TeamMember }
  | null;

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(TEAM_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [dialog, setDialog] = useState<DialogAction>(null);

  const totalCount = members.length;
  const activeCount = members.filter((m) => m.status === "active").length;
  const pendingCount = members.filter((m) => m.status === "pending").length;

  function handleInvite() {
    const trimmed = inviteEmail.trim().toLowerCase();
    if (!trimmed) {
      setInviteError("Email address is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setInviteError("Please enter a valid email address.");
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === trimmed)) {
      setInviteError("This person is already on the team.");
      return;
    }

    const newMember: TeamMember = {
      id: `tm_${Date.now()}`,
      teamId: "team_1",
      email: trimmed,
      role: "member",
      status: "pending",
      invitedAt: Date.now(),
    };

    setMembers((prev) => [...prev, newMember]);
    setInviteEmail("");
    setInviteError("");
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 3000);
  }

  function confirmAction() {
    if (!dialog) return;

    if (dialog.type === "remove") {
      setMembers((prev) => prev.filter((m) => m.id !== dialog.member.id));
    } else if (dialog.type === "promote") {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === dialog.member.id ? { ...m, role: "owner" as const } : m
        )
      );
    }

    setDialog(null);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-foreground">{totalCount}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wide">
            Total Members
          </p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wide">
            Active
          </p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wide">
            Pending
          </p>
        </div>
      </div>

      {/* Invite form */}
      <div className="card">
        <h2 className="text-base font-semibold text-foreground mb-4">Invite a Team Member</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="email"
              className="input-field"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                setInviteError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInvite();
              }}
              aria-label="Email address to invite"
            />
            {inviteError && (
              <p className="text-xs text-red-600 mt-1.5">{inviteError}</p>
            )}
          </div>
          <button className="btn-primary shrink-0" onClick={handleInvite}>
            Send Invite
          </button>
        </div>
        {inviteSent && (
          <p className="text-xs text-emerald-600 mt-2 font-medium">
            Invite sent successfully.
          </p>
        )}
      </div>

      {/* Members table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Team Members</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Joined</th>
                <th className="text-right px-6 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {member.name
                            ? member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()
                            : member.email[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">
                        {member.name ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{member.email}</td>
                  <td className="px-4 py-4">
                    <span className={`badge ${ROLE_COLORS[member.role]}`}>
                      {member.role === "owner" ? "Owner" : "Member"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`badge ${getStatusColor(member.status)}`}>
                      {member.status === "active" ? "Active" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {member.joinedAt ? formatDate(member.joinedAt) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {member.role !== "owner" && (
                        <>
                          <button
                            className="btn-secondary px-3 py-1.5 text-xs"
                            onClick={() => setDialog({ type: "promote", member })}
                          >
                            Promote to Owner
                          </button>
                          <button
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                            onClick={() => setDialog({ type: "remove", member })}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation dialog */}
      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDialog(null);
          }}
        >
          <div className="card w-full max-w-sm mx-4 shadow-xl">
            <h3 id="dialog-title" className="text-base font-semibold text-foreground mb-2">
              {dialog.type === "remove" ? "Remove Member" : "Promote to Owner"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {dialog.type === "remove"
                ? `Are you sure you want to remove ${dialog.member.name ?? dialog.member.email} from the team? This action cannot be undone.`
                : `Promote ${dialog.member.name ?? dialog.member.email} to Owner? They will have full admin access.`}
            </p>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setDialog(null)}>
                Cancel
              </button>
              <button
                className={
                  dialog.type === "remove"
                    ? "px-5 py-2.5 rounded-lg text-sm font-medium border-none bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                    : "btn-primary"
                }
                onClick={confirmAction}
              >
                {dialog.type === "remove" ? "Remove" : "Promote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { AdminMemberView, Role } from "@liss11/shared";
import { useAuth } from "../../auth/AuthContext";
import {
  getMembers,
  setMemberRole,
  setMemberVerified,
  setMemberActive,
  deleteMember,
} from "../../lib/members-api";
import { Alert } from "../../components/ui";
import { formatDate } from "../../lib/format";

const ROLE_LABELS: Record<Role, string> = {
  [Role.MEMBER]: "Member",
  [Role.EDITOR]: "Editor",
  [Role.ELECTORAL_COMMITTEE]: "Electoral Committee",
  [Role.ADMIN]: "Admin",
  [Role.SUPER_ADMIN]: "Super Admin",
};

export default function MembersAdminPage() {
  const { member: me } = useAuth();
  const [members, setMembers] = useState<AdminMemberView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    getMembers()
      .then(setMembers)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const patch = (id: string, changes: Partial<AdminMemberView>) =>
    setMembers((list) => list.map((x) => (x.id === id ? { ...x, ...changes } : x)));

  // Wraps a mutating action with per-row busy state + error handling.
  const run = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = (m: AdminMemberView, role: Role) => {
    if (role === m.role) return;
    if (
      !confirm(
        `Change ${m.firstName} ${m.lastName}'s role from ${ROLE_LABELS[m.role]} to ${ROLE_LABELS[role]}?`,
      )
    )
      return;
    void run(m.id, async () => {
      await setMemberRole(m.id, role);
      patch(m.id, { role });
    });
  };

  const toggleVerified = (m: AdminMemberView) =>
    void run(m.id, async () => {
      await setMemberVerified(m.id, !m.verified);
      patch(m.id, { verified: !m.verified });
    });

  const toggleActive = (m: AdminMemberView) => {
    const next = !m.approved;
    if (
      !next &&
      !confirm(
        `Deactivate ${m.firstName} ${m.lastName}? They'll be logged out and can't sign in until reactivated.`,
      )
    )
      return;
    void run(m.id, async () => {
      await setMemberActive(m.id, next);
      patch(m.id, { approved: next });
    });
  };

  const remove = (m: AdminMemberView) => {
    if (!confirm(`Permanently delete ${m.firstName} ${m.lastName}? This can't be undone.`))
      return;
    void run(m.id, async () => {
      await deleteMember(m.id);
      setMembers((list) => list.filter((x) => x.id !== m.id));
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-maroon">Members</h1>
        <p className="mt-1 text-sm text-ink/60">
          Everyone registered on the site. As a super-admin you can assign roles,
          verify or deactivate accounts, and remove members. You can't change or
          deactivate your own account here (to avoid locking yourself out).
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : members.length === 0 ? (
        <p className="rounded-xl border border-gold/20 bg-white p-6 text-sm text-ink/50">
          No members yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gold/20 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isSelf = m.id === me?.id;
                const busy = busyId === m.id;
                return (
                  <tr
                    key={m.id}
                    className={`border-t border-gold/10 ${m.approved ? "" : "bg-danger/5"}`}
                  >
                    <td className="px-4 py-3 font-medium text-nearblack">
                      {m.firstName} {m.lastName}
                      {isSelf && <span className="ml-1 text-xs text-ink/50">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-ink/70">
                      <a href={`mailto:${m.email}`} className="text-maroon hover:underline">
                        {m.email}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={m.verified ? "text-success" : "text-ink/40"}>
                          {m.verified ? "✓ Verified" : "Unverified"}
                        </span>
                        {!m.approved && (
                          <span className="text-xs font-semibold text-danger">Deactivated</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink/60">{formatDate(m.createdAt)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={m.role}
                        disabled={isSelf || busy}
                        onChange={(e) => changeRole(m, e.target.value as Role)}
                        className="rounded-lg border border-ink/15 bg-white px-2 py-1 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {Object.values(Role).map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3 whitespace-nowrap">
                        <button
                          onClick={() => toggleVerified(m)}
                          disabled={busy}
                          className="font-medium text-maroon hover:underline disabled:opacity-50"
                        >
                          {m.verified ? "Unverify" : "Verify"}
                        </button>
                        <button
                          onClick={() => toggleActive(m)}
                          disabled={busy || isSelf}
                          className="font-medium text-maroon hover:underline disabled:opacity-40"
                        >
                          {m.approved ? "Deactivate" : "Reactivate"}
                        </button>
                        <button
                          onClick={() => remove(m)}
                          disabled={busy || isSelf}
                          className="font-medium text-danger hover:underline disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

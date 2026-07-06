import { AdminMemberView, Role } from "@liss11/shared";
import { apiFetch } from "./api";

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const d = (await res.json()) as { error?: string };
    return d.error ?? fallback;
  } catch {
    return fallback;
  }
}

/** All members (SUPER_ADMIN only). */
export async function getMembers(): Promise<AdminMemberView[]> {
  const res = await apiFetch("/admin/members");
  if (!res.ok) throw new Error(await errorMessage(res, "Failed to load members"));
  return ((await res.json()) as { members: AdminMemberView[] }).members;
}

/** Change a member's role (SUPER_ADMIN only). */
export async function setMemberRole(id: string, role: Role): Promise<void> {
  const res = await apiFetch(`/admin/members/${id}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Could not update role"));
}

/** Manually verify / unverify a member. */
export async function setMemberVerified(id: string, verified: boolean): Promise<void> {
  const res = await apiFetch(`/admin/members/${id}/verified`, {
    method: "PUT",
    body: JSON.stringify({ verified }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Could not update member"));
}

/** Activate / deactivate a member's ability to log in. */
export async function setMemberActive(id: string, approved: boolean): Promise<void> {
  const res = await apiFetch(`/admin/members/${id}/active`, {
    method: "PUT",
    body: JSON.stringify({ approved }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Could not update member"));
}

/** Permanently delete a member (blocked if they have voting/payment history). */
export async function deleteMember(id: string): Promise<void> {
  const res = await apiFetch(`/admin/members/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await errorMessage(res, "Could not delete member"));
}

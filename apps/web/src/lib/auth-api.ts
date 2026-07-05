import { MemberView } from "@liss11/shared";
import { apiFetch } from "./api";

/** Reads the JSON error message from a failed response, with a fallback. */
async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getMe(): Promise<MemberView | null> {
  const res = await apiFetch("/auth/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(await errorMessage(res, "Failed to load session"));
  const data = (await res.json()) as { member: MemberView };
  return data.member;
}

export async function login(email: string, password: string): Promise<MemberView> {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Login failed"));
  const data = (await res.json()) as { member: MemberView };
  return data.member;
}

export async function register(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  photoUrl: string,
): Promise<void> {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ firstName, lastName, email, password, photoUrl }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Registration failed"));
}

/** Public avatar upload used during sign-up (the member has no session yet). */
export async function uploadAvatar(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch("/uploads/avatar", { method: "POST", body: form });
  if (!res.ok) throw new Error(await errorMessage(res, "Could not upload photo"));
  return ((await res.json()) as { url: string }).url;
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}

export async function forgotPassword(email: string): Promise<string> {
  const res = await apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  const data = (await res.json()) as { message?: string };
  return data.message ?? "If that account exists, a reset link has been sent.";
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const res = await apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Could not reset password"));
}

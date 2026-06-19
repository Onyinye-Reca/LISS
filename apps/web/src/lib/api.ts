export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

let csrfToken: string | null = null;

/** Fetches and caches a CSRF token (also sets the matching cookie). */
async function fetchCsrf(): Promise<string> {
  const res = await fetch(`${API_BASE}/csrf`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to obtain CSRF token");
  const data = (await res.json()) as { csrfToken: string };
  csrfToken = data.csrfToken;
  return csrfToken;
}

/**
 * fetch wrapper that always sends cookies and attaches the CSRF header to
 * mutating requests. Refreshes the token once on a 403 (stale/missing token).
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const method = (options.method ?? "GET").toUpperCase();
  const mutating = method !== "GET" && method !== "HEAD";

  const build = async (): Promise<Response> => {
    const headers = new Headers(options.headers);
    if (mutating) {
      headers.set("X-CSRF-Token", csrfToken ?? (await fetchCsrf()));
      // Let the browser set multipart boundaries for FormData; only default
      // JSON for plain-body requests.
      const isFormData =
        typeof FormData !== "undefined" && options.body instanceof FormData;
      if (options.body && !isFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }
    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  };

  let res = await build();
  if (mutating && res.status === 403) {
    await fetchCsrf();
    res = await build();
  }
  return res;
}

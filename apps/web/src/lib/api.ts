export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

// The staging API runs on a free tier that spins down when idle; the first
// request after a nap can cold-start for ~30-60s. Cap each request so a genuine
// stall surfaces a friendly message instead of hanging the UI forever.
const REQUEST_TIMEOUT_MS = 60_000;

/** Thrown when a request exceeds REQUEST_TIMEOUT_MS. Carries a user-facing message. */
export class TimeoutError extends Error {
  constructor() {
    super(
      "The server is taking longer than usual — it may be waking up. Please try again in a moment.",
    );
    this.name = "TimeoutError";
  }
}

/** fetch with an AbortController timeout; maps an abort to a friendly TimeoutError. */
async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new TimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// --- Request activity (drives the global top loading bar) ---
// A SPA has no browser tab spinner on client-side navigation, so we track
// in-flight API calls here and let a <LoadingBar/> subscribe.
type ActivityListener = (active: boolean) => void;
const activityListeners = new Set<ActivityListener>();
let inFlight = 0;

/** Subscribe to "is the app currently making requests?" Returns an unsubscribe. */
export function onApiActivity(listener: ActivityListener): () => void {
  activityListeners.add(listener);
  return () => activityListeners.delete(listener);
}

function startRequest(): void {
  inFlight += 1;
  if (inFlight === 1) activityListeners.forEach((l) => l(true));
}

function endRequest(): void {
  inFlight = Math.max(0, inFlight - 1);
  if (inFlight === 0) activityListeners.forEach((l) => l(false));
}

let csrfToken: string | null = null;

/** Fetches and caches a CSRF token (also sets the matching cookie). */
async function fetchCsrf(): Promise<string> {
  const res = await fetchWithTimeout(`${API_BASE}/csrf`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to obtain CSRF token");
  const data = (await res.json()) as { csrfToken: string };
  csrfToken = data.csrfToken;
  return csrfToken;
}

/**
 * fetch wrapper that always sends cookies and attaches the CSRF header to
 * mutating requests. Refreshes the token once on a 403 (stale/missing token).
 * Each request is bounded by a timeout (see fetchWithTimeout).
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
    return fetchWithTimeout(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  };

  startRequest();
  try {
    let res = await build();
    if (mutating && res.status === 403) {
      await fetchCsrf();
      res = await build();
    }
    return res;
  } finally {
    endRequest();
  }
}

export function shouldUseSecureCookies(): boolean {
  const configured = process.env.COOKIE_SECURE?.toLowerCase();
  if (configured === "true") return true;
  if (configured === "false") return false;
  return process.env.NODE_ENV === "production";
}

// SameSite for the auth + CSRF cookies. When the web app and API live on
// different sites (staging/prod: *.netlify.app calling *.onrender.com), the
// browser only sends cookies cross-site if they are SameSite=None - which
// browsers require to be paired with Secure. Locally (http, same-site
// localhost) None is impossible, so we fall back to Lax. SameSite therefore
// tracks the Secure flag.
export function cookieSameSite(): "lax" | "none" {
  return shouldUseSecureCookies() ? "none" : "lax";
}

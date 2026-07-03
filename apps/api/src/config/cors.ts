// CORS origin allowlisting.
//
// The API uses credentialed CORS (auth + CSRF cookies), so the allowed origin
// must be an exact value - never "*". WEB_ORIGIN is the canonical web origin.
//
// When the web app is hosted on Netlify, its deploy previews and branch deploys
// get dynamic, per-deploy origins of the form https://<label>--<site>.netlify.app
// (e.g. https://deploy-preview-42--staging-liss11.netlify.app or
// https://dev--staging-liss11.netlify.app). Those contexts point at the same
// staging API, so they must be allowed too - but ONLY for the same Netlify site.
// Arbitrary *.netlify.app hosts are never allowed, since any Netlify user could
// spin one up and ride the credentialed cookies.
//
// For a custom production domain (WEB_ORIGIN=https://liss11.org) no preview
// suffix is derived, so production stays strict exact-match.

export function buildOriginAllowlist(
  webOrigin: string,
): (origin: string | undefined) => boolean {
  let previewSuffix: string | null = null;
  try {
    const { protocol, hostname } = new URL(webOrigin);
    if (protocol === "https:" && hostname.endsWith(".netlify.app")) {
      const site = hostname.slice(0, -".netlify.app".length); // e.g. "staging-liss11"
      // Only when WEB_ORIGIN is the site's apex (no "--"), so we never derive a
      // suffix from an origin that is itself a preview.
      if (site && !site.includes("--")) {
        previewSuffix = `--${site}.netlify.app`;
      }
    }
  } catch {
    // WEB_ORIGIN is not a valid URL; fall back to exact-match only.
  }

  return (origin) => {
    // Non-browser clients (curl, server-to-server) send no Origin header.
    if (!origin) return true;
    if (origin === webOrigin) return true;
    if (!previewSuffix) return false;

    // Accept https://<label><previewSuffix> where <label> is a single DNS label.
    // Anchoring the match to the end and rejecting dots in the label blocks
    // lookalikes such as https://x--staging-liss11.netlify.app.evil.com and
    // https://evil.com--staging-liss11.netlify.app.
    if (!origin.startsWith("https://")) return false;
    const host = origin.slice("https://".length);
    if (!host.endsWith(previewSuffix)) return false;
    const label = host.slice(0, -previewSuffix.length);
    return label.length > 0 && /^[a-z0-9-]+$/i.test(label);
  };
}

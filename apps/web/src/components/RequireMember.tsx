import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/**
 * Client-side gate for members-only public pages (gallery sub-pages excluded;
 * see App routes). Any logged-in member passes. This is UX only — the server
 * also requires a session on the gated API endpoints; never trust this alone.
 */
export default function RequireMember() {
  const { member, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink/60">
        Loading…
      </div>
    );
  }

  if (!member) {
    // Send back here after a successful login (LoginPage reads state.from).
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

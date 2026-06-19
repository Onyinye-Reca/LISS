import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

// Modules with a built admin page link; the rest land in later sprints.
const modules: { label: string; to?: string }[] = [
  { label: "EXCOS", to: "/admin/excos" },
  { label: "Board of Trustees", to: "/admin/bot" },
  { label: "Regions", to: "/admin/regions" },
  { label: "Announcements", to: "/admin/announcements" },
  { label: "Gallery", to: "/admin/gallery" },
  { label: "Events", to: "/admin/events" },
  { label: "Financials", to: "/admin/financials" },
  { label: "Blog", to: "/admin/blog" },
  { label: "Contact Messages", to: "/admin/contact" },
  { label: "Site Settings", to: "/admin/settings" },
  { label: "Elections" },
  { label: "Payments" },
];

export default function DashboardPage() {
  const { member } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-maroon">Dashboard</h1>
        <p className="mt-1 text-sm text-ink/60">
          Welcome, {member?.fullName}. Manage site content from the modules below.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(({ label, to }) =>
          to ? (
            <Link
              key={label}
              to={to}
              className="rounded-xl border border-gold/30 bg-white p-5 transition hover:border-gold hover:shadow-sm"
            >
              <h2 className="font-semibold text-maroon">{label}</h2>
              <p className="mt-1 text-sm text-ink/60">Manage →</p>
            </Link>
          ) : (
            <div key={label} className="rounded-xl border border-gold/30 bg-white p-5">
              <h2 className="font-semibold text-maroon">{label}</h2>
              <p className="mt-1 text-sm text-ink/50">Coming in a later sprint</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

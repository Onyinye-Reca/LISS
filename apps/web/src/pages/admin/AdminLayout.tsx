import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Role } from "@liss11/shared";
import { useAuth } from "../../auth/AuthContext";

// `role` limits an item to a single role; undefined means all admin roles.
const navItems: { to: string; label: string; end: boolean; role?: Role }[] = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/members", label: "Members", end: false, role: Role.SUPER_ADMIN },
  { to: "/admin/excos", label: "EXCOS", end: false },
  { to: "/admin/bot", label: "Board of Trustees", end: false },
  { to: "/admin/regions", label: "Regions", end: false },
  { to: "/admin/announcements", label: "Announcements", end: false },
  { to: "/admin/gallery", label: "Gallery", end: false },
  { to: "/admin/events", label: "Events", end: false },
  { to: "/admin/financials", label: "Financials", end: false },
  { to: "/admin/payments", label: "Payments", end: false },
  { to: "/admin/elections", label: "Elections", end: false },
  { to: "/admin/blog", label: "Blog", end: false },
  { to: "/admin/contact", label: "Contact Messages", end: false },
  { to: "/admin/settings", label: "Site Settings", end: false },
];

export default function AdminLayout() {
  const { member, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-cream font-sans text-ink md:flex">
      {/* Sidebar */}
      <aside className="bg-maroon text-white md:w-60 md:min-h-screen">
        <div className="px-5 py-4 text-lg font-bold">LISS11' Admin</div>
        <nav className="px-3 pb-4">
          {navItems
            .filter((item) => !item.role || member?.role === item.role)
            .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gold/20 bg-white px-6 py-3">
          <Link to="/" className="text-sm text-ink/60 hover:text-maroon">
            ← Back to site
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-ink/70">
              {member?.firstName} {member?.lastName}{" "}
              <span className="rounded bg-gold/20 px-2 py-0.5 text-xs font-semibold text-maroon">
                {member?.role}
              </span>
            </span>
            <button
              onClick={() => void onLogout()}
              className="font-semibold text-maroon underline"
            >
              Log out
            </button>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

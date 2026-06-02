import { useAuth } from "../../auth/AuthContext";

export default function DashboardPage() {
  const { member } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-maroon">Dashboard</h1>
        <p className="mt-1 text-sm text-ink/60">
          Welcome, {member?.fullName}. This is the protected admin shell — feature
          modules will be added here in later sprints.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["Members", "Announcements", "Events", "Gallery", "Elections", "Payments"].map(
          (label) => (
            <div
              key={label}
              className="rounded-xl border border-gold/30 bg-white p-5"
            >
              <h2 className="font-semibold text-maroon">{label}</h2>
              <p className="mt-1 text-sm text-ink/50">Coming in a later sprint</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

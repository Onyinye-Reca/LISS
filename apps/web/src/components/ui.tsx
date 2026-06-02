import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

/** Centered card layout for the public auth pages. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-cream text-ink font-sans flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-gold/30 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-maroon">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink/60">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-4 text-center text-sm text-ink/70">{footer}</div>}
      </div>
    </main>
  );
}

export function TextField({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
      />
    </label>
  );
}

export function Button({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-full rounded-lg bg-maroon px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-maroon-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function Alert({
  kind = "error",
  children,
}: {
  kind?: "error" | "success";
  children: ReactNode;
}) {
  const styles =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-green-200 bg-green-50 text-green-800";
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${styles}`} role="alert">
      {children}
    </div>
  );
}

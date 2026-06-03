import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
import { Link } from "react-router-dom";

const fieldClass =
  "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30";

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
      <input {...props} className={fieldClass} />
    </label>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: { label: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <select {...props} className={fieldClass}>
        {children}
      </select>
    </label>
  );
}

export function TextArea({
  label,
  ...props
}: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <textarea {...props} className={fieldClass} />
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
      ? "border-danger/30 bg-danger/5 text-danger"
      : "border-success/30 bg-success/5 text-success";
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${styles}`} role="alert">
      {children}
    </div>
  );
}

/**
 * Empty-state block (PRD 9.3): icon, heading, description, CTA. Used for the
 * homepage preview sections whose data arrives in later sprints.
 */
export function EmptyState({
  icon,
  heading,
  description,
  ctaLabel,
  ctaTo,
}: {
  icon?: ReactNode;
  heading: string;
  description: string;
  ctaLabel: string;
  ctaTo: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-gold/40 bg-card/50 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-3xl text-gold" aria-hidden="true">{icon}</div>}
      <h3 className="text-lg font-semibold text-maroon">{heading}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink/70">{description}</p>
      <Link
        to={ctaTo}
        className="mt-5 rounded-lg bg-maroon px-4 py-2 text-sm font-semibold text-white hover:bg-maroon-dark"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

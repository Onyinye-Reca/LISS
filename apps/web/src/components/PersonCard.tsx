import { ReactNode } from "react";

/** Builds a wa.me link from a phone number (digits only). */
export function waLink(whatsapp: string): string {
  return `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
}

function Avatar({ photoUrl, name }: { photoUrl: string | null; name: string }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`Photo of ${name}`}
        className="h-24 w-24 rounded-full object-cover"
        loading="lazy"
      />
    );
  }
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
  return (
    <div
      className="flex h-24 w-24 items-center justify-center rounded-full bg-maroon text-2xl font-semibold text-white"
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

export default function PersonCard({
  photoUrl,
  name,
  subtitle,
  note,
  bio,
  email,
  whatsapp,
}: {
  photoUrl: string | null;
  name: string;
  subtitle: string;
  note?: ReactNode;
  bio?: string | null;
  email?: string | null;
  whatsapp?: string | null;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-gold/30 bg-card p-6 text-center">
      <Avatar photoUrl={photoUrl} name={name} />
      <h3 className="mt-4 text-lg font-semibold text-nearblack">{name}</h3>
      <p className="text-sm font-medium text-maroon">{subtitle}</p>
      {note && <p className="mt-1 text-xs text-ink/60">{note}</p>}
      {bio && <p className="mt-3 text-sm leading-relaxed text-ink/70">{bio}</p>}
      {(email || whatsapp) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
          {email && (
            <a href={`mailto:${email}`} className="font-medium text-maroon hover:underline">
              Email
            </a>
          )}
          {whatsapp && (
            <a
              href={waLink(whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-maroon hover:underline"
            >
              WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}

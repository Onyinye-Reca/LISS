import { FormEvent, useEffect, useState } from "react";
import { getSiteSettings, updateSiteSettings } from "../../lib/content-api";
import { Button, TextField, Alert } from "../../components/ui";
import ImageUpload from "../../components/ImageUpload";

export default function SettingsAdminPage() {
  const [heroVideoUrl, setHeroVideoUrl] = useState("");
  const [heroPosterUrl, setHeroPosterUrl] = useState<string | null>(null);
  const [annualDuesNaira, setAnnualDuesNaira] = useState("");
  const [constitutionUrl, setConstitutionUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSiteSettings()
      .then((s) => {
        setHeroVideoUrl(s.heroVideoUrl ?? "");
        setHeroPosterUrl(s.heroPosterUrl);
        setAnnualDuesNaira(s.annualDuesNaira != null ? String(s.annualDuesNaira) : "");
        setConstitutionUrl(s.constitutionUrl ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updateSiteSettings({
        heroVideoUrl: heroVideoUrl.trim() || null,
        heroPosterUrl: heroPosterUrl || null,
        constitutionUrl: constitutionUrl.trim() || null,
        annualDuesNaira: annualDuesNaira.trim() === "" ? null : Number(annualDuesNaira),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-maroon">Site Settings</h1>
        <p className="mt-1 text-sm text-ink/60">
          Manage the home page hero. Leave the video blank to show the plain
          maroon background.
        </p>
      </div>

      {error && <Alert>{error}</Alert>}
      {saved && <Alert kind="success">Saved.</Alert>}

      <form onSubmit={save} className="space-y-4 rounded-xl border border-gold/30 bg-white p-6">
        <h2 className="font-semibold text-maroon">Home hero</h2>
        <TextField
          label="Hero video URL (optional)"
          type="url"
          placeholder="https://res.cloudinary.com/.../hero.mp4"
          value={heroVideoUrl}
          onChange={(e) => setHeroVideoUrl(e.target.value)}
        />
        <p className="text-xs text-ink/50">
          Paste a hosted .mp4 URL (e.g. uploaded to Cloudinary). It plays muted
          and looped behind the headline, with the maroon gradient over it.
        </p>
        <ImageUpload
          label="Hero poster image (optional - shown before the video loads)"
          shape="rect"
          value={heroPosterUrl}
          folder="hero"
          onChange={setHeroPosterUrl}
        />
        <div className="border-t border-gold/20 pt-4">
          <h2 className="font-semibold text-maroon">Membership dues</h2>
          <p className="mb-3 mt-1 text-xs text-ink/50">
            The annual dues amount. Members see this on their dues page and it
            pre-fills the payment form. Leave blank if dues are not set.
          </p>
          <TextField
            label="Annual dues (₦)"
            type="number"
            min={0}
            step={1}
            placeholder="e.g. 5000"
            value={annualDuesNaira}
            onChange={(e) => setAnnualDuesNaira(e.target.value)}
          />
        </div>
        <div className="border-t border-gold/20 pt-4">
          <h2 className="font-semibold text-maroon">Constitution</h2>
          <p className="mb-3 mt-1 text-xs text-ink/50">
            Paste a hosted PDF URL (e.g. uploaded to Cloudinary). A download
            button appears on the About page when set.
          </p>
          <TextField
            label="Constitution PDF URL"
            type="url"
            placeholder="https://res.cloudinary.com/.../constitution.pdf"
            value={constitutionUrl}
            onChange={(e) => setConstitutionUrl(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={busy} className="w-auto px-5">
          {busy ? "Saving…" : "Save"}
        </Button>
      </form>
    </div>
  );
}

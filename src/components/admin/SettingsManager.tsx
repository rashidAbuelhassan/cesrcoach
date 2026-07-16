"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Consultant, EventType } from "@/lib/types";
import { site } from "@/config/site";

interface Props {
  siteName: string;
  logoUrl: string | null;
  contactEmail: string;
  adminEmails: string;
  consultants: Consultant[];
  eventTypes: EventType[];
}

export default function SettingsManager(props: Props) {
  const router = useRouter();
  const [siteName, setSiteName] = useState(props.siteName);
  const [contactEmail, setContactEmail] = useState(props.contactEmail);
  const [adminEmails, setAdminEmails] = useState(props.adminEmails);
  const [logoUrl, setLogoUrl] = useState(props.logoUrl);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function upsert(key: string, value: Record<string, unknown>, isPublic = true) {
    const supabase = createClient();
    const { error } = await supabase
      .from("coach_settings")
      .upsert({ key, value, is_public: isPublic, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
  }

  async function saveGeneral(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await upsert("site_name", { text: siteName });
      await upsert("contact_email", { text: contactEmail });
      await upsert(
        "admin_emails",
        {
          emails: adminEmails
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean),
        },
        false
      );
      setMessage({ kind: "ok", text: "✓ Settings saved." });
      router.refresh();
    } catch (err) {
      setMessage({ kind: "err", text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "png";
      const path = `logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("coach-branding")
        .upload(path, file, { upsert: true });
      if (upErr) throw new Error(upErr.message);

      const { data } = supabase.storage.from("coach-branding").getPublicUrl(path);
      await upsert("logo_url", { url: data.publicUrl });
      setLogoUrl(data.publicUrl);
      setMessage({ kind: "ok", text: "✓ New logo is live across the site." });
      router.refresh();
    } catch (err) {
      setMessage({ kind: "err", text: (err as Error).message });
    } finally {
      setUploading(false);
    }
  }

  async function resetLogo() {
    setMessage(null);
    try {
      await upsert("logo_url", { url: null });
      setLogoUrl(null);
      setMessage({ kind: "ok", text: "✓ Reverted to the default logo." });
      router.refresh();
    } catch (err) {
      setMessage({ kind: "err", text: (err as Error).message });
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <header>
        <h1 className="text-3xl font-bold">⚙️ Site settings</h1>
        <p className="mt-2 text-mist/60">
          Branding, contact details and the team shown on the homepage.
        </p>
      </header>

      {message && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.kind === "ok"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : "border-red-400/30 bg-red-400/10 text-red-200"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* ---- logo ---- */}
      <section className="glass max-w-2xl rounded-3xl p-6 sm:p-8">
        <h2 className="text-lg font-bold">🎨 Logo</h2>
        <p className="mt-1 text-sm text-mist/55">
          Upload a new logo (SVG or PNG recommended) — it replaces the default
          everywhere instantly. Don&apos;t like it? Reset any time.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-6">
          <div className="glass-deep rounded-2xl p-4">
            <img src={logoUrl || site.logo} alt="Current logo" className="h-12 w-auto" />
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="btn-liquid cursor-pointer px-5 py-2.5 text-sm">
              {uploading ? "Uploading…" : "Upload new logo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadLogo(f);
                  e.target.value = "";
                }}
              />
            </label>
            {logoUrl && (
              <button onClick={resetLogo} className="btn-ghost px-5 py-2.5 text-sm">
                Reset to default
              </button>
            )}
          </div>
        </div>
        <p className="mt-4 text-xs text-mist/40">
          Developers: the default logo lives at{" "}
          <code className="rounded bg-white/8 px-1.5 py-0.5">public/branding/logo.svg</code>{" "}
          — replacing that file also changes it site-wide.
        </p>
      </section>

      {/* ---- general ---- */}
      <form onSubmit={saveGeneral} className="glass max-w-2xl space-y-4 rounded-3xl p-6 sm:p-8">
        <h2 className="text-lg font-bold">🏷 General</h2>
        <div>
          <label className="label">Site name</label>
          <input
            className="field"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Contact email</label>
          <input
            type="email"
            className="field"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Admin emails (comma-separated)</label>
          <input
            className="field"
            placeholder="you@example.com, colleague@example.com"
            value={adminEmails}
            onChange={(e) => setAdminEmails(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-mist/45">
            Anyone registering with one of these emails automatically becomes an
            admin.
          </p>
        </div>
        <button type="submit" disabled={saving} className="btn-liquid px-8 py-2.5 text-sm">
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>

      <PricingEditor eventTypes={props.eventTypes} />

      <ConsultantEditor consultants={props.consultants} />
    </div>
  );
}

/* ---------------- session pricing ---------------- */

function PricingEditor({ eventTypes }: { eventTypes: EventType[] }) {
  const router = useRouter();
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(
      eventTypes.map((t) => [t.id, t.price_gbp != null ? String(t.price_gbp) : ""])
    )
  );
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const supabase = createClient();

    for (const t of eventTypes) {
      const raw = prices[t.id]?.trim() ?? "";
      const value = raw === "" ? null : Number(raw);
      if (value != null && (isNaN(value) || value < 0)) {
        setMessage({ kind: "err", text: `"${t.name}": enter a valid price (or leave empty for free).` });
        setSaving(false);
        return;
      }
      const { error } = await supabase
        .from("coach_event_types")
        .update({ price_gbp: value })
        .eq("id", t.id);
      if (error) {
        setMessage({ kind: "err", text: error.message });
        setSaving(false);
        return;
      }
    }
    setMessage({ kind: "ok", text: "✓ Prices saved. New bookings use them immediately." });
    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="glass max-w-2xl space-y-4 rounded-3xl p-6 sm:p-8">
      <h2 className="text-lg font-bold">💳 Session pricing</h2>
      <p className="text-sm text-mist/55">
        Price in GBP per participant. Leave empty (or 0) to make a session type
        free — free sessions skip Stripe checkout and are confirmed manually.
      </p>
      {message && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.kind === "ok"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : "border-red-400/30 bg-red-400/10 text-red-200"
          }`}
        >
          {message.text}
        </p>
      )}
      <div className="space-y-3">
        {eventTypes.map((t) => (
          <div key={t.id} className="flex items-center gap-4">
            <span
              className="chip shrink-0"
              style={{
                borderColor: `${t.color}55`,
                background: `${t.color}18`,
                color: t.color ?? undefined,
              }}
            >
              {t.name}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-mist/50">£</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="field w-28 text-right"
                placeholder="free"
                value={prices[t.id] ?? ""}
                onChange={(e) =>
                  setPrices((p) => ({ ...p, [t.id]: e.target.value }))
                }
              />
            </div>
          </div>
        ))}
      </div>
      <button type="submit" disabled={saving} className="btn-liquid px-8 py-2.5 text-sm">
        {saving ? "Saving…" : "Save prices"}
      </button>
    </form>
  );
}

/* ---------------- consultants (homepage team) ---------------- */

const emptyConsultant = {
  name: "",
  title: "",
  specialty: "",
  bio: "",
  photo_url: "",
};

function ConsultantEditor({ consultants }: { consultants: Consultant[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Consultant | null>(null);
  const [form, setForm] = useState(emptyConsultant);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function openCreate() {
    setForm(emptyConsultant);
    setEditing(null);
    setOpen(true);
  }

  function openEdit(c: Consultant) {
    setForm({
      name: c.name,
      title: c.title ?? "",
      specialty: c.specialty ?? "",
      bio: c.bio ?? "",
      photo_url: c.photo_url ?? "",
    });
    setEditing(c);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const payload = {
      name: form.name,
      title: form.title || null,
      specialty: form.specialty || null,
      bio: form.bio || null,
      photo_url: form.photo_url || null,
    };
    const supabase = createClient();
    const { error } = editing
      ? await supabase.from("coach_consultants").update(payload).eq("id", editing.id)
      : await supabase
          .from("coach_consultants")
          .insert({ ...payload, sort_order: consultants.length + 1 });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function remove(c: Consultant) {
    if (!window.confirm(`Remove ${c.name} from the team section?`)) return;
    const supabase = createClient();
    await supabase.from("coach_consultants").delete().eq("id", c.id);
    router.refresh();
  }

  return (
    <section className="glass max-w-2xl rounded-3xl p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">🩺 Consultants on the homepage</h2>
        <button onClick={openCreate} className="btn-ghost px-4 py-2 text-xs">
          + Add
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {consultants.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold">{c.name}</p>
              <p className="truncate text-xs text-mist/50">{c.title}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(c)} className="btn-ghost px-3 py-1 text-xs">
                Edit
              </button>
              <button onClick={() => remove(c)} className="btn-danger px-3 py-1 text-xs">
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="glass-deep max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl p-6 sm:p-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editing ? "Edit consultant" : "Add consultant"}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="btn-ghost h-9 w-9 text-sm"
              >
                ✕
              </button>
            </div>
            {error && (
              <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}
            <div>
              <label className="label">Name</label>
              <input
                className="field"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Title</label>
                <input
                  className="field"
                  placeholder="Consultant in…"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Specialty</label>
                <input
                  className="field"
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Photo URL (optional)</label>
              <input
                type="url"
                className="field"
                value={form.photo_url}
                onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Short bio</label>
              <textarea
                rows={3}
                className="field resize-none"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-liquid w-full py-3 text-sm">
              {loading ? "Saving…" : "Save"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

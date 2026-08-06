"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    specialty: profile.specialty ?? "",
    gmc_number: profile.gmc_number ?? "",
    portfolio_url: profile.portfolio_url ?? "",
    portfolio_note: profile.portfolio_note ?? "",
    target_submission_date: profile.target_submission_date ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("coach_profiles")
      .update({
        ...form,
        // a blank date must clear the column, not fail as an empty string
        target_submission_date: form.target_submission_date || null,
        portfolio_url: form.portfolio_url.trim() || null,
        portfolio_note: form.portfolio_note.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="glass max-w-2xl space-y-4 rounded-3xl p-6 sm:p-8">
      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          ✓ Profile saved.
        </p>
      )}

      <div>
        <label className="label">Email</label>
        <input className="field opacity-60" value={profile.email} disabled />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="full_name">Full name</label>
          <input
            id="full_name"
            className="field"
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input
            id="phone"
            className="field"
            placeholder="+44…"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="specialty">Specialty</label>
          <input
            id="specialty"
            className="field"
            placeholder="e.g. Emergency Medicine"
            value={form.specialty}
            onChange={(e) => set("specialty", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="gmc">GMC number</label>
          <input
            id="gmc"
            className="field"
            placeholder="1234567"
            value={form.gmc_number}
            onChange={(e) => set("gmc_number", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-white/10 pt-5">
        <div>
          <h2 className="font-bold">📁 Your portfolio</h2>
          <p className="mt-1 text-sm text-mist/55">
            Share a link to your portfolio so your reviewer can read it before
            your sessions. Make sure link-sharing is switched on — in Google
            Drive use <em>Share → Anyone with the link → Viewer</em>.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="portfolio_url">
            Portfolio link (Google Drive, OneDrive, Dropbox…)
          </label>
          <input
            id="portfolio_url"
            type="url"
            className="field"
            placeholder="https://drive.google.com/…"
            value={form.portfolio_url}
            onChange={(e) => set("portfolio_url", e.target.value)}
          />
          {profile.portfolio_url && (
            <a
              href={profile.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-block text-xs font-semibold text-cyan-300 hover:underline"
            >
              ↗ Open my saved link — check it opens for someone else too
            </a>
          )}
        </div>

        <div>
          <label className="label" htmlFor="portfolio_note">
            Anything your reviewer should know? (optional)
          </label>
          <textarea
            id="portfolio_note"
            rows={2}
            className="field resize-none"
            placeholder="e.g. Domain 3 evidence is still being collected; folder 2 has my logbooks."
            value={form.portfolio_note}
            onChange={(e) => set("portfolio_note", e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="target_submission_date">
            🎯 Date you plan to submit to the GMC
          </label>
          <input
            id="target_submission_date"
            type="date"
            className="field sm:max-w-xs"
            value={form.target_submission_date}
            onChange={(e) => set("target_submission_date", e.target.value)}
          />
          <p className="mt-1.5 text-xs text-mist/45">
            Set your own target — it appears on your dashboard and helps your
            reviewer pace your plan. You can change it any time.
          </p>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-liquid px-8 py-2.5 text-sm">
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

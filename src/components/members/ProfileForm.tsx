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
      .update({ ...form, updated_at: new Date().toISOString() })
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

      <button type="submit" disabled={loading} className="btn-liquid px-8 py-2.5 text-sm">
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

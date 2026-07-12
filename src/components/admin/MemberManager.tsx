"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function MemberManager({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const visible = profiles.filter((p) => {
    const q = query.toLowerCase();
    return (
      !q ||
      p.email.toLowerCase().includes(q) ||
      (p.full_name ?? "").toLowerCase().includes(q) ||
      (p.specialty ?? "").toLowerCase().includes(q)
    );
  });

  async function setRole(p: Profile, role: Profile["role"]) {
    const label = role === "admin" ? "grant ADMIN access to" : "remove admin access from";
    if (!window.confirm(`Are you sure you want to ${label} ${p.full_name || p.email}?`))
      return;
    setBusy(p.id);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("coach_profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", p.id);
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-3xl font-bold">👥 Members</h1>
        <p className="mt-2 text-mist/60">
          {profiles.length} registered member{profiles.length === 1 ? "" : "s"}.
          Grant admin access to fellow consultants.
        </p>
      </header>

      <input
        className="field max-w-md"
        placeholder="🔍 Search by name, email or specialty…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {visible.map((p) => (
          <div key={p.id} className="glass flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/25 to-violet-400/25 text-sm font-bold ring-1 ring-white/15">
              {(p.full_name || p.email).slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {p.full_name || "—"}
                {p.id === currentUserId && (
                  <span className="ml-2 text-xs font-normal text-cyan-300">(you)</span>
                )}
              </p>
              <p className="truncate text-xs text-mist/50">
                {p.email}
                {p.specialty ? ` · ${p.specialty}` : ""}
                {p.gmc_number ? ` · GMC ${p.gmc_number}` : ""} · joined{" "}
                {formatDate(p.created_at)}
              </p>
            </div>
            <span
              className={`chip ${
                p.role === "admin"
                  ? "border-violet-400/30 bg-violet-400/10 text-violet-200"
                  : "border-white/15 bg-white/5 text-mist/55"
              }`}
            >
              {p.role === "admin" ? "🛡 Admin" : "Member"}
            </span>
            {p.id !== currentUserId &&
              (p.role === "member" ? (
                <button
                  onClick={() => setRole(p, "admin")}
                  disabled={busy === p.id}
                  className="btn-ghost px-4 py-1.5 text-xs"
                >
                  Make admin
                </button>
              ) : (
                <button
                  onClick={() => setRole(p, "member")}
                  disabled={busy === p.id}
                  className="btn-danger px-4 py-1.5 text-xs"
                >
                  Revoke admin
                </button>
              ))}
          </div>
        ))}
        {visible.length === 0 && (
          <p className="glass rounded-3xl px-6 py-12 text-center text-sm text-mist/50">
            No members match your search.
          </p>
        )}
      </div>
    </div>
  );
}

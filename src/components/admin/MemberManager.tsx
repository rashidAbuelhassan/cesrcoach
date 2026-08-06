"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Booking, Profile } from "@/lib/types";
import { daysUntil, formatDate, formatDateTime } from "@/lib/utils";

export default function MemberManager({
  profiles,
  bookings,
  currentUserId,
}: {
  profiles: Profile[];
  bookings: Booking[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Profile | null>(null);

  const bookingsByUser = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const b of bookings) {
      const list = m.get(b.user_id) ?? [];
      list.push(b);
      m.set(b.user_id, list);
    }
    return m;
  }, [bookings]);

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
        <h1 className="text-3xl font-bold">👥 Candidates</h1>
        <p className="mt-2 text-mist/60">
          {profiles.length} registered candidate{profiles.length === 1 ? "" : "s"}.
          Open a candidate to see their portfolio link, target submission date
          and session history — and to leave feedback they can read.
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
        {visible.map((p) => {
          const theirBookings = bookingsByUser.get(p.id) ?? [];
          const active = theirBookings.filter(
            (b) => b.status === "pending" || b.status === "confirmed"
          ).length;
          return (
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
                  {theirBookings.length
                    ? ` · ${theirBookings.length} booking${theirBookings.length > 1 ? "s" : ""}`
                    : ""}
                  {active ? ` (${active} active)` : ""}
                </p>
              </div>

              {p.portfolio_url && (
                <span className="chip border-cyan-400/25 bg-cyan-400/10 text-cyan-200">
                  📁 Portfolio
                </span>
              )}
              {p.target_submission_date && (
                <span className="chip">🎯 {formatDate(p.target_submission_date)}</span>
              )}
              <span
                className={`chip ${
                  p.role === "admin"
                    ? "border-violet-400/30 bg-violet-400/10 text-violet-200"
                    : "border-white/15 bg-white/5 text-mist/55"
                }`}
              >
                {p.role === "admin" ? "🛡 Admin" : "Member"}
              </span>

              <div className="flex shrink-0 gap-2">
                <button onClick={() => setViewing(p)} className="btn-liquid px-4 py-1.5 text-xs">
                  View profile
                </button>
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
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="glass rounded-3xl px-6 py-12 text-center text-sm text-mist/50">
            No candidates match your search.
          </p>
        )}
      </div>

      {viewing && (
        <CandidateModal
          profile={viewing}
          bookings={bookingsByUser.get(viewing.id) ?? []}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}

/* ---------------- candidate detail ---------------- */

function CandidateModal({
  profile,
  bookings,
  onClose,
}: {
  profile: Profile;
  bookings: Booking[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(bookings.map((b) => [b.id, b.reviewer_feedback ?? ""]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const target = profile.target_submission_date
    ? daysUntil(profile.target_submission_date)
    : null;

  async function saveFeedback(booking: Booking) {
    setSaving(booking.id);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("coach_bookings")
      .update({
        reviewer_feedback: drafts[booking.id]?.trim() || null,
        feedback_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id);
    setSaving(null);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(booking.id);
    window.setTimeout(() => setSaved(null), 2000);
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-deep max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-bold">{profile.full_name || "—"}</h3>
            <p className="truncate text-sm text-mist/55">{profile.email}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="btn-ghost h-9 w-9 shrink-0 text-sm">
            ✕
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {/* details */}
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <Detail label="Specialty" value={profile.specialty} />
          <Detail label="GMC number" value={profile.gmc_number} />
          <Detail label="Phone" value={profile.phone} />
          <Detail label="Joined" value={formatDate(profile.created_at)} />
        </dl>

        {/* portfolio */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-4">
          <p className="text-sm font-semibold">📁 Portfolio</p>
          {profile.portfolio_url ? (
            <a
              href={profile.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block break-all text-sm font-semibold text-cyan-300 hover:underline"
            >
              {profile.portfolio_url} ↗
            </a>
          ) : (
            <p className="mt-2 text-sm text-mist/50">
              This candidate hasn&apos;t shared a portfolio link yet.
            </p>
          )}
          {profile.portfolio_note && (
            <p className="mt-2 border-t border-white/10 pt-2 text-xs text-mist/60">
              📝 {profile.portfolio_note}
            </p>
          )}
        </section>

        {/* target date */}
        <section className="mt-3 rounded-2xl border border-white/10 bg-white/4 p-4">
          <p className="text-sm font-semibold">🎯 Planned GMC submission</p>
          {profile.target_submission_date ? (
            <p className="mt-2 text-sm">
              <strong>{formatDate(profile.target_submission_date)}</strong>
              <span className="ml-2 text-mist/55">
                {target === null
                  ? ""
                  : target > 0
                    ? `(${target} days away)`
                    : target === 0
                      ? "(today)"
                      : `(${Math.abs(target)} days ago)`}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-mist/50">
              No target date set by the candidate.
            </p>
          )}
        </section>

        {/* sessions + feedback */}
        <section className="mt-6">
          <p className="text-sm font-semibold">
            🩺 Sessions &amp; feedback
            <span className="ml-2 font-normal text-xs text-mist/45">
              comments here are visible to the candidate
            </span>
          </p>

          {bookings.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-white/15 px-6 py-6 text-center text-sm text-mist/50">
              No bookings yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-4">
              {bookings.map((b) => (
                <li key={b.id} className="rounded-2xl border border-white/10 bg-white/4 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {b.coach_events?.title ?? "Session"}
                      </p>
                      <p className="text-xs text-mist/50">
                        {b.coach_events ? formatDateTime(b.coach_events.starts_at) : ""}
                      </p>
                    </div>
                    <span className="chip capitalize">{b.status}</span>
                  </div>

                  {b.portfolio_url && (
                    <p className="mt-2 truncate text-xs">
                      <span className="text-mist/45">Portfolio for this session: </span>
                      <a
                        href={b.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-300 hover:underline"
                      >
                        {b.portfolio_url}
                      </a>
                    </p>
                  )}
                  {b.notes && (
                    <p className="mt-1 text-xs text-mist/60">
                      <span className="text-mist/45">Their note: </span>
                      {b.notes}
                    </p>
                  )}

                  <label className="label mt-3">Feedback for the candidate</label>
                  <textarea
                    rows={3}
                    className="field resize-none text-sm"
                    placeholder="What went well, what to strengthen, and the next steps before submission…"
                    value={drafts[b.id] ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [b.id]: e.target.value }))
                    }
                  />
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => saveFeedback(b)}
                      disabled={saving === b.id}
                      className="btn-liquid px-5 py-2 text-xs"
                    >
                      {saving === b.id ? "Saving…" : "Save feedback"}
                    </button>
                    {saved === b.id && (
                      <span className="text-xs text-emerald-300">
                        ✓ Saved — the candidate can see this now
                      </span>
                    )}
                    {b.feedback_updated_at && saved !== b.id && (
                      <span className="text-xs text-mist/45">
                        Last updated {formatDate(b.feedback_updated_at)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/4 px-4 py-3">
      <dt className="text-xs text-mist/45">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

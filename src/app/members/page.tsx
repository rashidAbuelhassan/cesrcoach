import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { daysUntil, formatDate, formatDateTime } from "@/lib/utils";
import { companion } from "@/config/site";
import type { Booking, Profile } from "@/lib/types";

export default async function MemberDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profileRow }, { data: bookings }, videosCount, docsCount] =
    await Promise.all([
      supabase.from("coach_profiles").select("*").eq("id", user!.id).single(),
      supabase
        .from("coach_bookings")
        .select("*, coach_events(*, coach_event_types(*))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("coach_videos")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
      supabase
        .from("coach_documents")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
    ]);

  const profile = profileRow as Profile | null;
  const all = (bookings as Booking[]) ?? [];

  const upcoming = all
    .filter(
      (b) =>
        (b.status === "pending" || b.status === "confirmed") &&
        b.coach_events &&
        new Date(b.coach_events.starts_at) > new Date() &&
        b.coach_events.status === "scheduled"
    )
    .sort(
      (a, b) =>
        new Date(a.coach_events!.starts_at).getTime() -
        new Date(b.coach_events!.starts_at).getTime()
    );

  // sessions the reviewer has written feedback on, or that are done
  const reviewed = all
    .filter((b) => b.reviewer_feedback || b.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.coach_events?.starts_at ?? b.created_at).getTime() -
        new Date(a.coach_events?.starts_at ?? a.created_at).getTime()
    );

  const firstName =
    profile?.full_name?.split(" ").filter(Boolean)[0] ?? "Doctor";
  const daysToSubmission = profile?.target_submission_date
    ? daysUntil(profile.target_submission_date)
    : null;

  return (
    <div className="space-y-8 pb-8">
      <header>
        <h1 className="text-3xl font-bold">
          Welcome back, <span className="text-aurora">{firstName}</span> 👋
        </h1>
        <p className="mt-2 text-mist/60">
          Your coaching hub — track your portfolio, your target date and your
          reviewer&apos;s feedback in one place.
        </p>
      </header>

      {/* ---- progress row ---- */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* portfolio */}
        <section className="glass rounded-3xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-mist/70">📁 Your portfolio</p>
              {profile?.portfolio_url ? (
                <>
                  <a
                    href={profile.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block truncate text-sm font-semibold text-cyan-300 hover:underline"
                  >
                    {profile.portfolio_url}
                  </a>
                  <p className="mt-1 text-xs text-emerald-300">
                    ✓ Shared with your reviewer
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-mist/55">
                  Not shared yet. Add a Google Drive (or OneDrive/Dropbox) link
                  so your reviewer can read your portfolio before your session.
                </p>
              )}
            </div>
            <Link href="/members/profile" className="btn-ghost shrink-0 px-4 py-2 text-xs">
              {profile?.portfolio_url ? "Update" : "Add link"}
            </Link>
          </div>
          {profile?.portfolio_note && (
            <p className="mt-3 border-t border-white/10 pt-3 text-xs text-mist/55">
              📝 {profile.portfolio_note}
            </p>
          )}
        </section>

        {/* target submission date */}
        <section className="glass rounded-3xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-mist/70">
                🎯 Planned GMC submission
              </p>
              {profile?.target_submission_date ? (
                <>
                  <p className="mt-2 text-2xl font-bold">
                    {formatDate(profile.target_submission_date)}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      daysToSubmission !== null && daysToSubmission < 0
                        ? "text-amber-300"
                        : "text-mist/55"
                    }`}
                  >
                    {daysToSubmission === null
                      ? ""
                      : daysToSubmission > 0
                        ? `${daysToSubmission} days to go`
                        : daysToSubmission === 0
                          ? "That's today — good luck!"
                          : `${Math.abs(daysToSubmission)} days ago — update your target if plans changed`}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-mist/55">
                  No target date set. Choosing one helps you and your reviewer
                  pace the work.
                </p>
              )}
            </div>
            <Link href="/members/profile" className="btn-ghost shrink-0 px-4 py-2 text-xs">
              {profile?.target_submission_date ? "Change" : "Set date"}
            </Link>
          </div>
        </section>
      </div>

      {/* ---- library shortcuts ---- */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/members/videos" className="glass glass-hover rounded-3xl p-6">
          <span className="text-3xl">🎬</span>
          <p className="mt-3 text-2xl font-bold">{videosCount.count ?? 0}</p>
          <p className="text-sm text-mist/60">video presentations</p>
        </Link>
        <Link href="/members/documents" className="glass glass-hover rounded-3xl p-6">
          <span className="text-3xl">📄</span>
          <p className="mt-3 text-2xl font-bold">{docsCount.count ?? 0}</p>
          <p className="text-sm text-mist/60">documents to read</p>
        </Link>
        <Link href="/members/bookings" className="glass glass-hover rounded-3xl p-6">
          <span className="text-3xl">📅</span>
          <p className="mt-3 text-2xl font-bold">{upcoming.length}</p>
          <p className="text-sm text-mist/60">upcoming sessions</p>
        </Link>
      </div>

      {/* ---- upcoming sessions ---- */}
      <section className="glass rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">Your upcoming sessions</h2>
          <Link href="/members/bookings" className="btn-ghost px-4 py-2 text-xs">
            Book a session
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-white/15 px-6 py-8 text-center text-sm text-mist/50">
            No sessions booked yet. Head to{" "}
            <Link href="/members/bookings" className="text-cyan-300 hover:underline">
              Bookings
            </Link>{" "}
            to reserve your place.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {upcoming.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/4 px-5 py-4"
              >
                <div>
                  <p className="font-semibold">{b.coach_events!.title}</p>
                  <p className="text-sm text-mist/55">
                    {formatDateTime(b.coach_events!.starts_at)} ·{" "}
                    {b.coach_events!.location}
                  </p>
                </div>
                <span
                  className={`chip ${
                    b.status === "confirmed"
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                      : "border-amber-400/30 bg-amber-400/10 text-amber-200"
                  }`}
                >
                  {b.status === "confirmed" ? "✓ Confirmed" : "⏳ Pending"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- reviewer feedback ---- */}
      <section className="glass rounded-3xl p-6 sm:p-8">
        <h2 className="text-lg font-bold">🩺 Your clinic feedback</h2>
        {reviewed.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-white/15 px-6 py-8 text-center text-sm text-mist/50">
            Feedback from your reviewer will appear here after your sessions.
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {reviewed.map((b) => (
              <li
                key={b.id}
                className="rounded-2xl border border-white/10 bg-white/4 px-5 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {b.coach_events?.title ?? "Session"}
                    </p>
                    <p className="text-xs text-mist/50">
                      {b.coach_events
                        ? formatDateTime(b.coach_events.starts_at)
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`chip ${
                      b.status === "completed"
                        ? "border-sky-400/30 bg-sky-400/10 text-sky-200"
                        : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                    }`}
                  >
                    {b.status === "completed" ? "✓ Session completed" : b.status}
                  </span>
                </div>

                {b.reviewer_feedback ? (
                  <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/8 px-4 py-3">
                    <p className="text-xs font-semibold text-cyan-200">
                      Reviewer&apos;s comments
                      {b.feedback_updated_at
                        ? ` · ${formatDate(b.feedback_updated_at)}`
                        : ""}
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-mist/80">
                      {b.reviewer_feedback}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-mist/45">
                    Your reviewer hasn&apos;t added written comments for this
                    session yet.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- companion app ---- */}
      <section className="glass glass-hover relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/15 blur-[70px]" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <span className="chip border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
              🧭 Companion app
            </span>
            <h2 className="mt-3 text-lg font-bold">{companion.name}</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-mist/60">
              {companion.blurb}
            </p>
          </div>
          <a
            href={companion.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-liquid shrink-0 px-6 py-3 text-sm"
          >
            Open {companion.name} ↗
          </a>
        </div>
      </section>

      <section className="glass rounded-3xl p-6 sm:p-8">
        <h2 className="text-lg font-bold">📁 Portfolio Clinic reminder</h2>
        <p className="mt-3 text-sm leading-relaxed text-mist/60">
          If you book a <strong>Portfolio Clinic</strong>, remember to share
          access to your portfolio at least{" "}
          <strong className="text-amber-300">3 weeks before</strong> your
          session. Your reviewer studies it in advance so your time together is
          spent on feedback, not reading.
        </p>
      </section>
    </div>
  );
}

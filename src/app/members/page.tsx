import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import type { Booking } from "@/lib/types";

export default async function MemberDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: bookings }, videosCount, docsCount] =
    await Promise.all([
      supabase.from("coach_profiles").select("*").eq("id", user!.id).single(),
      supabase
        .from("coach_bookings")
        .select("*, coach_events(*, coach_event_types(*))")
        .eq("user_id", user!.id)
        .in("status", ["pending", "confirmed"])
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

  const upcoming = ((bookings as Booking[]) ?? [])
    .filter(
      (b) =>
        b.coach_events &&
        new Date(b.coach_events.starts_at) > new Date() &&
        b.coach_events.status === "scheduled"
    )
    .sort(
      (a, b) =>
        new Date(a.coach_events!.starts_at).getTime() -
        new Date(b.coach_events!.starts_at).getTime()
    );

  const firstName =
    profile?.full_name?.split(" ").filter(Boolean)[0] ?? "Doctor";

  return (
    <div className="space-y-8 pb-8">
      <header>
        <h1 className="text-3xl font-bold">
          Welcome back, <span className="text-aurora">{firstName}</span> 👋
        </h1>
        <p className="mt-2 text-mist/60">
          Your coaching hub — presentations, resources and session bookings in
          one place.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/members/videos" className="glass glass-hover rounded-3xl p-6">
          <span className="text-3xl">🎬</span>
          <p className="mt-3 text-2xl font-bold">{videosCount.count ?? 0}</p>
          <p className="text-sm text-mist/60">video presentations</p>
        </Link>
        <Link href="/members/documents" className="glass glass-hover rounded-3xl p-6">
          <span className="text-3xl">📄</span>
          <p className="mt-3 text-2xl font-bold">{docsCount.count ?? 0}</p>
          <p className="text-sm text-mist/60">documents to download</p>
        </Link>
        <Link href="/members/bookings" className="glass glass-hover rounded-3xl p-6">
          <span className="text-3xl">📅</span>
          <p className="mt-3 text-2xl font-bold">{upcoming.length}</p>
          <p className="text-sm text-mist/60">upcoming sessions</p>
        </Link>
      </div>

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

      <section className="glass rounded-3xl p-6 sm:p-8">
        <h2 className="text-lg font-bold">📁 Portfolio Clinic reminder</h2>
        <p className="mt-3 text-sm leading-relaxed text-mist/60">
          If you book a <strong>Portfolio Clinic</strong>, remember to upload
          or share access to your portfolio at least{" "}
          <strong className="text-amber-300">3 weeks before</strong> your
          session. Your reviewer studies it in advance so your 30 minutes are
          spent on feedback, not reading.
        </p>
      </section>
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import type { Booking } from "@/lib/types";

export default async function AdminOverview() {
  const supabase = await createClient();

  const [members, events, pendingBookings, videos, docs, recent] =
    await Promise.all([
      supabase.from("coach_profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("coach_events")
        .select("id", { count: "exact", head: true })
        .eq("status", "scheduled")
        .gte("starts_at", new Date().toISOString()),
      supabase
        .from("coach_bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("coach_videos").select("id", { count: "exact", head: true }),
      supabase.from("coach_documents").select("id", { count: "exact", head: true }),
      supabase
        .from("coach_bookings")
        .select("*, coach_profiles(full_name, email), coach_events(title, starts_at)")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const stats = [
    { label: "Members", value: members.count ?? 0, href: "/admin/members", icon: "👥" },
    { label: "Upcoming sessions", value: events.count ?? 0, href: "/admin/events", icon: "🗓" },
    { label: "Pending bookings", value: pendingBookings.count ?? 0, href: "/admin/bookings", icon: "⏳" },
    { label: "Videos", value: videos.count ?? 0, href: "/admin/videos", icon: "🎬" },
    { label: "Documents", value: docs.count ?? 0, href: "/admin/documents", icon: "📄" },
  ];

  return (
    <div className="space-y-8 pb-8">
      <header>
        <h1 className="text-3xl font-bold">Admin overview</h1>
        <p className="mt-2 text-mist/60">
          Everything on the site — sessions, bookings, content and members — is
          managed from here.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="glass glass-hover rounded-3xl p-5">
            <span className="text-2xl">{s.icon}</span>
            <p className="mt-2 text-3xl font-bold">{s.value}</p>
            <p className="text-xs text-mist/55">{s.label}</p>
          </Link>
        ))}
      </div>

      <section className="glass rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">Latest bookings</h2>
          <Link href="/admin/bookings" className="btn-ghost px-4 py-2 text-xs">
            Manage all
          </Link>
        </div>
        {((recent.data as Booking[]) ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-mist/50">No bookings yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/8">
            {(recent.data as Booking[]).map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {b.coach_profiles?.full_name || b.coach_profiles?.email}
                  </p>
                  <p className="truncate text-xs text-mist/50">
                    {b.coach_events?.title} ·{" "}
                    {b.coach_events ? formatDateTime(b.coach_events.starts_at) : ""}
                  </p>
                </div>
                <span
                  className={`chip ${
                    b.status === "pending"
                      ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                      : b.status === "confirmed"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                        : "border-white/15 bg-white/5 text-mist/50"
                  }`}
                >
                  {b.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

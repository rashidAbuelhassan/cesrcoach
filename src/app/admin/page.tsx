import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import VisitorStats from "@/components/admin/VisitorStats";
import type { Booking, VisitSummary } from "@/lib/types";

export default async function AdminOverview() {
  const supabase = await createClient();

  const [members, events, pendingBookings, videos, docs, recent, newEnquiries, visitsRes] =
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
      supabase
        .from("coach_enquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
      supabase.rpc("coach_visit_summary"),
    ]);

  const visitSummary = visitsRes.error ? null : (visitsRes.data as VisitSummary);

  const stats = [
    { label: "Members", value: members.count ?? 0, href: "/admin/members", icon: "👥" },
    { label: "Upcoming sessions", value: events.count ?? 0, href: "/admin/events", icon: "🗓" },
    { label: "Pending bookings", value: pendingBookings.count ?? 0, href: "/admin/bookings", icon: "⏳" },
    { label: "New enquiries", value: newEnquiries.count ?? 0, href: "/admin/enquiries", icon: "💬" },
    { label: "Videos", value: videos.count ?? 0, href: "/admin/videos", icon: "🎬" },
    { label: "Documents", value: docs.count ?? 0, href: "/admin/documents", icon: "📄" },
  ];

  return (
    <div className="space-y-8 pb-8">
      <header>
        <h1 className="text-3xl font-bold">Admin overview</h1>
        <p className="mt-2 text-mist/77">
          Everything on the site — sessions, bookings, content and members — is
          managed from here.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="glass glass-hover rounded-3xl p-5">
            <span className="text-2xl">{s.icon}</span>
            <p className="mt-2 text-3xl font-bold">{s.value}</p>
            <p className="text-xs text-mist/73">{s.label}</p>
          </Link>
        ))}
      </div>

      <VisitorStats summary={visitSummary} />

      <section className="glass rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">Latest bookings</h2>
          <Link href="/admin/bookings" className="btn-ghost px-4 py-2 text-xs">
            Manage all
          </Link>
        </div>
        {((recent.data as Booking[]) ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-mist/70">No bookings yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/8">
            {(recent.data as Booking[]).map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {b.coach_profiles?.full_name || b.coach_profiles?.email}
                  </p>
                  <p className="truncate text-xs text-mist/70">
                    {b.coach_events?.title} ·{" "}
                    {b.coach_events ? formatDateTime(b.coach_events.starts_at) : ""}
                  </p>
                </div>
                <span
                  className={`chip ${
                    b.status === "pending"
                      ? "border-neutral-400/30 bg-neutral-400/10 text-neutral-200"
                      : b.status === "confirmed"
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/15 bg-white/5 text-mist/70"
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

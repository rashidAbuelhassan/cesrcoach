import type { VisitSummary } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const PAGE_NAMES: Record<string, string> = {
  "/": "Homepage",
  "/contact": "Contact form",
  "/register": "Register",
  "/login": "Sign in",
  "/members": "Member dashboard",
  "/members/bookings": "Bookings",
  "/members/videos": "Videos",
  "/members/documents": "Documents",
  "/members/profile": "Profile",
};

const nf = new Intl.NumberFormat("en-GB");

function shortDate(day: string) {
  return new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function Tile({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-black/15 p-4">
      <p className="text-3xl font-bold tabular-nums">{nf.format(value)}</p>
      <p className="mt-1 text-sm font-semibold">{label}</p>
      {note && <p className="mt-0.5 text-xs text-mist/80">{note}</p>}
    </div>
  );
}

export default function VisitorStats({ summary }: { summary: VisitSummary | null }) {
  if (!summary) {
    return (
      <section className="glass rounded-3xl p-6 sm:p-8">
        <h2 className="text-lg font-bold">👁 Visitors</h2>
        <p className="mt-3 text-sm text-mist/87">
          Visitor numbers aren&apos;t available right now. Refresh the page; if this
          keeps showing, the visit-counting setup in the database may be missing.
        </p>
      </section>
    );
  }

  const days = summary.daily;
  const max = Math.max(1, ...days.map((d) => d.visitors));
  const empty = summary.total_views === 0;
  const topViews = Math.max(1, ...summary.top_pages.map((p) => p.views));

  return (
    <section className="glass space-y-6 rounded-3xl p-6 sm:p-8" aria-labelledby="visitors-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="visitors-heading" className="text-lg font-bold">
          👁 Website visitors
        </h2>
        <p className="text-xs text-mist/84">
          {summary.since ? `Counting since ${formatDate(summary.since)}` : "Counting starts with the next visit"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Total visitors"
          value={summary.total_visitors}
          note={`${nf.format(summary.total_views)} page views`}
        />
        <Tile label="Today" value={summary.today} />
        <Tile label="Last 7 days" value={summary.last_7} />
        <Tile label="Last 30 days" value={summary.last_30} />
      </div>

      {empty ? (
        <p className="rounded-2xl border border-dashed border-white/25 px-6 py-8 text-center text-sm text-mist/90">
          No visits recorded yet. Counting has just started, so numbers will
          appear here as people open the site.
        </p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div>
            <p className="text-sm font-semibold">Visitors per day, last 30 days</p>
            <div
              className="mt-4 flex h-36 items-end gap-[3px] border-b border-white/25"
              role="img"
              aria-label={`Daily visitors over the last 30 days. Busiest day: ${max}.`}
            >
              {days.map((d, i) => {
                const isToday = i === days.length - 1;
                const pct = d.visitors === 0 ? 0 : Math.max(4, (d.visitors / max) * 100);
                return (
                  <div
                    key={d.day}
                    title={`${shortDate(d.day)}: ${d.visitors} visitor${d.visitors === 1 ? "" : "s"}, ${d.views} page view${d.views === 1 ? "" : "s"}`}
                    className="flex h-full min-w-0 flex-1 items-end"
                  >
                    <div
                      className={`w-full rounded-t-[3px] ${isToday ? "bg-white" : "bg-[#b9bcc2]/70"}`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-xs tabular-nums text-mist/84">
              <span>{shortDate(days[0].day)}</span>
              <span>peak {max}</span>
              <span>Today</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Most viewed pages, last 30 days</p>
            {summary.top_pages.length === 0 ? (
              <p className="mt-4 text-sm text-mist/84">Nothing in the last 30 days.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {summary.top_pages.map((p) => (
                  <li key={p.path}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-medium" title={p.path}>
                        {PAGE_NAMES[p.path] ?? p.path}
                      </span>
                      <span className="shrink-0 tabular-nums text-mist/90">{nf.format(p.views)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/12">
                      <div
                        className="h-full rounded-full bg-[#c4c7cc]"
                        style={{ width: `${(p.views / topViews) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <p className="border-t border-white/12 pt-4 text-xs leading-relaxed text-mist/84">
        Counted without cookies. Each visitor is an anonymous one-way code that
        changes every day, so someone who comes back on another day is counted
        again. Your own visits while signed in as admin, and search-engine
        robots, are not counted.
      </p>
    </section>
  );
}

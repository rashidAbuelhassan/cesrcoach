"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Booking, CoachEvent, EventType } from "@/lib/types";
import { daysUntil, formatDateTime, formatDuration } from "@/lib/utils";

interface Props {
  userId: string;
  eventTypes: EventType[];
  events: CoachEvent[];
  myBookings: Booking[];
  bookedCounts: Record<string, number>;
}

export default function BookingBoard({
  userId,
  eventTypes,
  events,
  myBookings,
  bookedCounts,
}: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [bookingEvent, setBookingEvent] = useState<CoachEvent | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const myActiveByEvent = useMemo(() => {
    const m = new Map<string, Booking>();
    for (const b of myBookings) {
      if (b.status === "pending" || b.status === "confirmed") m.set(b.event_id, b);
    }
    return m;
  }, [myBookings]);

  const visibleEvents =
    filter === "all"
      ? events
      : events.filter((e) => e.event_type_id === filter);

  async function cancelBooking(booking: Booking) {
    if (!window.confirm("Cancel this booking? Your place will be released.")) return;
    setCancelling(booking.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("coach_bookings")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", booking.id);
    setCancelling(null);
    if (error) {
      setMessage({ kind: "err", text: error.message });
      return;
    }
    setMessage({ kind: "ok", text: "Booking cancelled." });
    router.refresh();
  }

  return (
    <div className="space-y-10 pb-8">
      <header>
        <h1 className="text-3xl font-bold">📅 Book a session</h1>
        <p className="mt-2 text-mist/60">
          Choose from our three session formats and reserve your place.
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

      {/* ----- my bookings ----- */}
      <section className="glass rounded-3xl p-6 sm:p-8">
        <h2 className="text-lg font-bold">Your bookings</h2>
        {myBookings.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-white/15 px-6 py-6 text-center text-sm text-mist/50">
            You haven&apos;t booked anything yet — pick a session below. 👇
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {myBookings.map((b) => {
              const ev = b.coach_events;
              if (!ev) return null;
              const active = b.status === "pending" || b.status === "confirmed";
              const future = new Date(ev.starts_at) > new Date();
              return (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{ev.title}</p>
                    <p className="text-sm text-mist/55">
                      {formatDateTime(ev.starts_at)} · {ev.location}
                    </p>
                    {b.portfolio_url && (
                      <p className="mt-1 truncate text-xs text-cyan-300/80">
                        📁 Portfolio: {b.portfolio_url}
                      </p>
                    )}
                    {b.status === "confirmed" && ev.meeting_url && future && (
                      <a
                        href={ev.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs font-semibold text-emerald-300 hover:underline"
                      >
                        🔗 Join meeting link
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip status={b.status} />
                    {active && future && (
                      <button
                        onClick={() => cancelBooking(b)}
                        disabled={cancelling === b.id}
                        className="btn-danger px-4 py-1.5 text-xs"
                      >
                        {cancelling === b.id ? "…" : "Cancel"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ----- upcoming sessions ----- */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Upcoming sessions</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`chip cursor-pointer ${
                filter === "all"
                  ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                  : "hover:bg-white/12"
              }`}
            >
              All
            </button>
            {eventTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`chip cursor-pointer ${
                  filter === t.id
                    ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                    : "hover:bg-white/12"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {visibleEvents.length === 0 ? (
          <p className="glass mt-5 rounded-3xl px-6 py-12 text-center text-sm text-mist/50">
            No upcoming sessions in this category yet — check back soon or{" "}
            <a href="mailto:hello@cesrcoach.com" className="text-cyan-300 hover:underline">
              ask us to schedule one
            </a>
            .
          </p>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {visibleEvents.map((ev) => {
              const t = ev.coach_event_types;
              const booked = bookedCounts[ev.id] ?? 0;
              const left = Math.max(0, ev.capacity - booked);
              const mine = myActiveByEvent.get(ev.id);
              const lead = t?.requires_portfolio
                ? daysUntil(ev.starts_at) >= (t?.portfolio_lead_days ?? 21)
                : true;
              return (
                <div key={ev.id} className="glass glass-hover flex flex-col rounded-3xl p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="chip"
                      style={{
                        borderColor: `${t?.color}55`,
                        background: `${t?.color}18`,
                        color: t?.color ?? undefined,
                      }}
                    >
                      {t?.name}
                    </span>
                    <span
                      className={`chip ${
                        left === 0
                          ? "border-red-400/30 bg-red-400/10 text-red-200"
                          : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                      }`}
                    >
                      {left === 0
                        ? "Fully booked"
                        : t?.format === "one_to_one"
                          ? "Slot available"
                          : `${left} place${left > 1 ? "s" : ""} left`}
                    </span>
                  </div>
                  <h3 className="mt-4 font-bold leading-snug">{ev.title}</h3>
                  <p className="mt-1 text-sm text-mist/55">
                    🕐 {formatDateTime(ev.starts_at)}
                    {t ? ` · ${formatDuration(t.duration_minutes)}` : ""}
                  </p>
                  <p className="text-sm text-mist/55">📍 {ev.location}</p>
                  {ev.description && (
                    <p className="mt-2 text-sm text-mist/50">{ev.description}</p>
                  )}
                  {t?.requires_portfolio && (
                    <p
                      className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
                        lead
                          ? "border-amber-400/25 bg-amber-400/8 text-amber-200/90"
                          : "border-red-400/30 bg-red-400/10 text-red-200"
                      }`}
                    >
                      {lead
                        ? `📁 Portfolio access must be provided at booking — your reviewer needs it ${t.portfolio_lead_days} days (3 weeks) before the session.`
                        : `⚠️ This session starts in under ${t.portfolio_lead_days} days — too late for a full portfolio review. Please pick a later date.`}
                    </p>
                  )}
                  <div className="mt-5 flex-1" />
                  {mine ? (
                    <p className="rounded-2xl border border-emerald-400/25 bg-emerald-400/8 px-4 py-2.5 text-center text-sm font-semibold text-emerald-200">
                      ✓ You&apos;re booked ({mine.status})
                    </p>
                  ) : (
                    <button
                      onClick={() => setBookingEvent(ev)}
                      disabled={left === 0 || (t?.requires_portfolio && !lead)}
                      className="btn-liquid w-full py-2.5 text-sm"
                    >
                      {left === 0 ? "Fully booked" : "Book this session"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {bookingEvent && (
        <BookingModal
          event={bookingEvent}
          userId={userId}
          onClose={() => setBookingEvent(null)}
          onBooked={() => {
            setBookingEvent(null);
            setMessage({
              kind: "ok",
              text: "Booking received! We'll confirm it shortly — you can track the status here.",
            });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function StatusChip({ status }: { status: Booking["status"] }) {
  const styles: Record<Booking["status"], string> = {
    pending: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    confirmed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    cancelled: "border-white/15 bg-white/5 text-mist/50",
    completed: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  };
  const labels: Record<Booking["status"], string> = {
    pending: "⏳ Pending",
    confirmed: "✓ Confirmed",
    cancelled: "Cancelled",
    completed: "Completed",
  };
  return <span className={`chip ${styles[status]}`}>{labels[status]}</span>;
}

function BookingModal({
  event,
  userId,
  onClose,
  onBooked,
}: {
  event: CoachEvent;
  userId: string;
  onClose: () => void;
  onBooked: () => void;
}) {
  const t = event.coach_event_types;
  const needsPortfolio = !!t?.requires_portfolio;
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [agreed, setAgreed] = useState(!needsPortfolio);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("coach_bookings").insert({
      event_id: event.id,
      user_id: userId,
      portfolio_url: needsPortfolio ? portfolioUrl : null,
      notes: notes || null,
    });
    setLoading(false);

    if (error) {
      setError(
        error.message.includes("duplicate")
          ? "You already have a booking for this session."
          : error.message
      );
      return;
    }
    onBooked();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-deep max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">{event.title}</h3>
            <p className="mt-1 text-sm text-mist/55">
              {formatDateTime(event.starts_at)} · {event.location}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="btn-ghost h-9 w-9 shrink-0 text-sm">
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {error && (
            <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          {needsPortfolio && (
            <>
              <div>
                <label className="label" htmlFor="portfolio">
                  Link to your portfolio *
                </label>
                <input
                  id="portfolio"
                  type="url"
                  required
                  className="field"
                  placeholder="https://drive.google.com/… or OneDrive / Dropbox link"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                />
                <p className="mt-1.5 text-xs text-mist/45">
                  Share a viewable link (Google Drive, OneDrive, Dropbox…). Make
                  sure link-sharing is enabled for your reviewer.
                </p>
              </div>
              <label className="flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/8 px-4 py-3 text-xs leading-relaxed text-amber-100/90">
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-amber-400"
                />
                <span>
                  I understand my portfolio must be accessible to my reviewer{" "}
                  <strong>at least {t?.portfolio_lead_days ?? 21} days before</strong>{" "}
                  the session, and that incomplete access may limit the value of
                  my 30-minute clinic.
                </span>
              </label>
            </>
          )}

          <div>
            <label className="label" htmlFor="notes">
              Anything you&apos;d like us to know? (optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              className="field resize-none"
              placeholder="Your specialty, where you are on the pathway, specific questions…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading || !agreed} className="btn-liquid w-full py-3 text-sm">
            {loading ? "Booking…" : "Confirm my booking"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Booking, BookingStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const statusFilters: ("all" | BookingStatus)[] = [
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

export default function BookingManager({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof statusFilters)[number]>("all");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notesFor, setNotesFor] = useState<Booking | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const visible =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  async function setStatus(b: Booking, status: BookingStatus) {
    setBusy(b.id);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("coach_bookings")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", b.id);
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  async function saveNotes() {
    if (!notesFor) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("coach_bookings")
      .update({ admin_notes: notesDraft || null, updated_at: new Date().toISOString() })
      .eq("id", notesFor.id);
    if (error) {
      setError(error.message);
      return;
    }
    setNotesFor(null);
    router.refresh();
  }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-3xl font-bold">🎟 Bookings</h1>
        <p className="mt-2 text-mist/60">
          Confirm, complete or cancel member bookings. Portfolio links appear
          here for clinic reviews.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`chip cursor-pointer capitalize ${
              filter === s
                ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                : "hover:bg-white/12"
            }`}
          >
            {s}
            {s !== "all" && ` (${bookings.filter((b) => b.status === s).length})`}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {visible.length === 0 && (
          <p className="glass rounded-3xl px-6 py-12 text-center text-sm text-mist/50">
            No bookings here.
          </p>
        )}
        {visible.map((b) => (
          <div key={b.id} className="glass rounded-2xl px-5 py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {b.coach_profiles?.full_name || "—"}{" "}
                  <span className="text-xs font-normal text-mist/50">
                    {b.coach_profiles?.email}
                  </span>
                </p>
                <p className="text-xs text-mist/55">
                  {b.coach_events?.title} ·{" "}
                  {b.coach_events ? formatDateTime(b.coach_events.starts_at) : ""}
                </p>
                {b.coach_profiles?.specialty && (
                  <p className="text-xs text-mist/45">
                    Specialty: {b.coach_profiles.specialty}
                    {b.coach_profiles.gmc_number
                      ? ` · GMC ${b.coach_profiles.gmc_number}`
                      : ""}
                  </p>
                )}
              </div>
              <span
                className={`chip capitalize ${
                  b.status === "pending"
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                    : b.status === "confirmed"
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                      : b.status === "completed"
                        ? "border-sky-400/30 bg-sky-400/10 text-sky-200"
                        : "border-white/15 bg-white/5 text-mist/50"
                }`}
              >
                {b.status}
              </span>
              {b.payment_status === "paid" && (
                <span className="chip border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
                  💳 Paid £{Number(b.amount_paid_gbp ?? 0)}
                </span>
              )}
              {b.payment_status === "unpaid" && b.status !== "cancelled" && (
                <span className="chip border-amber-400/30 bg-amber-400/10 text-amber-200">
                  💳 Awaiting payment
                </span>
              )}
              {b.payment_status === "refunded" && (
                <span className="chip border-sky-400/30 bg-sky-400/10 text-sky-200">
                  💳 Refunded
                </span>
              )}
              {b.payment_status === "paid" && b.status === "cancelled" && (
                <span className="chip border-red-400/30 bg-red-400/10 text-red-200">
                  ⚠ Refund due — issue it in the Stripe dashboard
                </span>
              )}
              <div className="flex shrink-0 flex-wrap gap-2">
                {b.status === "pending" && (
                  <button
                    onClick={() => setStatus(b, "confirmed")}
                    disabled={busy === b.id}
                    className="btn-liquid px-4 py-1.5 text-xs"
                  >
                    Confirm
                  </button>
                )}
                {b.status === "confirmed" && (
                  <button
                    onClick={() => setStatus(b, "completed")}
                    disabled={busy === b.id}
                    className="btn-ghost px-4 py-1.5 text-xs"
                  >
                    Mark completed
                  </button>
                )}
                {(b.status === "pending" || b.status === "confirmed") && (
                  <button
                    onClick={() => setStatus(b, "cancelled")}
                    disabled={busy === b.id}
                    className="btn-danger px-4 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => {
                    setNotesFor(b);
                    setNotesDraft(b.admin_notes ?? "");
                  }}
                  className="btn-ghost px-4 py-1.5 text-xs"
                >
                  Notes
                </button>
              </div>
            </div>

            {(b.portfolio_url || b.notes || b.admin_notes) && (
              <div className="mt-3 space-y-1.5 border-t border-white/8 pt-3 text-xs">
                {b.portfolio_url && (
                  <p>
                    <span className="text-mist/45">📁 Portfolio: </span>
                    <a
                      href={b.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-cyan-300 hover:underline"
                    >
                      {b.portfolio_url}
                    </a>
                  </p>
                )}
                {b.notes && (
                  <p className="text-mist/60">
                    <span className="text-mist/45">💬 Member note: </span>
                    {b.notes}
                  </p>
                )}
                {b.admin_notes && (
                  <p className="text-violet-200/80">
                    <span className="text-mist/45">🛡 Admin note: </span>
                    {b.admin_notes}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {notesFor && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setNotesFor(null)}
        >
          <div
            className="glass-deep w-full max-w-md space-y-4 rounded-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold">
              Admin notes — {notesFor.coach_profiles?.full_name || notesFor.coach_profiles?.email}
            </h3>
            <textarea
              rows={4}
              className="field resize-none"
              placeholder="Internal notes (not visible to the member)…"
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={saveNotes} className="btn-liquid flex-1 py-2.5 text-sm">
                Save notes
              </button>
              <button onClick={() => setNotesFor(null)} className="btn-ghost px-5 py-2.5 text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

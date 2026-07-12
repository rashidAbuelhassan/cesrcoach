"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CoachEvent, EventType } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface Props {
  eventTypes: EventType[];
  events: CoachEvent[];
  bookedCounts: Record<string, number>;
}

const emptyForm = {
  event_type_id: "",
  title: "",
  description: "",
  date: "",
  time: "10:00",
  capacity: 1,
  location: "Online (link shared after booking)",
  meeting_url: "",
};

export default function EventManager({ eventTypes, events, bookedCounts }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<CoachEvent | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function openCreate() {
    const firstType = eventTypes[0];
    setForm({
      ...emptyForm,
      event_type_id: firstType?.id ?? "",
      capacity: firstType?.default_capacity ?? 1,
      title: firstType?.name ?? "",
    });
    setEditing(null);
    setCreating(true);
  }

  function openEdit(ev: CoachEvent) {
    const d = new Date(ev.starts_at);
    setForm({
      event_type_id: ev.event_type_id,
      title: ev.title,
      description: ev.description ?? "",
      date: d.toISOString().slice(0, 10),
      time: d.toTimeString().slice(0, 5),
      capacity: ev.capacity,
      location: ev.location,
      meeting_url: ev.meeting_url ?? "",
    });
    setEditing(ev);
    setCreating(true);
  }

  function onTypeChange(id: string) {
    const t = eventTypes.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      event_type_id: id,
      capacity: t?.default_capacity ?? f.capacity,
      title: editing ? f.title : (t?.name ?? f.title),
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const t = eventTypes.find((x) => x.id === form.event_type_id);
    const starts = new Date(`${form.date}T${form.time}`);
    const ends = new Date(starts.getTime() + (t?.duration_minutes ?? 60) * 60000);

    const payload = {
      event_type_id: form.event_type_id,
      title: form.title,
      description: form.description || null,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      capacity: form.capacity,
      location: form.location,
      meeting_url: form.meeting_url || null,
    };

    const supabase = createClient();
    const { error } = editing
      ? await supabase.from("coach_events").update(payload).eq("id", editing.id)
      : await supabase.from("coach_events").insert(payload);
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setCreating(false);
    router.refresh();
  }

  async function setStatus(ev: CoachEvent, status: CoachEvent["status"]) {
    const verb = status === "cancelled" ? "Cancel" : "Update";
    if (status === "cancelled" && !window.confirm(`${verb} "${ev.title}"? Members with bookings will see it as cancelled.`))
      return;
    const supabase = createClient();
    const { error } = await supabase
      .from("coach_events")
      .update({ status })
      .eq("id", ev.id);
    if (error) setError(error.message);
    router.refresh();
  }

  async function remove(ev: CoachEvent) {
    if (!window.confirm(`Permanently delete "${ev.title}" and all its bookings?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("coach_events").delete().eq("id", ev.id);
    if (error) setError(error.message);
    router.refresh();
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">🗓 Sessions</h1>
          <p className="mt-2 text-mist/60">
            Schedule and manage the sessions members can book.
          </p>
        </div>
        <button onClick={openCreate} className="btn-liquid px-6 py-2.5 text-sm">
          + Schedule a session
        </button>
      </header>

      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {events.length === 0 && (
          <p className="glass rounded-3xl px-6 py-12 text-center text-sm text-mist/50">
            No sessions yet — schedule your first one.
          </p>
        )}
        {events.map((ev) => {
          const t = ev.coach_event_types;
          const booked = bookedCounts[ev.id] ?? 0;
          const past = new Date(ev.starts_at) < new Date();
          return (
            <div
              key={ev.id}
              className={`glass flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4 ${
                ev.status !== "scheduled" || past ? "opacity-60" : ""
              }`}
            >
              <span
                className="chip shrink-0"
                style={{
                  borderColor: `${t?.color}55`,
                  background: `${t?.color}18`,
                  color: t?.color ?? undefined,
                }}
              >
                {t?.name}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{ev.title}</p>
                <p className="text-xs text-mist/50">
                  {formatDateTime(ev.starts_at)} · {ev.location} ·{" "}
                  <strong>{booked}/{ev.capacity}</strong> booked
                  {ev.status !== "scheduled" && ` · ${ev.status.toUpperCase()}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => openEdit(ev)} className="btn-ghost px-4 py-1.5 text-xs">
                  Edit
                </button>
                {ev.status === "scheduled" ? (
                  <button
                    onClick={() => setStatus(ev, "cancelled")}
                    className="btn-danger px-4 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => setStatus(ev, "scheduled")}
                    className="btn-ghost px-4 py-1.5 text-xs"
                  >
                    Reinstate
                  </button>
                )}
                <button onClick={() => remove(ev)} className="btn-danger px-4 py-1.5 text-xs">
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {creating && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setCreating(false)}
        >
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="glass-deep max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl p-6 sm:p-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editing ? "Edit session" : "Schedule a session"}
              </h3>
              <button
                type="button"
                onClick={() => setCreating(false)}
                aria-label="Close"
                className="btn-ghost h-9 w-9 text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="label">Session type</label>
              <select
                className="field"
                required
                value={form.event_type_id}
                onChange={(e) => onTypeChange(e.target.value)}
              >
                {eventTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.duration_minutes} min)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Title</label>
              <input
                className="field"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="field"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Start time</label>
                <input
                  type="time"
                  className="field"
                  required
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Capacity</label>
                <input
                  type="number"
                  min={1}
                  className="field"
                  required
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  className="field"
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Meeting link (shown to confirmed members)</label>
              <input
                type="url"
                className="field"
                placeholder="https://zoom.us/…"
                value={form.meeting_url}
                onChange={(e) => setForm({ ...form, meeting_url: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <textarea
                rows={3}
                className="field resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-liquid w-full py-3 text-sm">
              {loading ? "Saving…" : editing ? "Save changes" : "Schedule session"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

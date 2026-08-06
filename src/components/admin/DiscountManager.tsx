"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { DiscountCodeRow, EventType } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const emptyForm = {
  code: "",
  description: "",
  discount_type: "percent" as "percent" | "amount",
  discount_value: "10",
  event_type_id: "",
  max_redemptions: "",
  valid_until: "",
  active: true,
};

export default function DiscountManager({
  codes,
  eventTypes,
}: {
  codes: DiscountCodeRow[];
  eventTypes: EventType[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DiscountCodeRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  function openCreate() {
    setForm(emptyForm);
    setEditing(null);
    setError(null);
    setOpen(true);
  }

  function openEdit(c: DiscountCodeRow) {
    setForm({
      code: c.code,
      description: c.description ?? "",
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      event_type_id: c.event_type_id ?? "",
      max_redemptions: c.max_redemptions ? String(c.max_redemptions) : "",
      valid_until: c.valid_until ? c.valid_until.slice(0, 10) : "",
      active: c.active,
    });
    setEditing(c);
    setError(null);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const value = Number(form.discount_value);
    if (!form.code.trim()) {
      setError("Give the code a name, e.g. WELCOME10.");
      return;
    }
    if (isNaN(value) || value <= 0) {
      setError("Enter a discount greater than zero.");
      return;
    }
    if (form.discount_type === "percent" && value > 100) {
      setError("A percentage discount can't be more than 100%.");
      return;
    }

    setLoading(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: value,
      event_type_id: form.event_type_id || null,
      max_redemptions: form.max_redemptions ? Number(form.max_redemptions) : null,
      // run to the end of the chosen day
      valid_until: form.valid_until
        ? new Date(`${form.valid_until}T23:59:59`).toISOString()
        : null,
      active: form.active,
    };

    const supabase = createClient();
    const { error } = editing
      ? await supabase
          .from("coach_discount_codes")
          .update(payload)
          .eq("id", editing.id)
      : await supabase.from("coach_discount_codes").insert(payload);
    setLoading(false);

    if (error) {
      setError(
        error.message.includes("duplicate")
          ? "That code already exists — pick a different one."
          : error.message
      );
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function toggleActive(c: DiscountCodeRow) {
    const supabase = createClient();
    await supabase
      .from("coach_discount_codes")
      .update({ active: !c.active })
      .eq("id", c.id);
    router.refresh();
  }

  async function remove(c: DiscountCodeRow) {
    if (!window.confirm(`Delete the code ${c.code}? This can't be undone.`)) return;
    const supabase = createClient();
    await supabase.from("coach_discount_codes").delete().eq("id", c.id);
    router.refresh();
  }

  function copy(code: string) {
    navigator.clipboard?.writeText(code).then(
      () => {
        setCopied(code);
        window.setTimeout(() => setCopied(null), 1800);
      },
      () => {}
    );
  }

  function describe(c: DiscountCodeRow) {
    const value = Number(c.discount_value);
    const off =
      c.discount_type === "percent"
        ? `${value % 1 === 0 ? value.toFixed(0) : value}% off`
        : `£${value.toFixed(2)} off`;
    const scope = c.event_type_id
      ? (eventTypes.find((t) => t.id === c.event_type_id)?.name ?? "one service")
      : "all services";
    const used = c.max_redemptions
      ? `${c.times_redeemed}/${c.max_redemptions} used`
      : `${c.times_redeemed} used`;
    const expiry = c.valid_until ? `expires ${formatDate(c.valid_until)}` : "no expiry";
    return `${off} · ${scope} · ${used} · ${expiry}`;
  }

  const expired = (c: DiscountCodeRow) =>
    !!c.valid_until && new Date(c.valid_until) < new Date();
  const usedUp = (c: DiscountCodeRow) =>
    c.max_redemptions !== null && c.times_redeemed >= c.max_redemptions;

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">🏷 Discount codes</h1>
          <p className="mt-2 text-mist/60">
            Give members a percentage or fixed amount off a session. Codes are
            checked on our server at checkout, so the discount can&apos;t be
            faked from the browser.
          </p>
        </div>
        <button onClick={openCreate} className="btn-liquid px-6 py-2.5 text-sm">
          + New code
        </button>
      </header>

      {error && !open && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {codes.length === 0 && (
          <p className="glass rounded-3xl px-6 py-12 text-center text-sm text-mist/50">
            No discount codes yet — create one to start offering them.
          </p>
        )}
        {codes.map((c) => {
          const dead = !c.active || expired(c) || usedUp(c);
          return (
            <div
              key={c.id}
              className={`glass flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4 ${
                dead ? "opacity-60" : ""
              }`}
            >
              <button
                onClick={() => copy(c.code)}
                title="Copy code"
                className="shrink-0 rounded-xl border border-white/15 bg-white/6 px-4 py-2 font-mono text-sm font-bold tracking-wider transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
              >
                {copied === c.code ? "copied ✓" : c.code}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{describe(c)}</p>
                <p className="truncate text-xs text-mist/50">
                  {c.description || "No description"}
                </p>
              </div>
              {expired(c) && (
                <span className="chip border-amber-400/30 bg-amber-400/10 text-amber-200">
                  Expired
                </span>
              )}
              {usedUp(c) && (
                <span className="chip border-amber-400/30 bg-amber-400/10 text-amber-200">
                  Fully redeemed
                </span>
              )}
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => toggleActive(c)}
                  className={`chip cursor-pointer ${
                    c.active
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                      : "border-white/15 bg-white/5 text-mist/50"
                  }`}
                >
                  {c.active ? "Active" : "Paused"}
                </button>
                <button onClick={() => openEdit(c)} className="btn-ghost px-4 py-1.5 text-xs">
                  Edit
                </button>
                <button onClick={() => remove(c)} className="btn-danger px-4 py-1.5 text-xs">
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="glass-deep max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl p-6 sm:p-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editing ? "Edit discount code" : "New discount code"}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="btn-ghost h-9 w-9 text-sm"
              >
                ✕
              </button>
            </div>

            {error && (
              <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}

            <div>
              <label className="label">Code</label>
              <input
                className="field font-mono uppercase tracking-wider"
                required
                placeholder="WELCOME10"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
              <p className="mt-1.5 text-xs text-mist/45">
                Members type this at booking. Not case-sensitive.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Discount type</label>
                <select
                  className="field"
                  value={form.discount_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discount_type: e.target.value as "percent" | "amount",
                    })
                  }
                >
                  <option value="percent">Percentage off</option>
                  <option value="amount">Fixed amount off</option>
                </select>
              </div>
              <div>
                <label className="label">
                  {form.discount_type === "percent" ? "Percent (%)" : "Amount (£)"}
                </label>
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  max={form.discount_type === "percent" ? 100 : undefined}
                  className="field"
                  required
                  value={form.discount_value}
                  onChange={(e) =>
                    setForm({ ...form, discount_value: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="label">Applies to</label>
              <select
                className="field"
                value={form.event_type_id}
                onChange={(e) =>
                  setForm({ ...form, event_type_id: e.target.value })
                }
              >
                <option value="">All services</option>
                {eventTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.price_gbp ? ` (£${Number(t.price_gbp).toFixed(0)})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Max redemptions</label>
                <input
                  type="number"
                  min={1}
                  className="field"
                  placeholder="Unlimited"
                  value={form.max_redemptions}
                  onChange={(e) =>
                    setForm({ ...form, max_redemptions: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Expires on</label>
                <input
                  type="date"
                  className="field"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Internal note (optional)</label>
              <input
                className="field"
                placeholder="e.g. launch offer for the Facebook group"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-mist/70">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="accent-cyan-400"
              />
              Active (members can use it right away)
            </label>

            <button type="submit" disabled={loading} className="btn-liquid w-full py-3 text-sm">
              {loading ? "Saving…" : editing ? "Save changes" : "Create code"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

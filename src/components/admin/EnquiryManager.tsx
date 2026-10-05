"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Enquiry, EnquiryStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

type Filter = "new" | "replied" | "archived" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "new", label: "New" },
  { key: "replied", label: "Replied" },
  { key: "archived", label: "Archived" },
  { key: "all", label: "All" },
];

function replyLink(e: Enquiry) {
  const first = e.name.trim().split(/\s+/)[0];
  const subject = "Re: your question to CESR Coach";
  const body = `Hi ${first},\n\n\n\n---\nYou wrote:\n${e.question}`;
  return `mailto:${e.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function EnquiryManager({ enquiries }: { enquiries: Enquiry[] }) {
  const router = useRouter();
  const [items, setItems] = useState(enquiries);
  const [filter, setFilter] = useState<Filter>(
    enquiries.some((e) => e.status === "new") ? "new" : "all"
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = { new: 0, replied: 0, archived: 0, all: items.length };
    for (const e of items) c[e.status]++;
    return c;
  }, [items]);

  const visible = filter === "all" ? items : items.filter((e) => e.status === filter);

  async function setStatus(e: Enquiry, status: EnquiryStatus) {
    setBusy(e.id);
    setError(null);
    const handled_at = status === "new" ? null : new Date().toISOString();
    const supabase = createClient();
    const { error } = await supabase
      .from("coach_enquiries")
      .update({ status, handled_at })
      .eq("id", e.id);
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    setItems((list) => list.map((x) => (x.id === e.id ? { ...x, status, handled_at } : x)));
    router.refresh(); // keeps the "new" badge in the navigation honest
  }

  async function remove(e: Enquiry) {
    if (!window.confirm(`Delete ${e.name}'s enquiry for good? This can't be undone.`)) return;
    setBusy(e.id);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("coach_enquiries").delete().eq("id", e.id);
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    setItems((list) => list.filter((x) => x.id !== e.id));
    router.refresh();
  }

  function copyEmail(email: string) {
    navigator.clipboard?.writeText(email).then(
      () => {
        setCopied(email);
        window.setTimeout(() => setCopied(null), 1800);
      },
      () => {}
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-3xl font-bold">💬 Enquiries</h1>
        <p className="mt-2 text-mist/87">
          Questions sent from the “Talk to us first” form. Reply by email, then
          mark the enquiry as replied.
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter enquiries">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`chip cursor-pointer ${
              filter === f.key ? "border-white/60 bg-white text-neutral-900" : "hover:bg-white/15"
            }`}
          >
            {f.label}
            <span className="tabular-nums opacity-70">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="glass rounded-3xl px-6 py-14 text-center text-sm text-mist/87">
          {items.length === 0
            ? "No enquiries yet. Messages from the contact form will appear here."
            : `Nothing in “${FILTERS.find((f) => f.key === filter)?.label}”.`}
        </p>
      ) : (
        <ul className="space-y-4">
          {visible.map((e) => (
            <li
              key={e.id}
              className={`glass rounded-3xl p-5 sm:p-6 ${e.status === "archived" ? "opacity-75" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold">{e.name}</h2>
                  <p className="text-xs text-mist/84">{formatDateTime(e.created_at)}</p>
                </div>
                <span
                  className={`chip capitalize ${
                    e.status === "new"
                      ? "border-white/60 bg-white font-bold text-neutral-900"
                      : e.status === "replied"
                        ? "border-white/35 bg-white/10"
                        : "border-white/15 bg-transparent text-mist/87"
                  }`}
                >
                  {e.status}
                </span>
              </div>

              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <dt className="text-mist/80">Email</dt>
                  <dd className="flex items-center gap-2">
                    <a className="font-semibold underline underline-offset-2 hover:text-white" href={`mailto:${e.email}`}>
                      {e.email}
                    </a>
                    <button
                      onClick={() => copyEmail(e.email)}
                      className="rounded-md border border-white/20 px-2 py-0.5 text-[11px] text-mist/90 hover:bg-white/10"
                    >
                      {copied === e.email ? "copied ✓" : "copy"}
                    </button>
                  </dd>
                </div>
                {e.phone && (
                  <div className="flex gap-2">
                    <dt className="text-mist/80">Phone</dt>
                    <dd>
                      <a className="font-semibold hover:underline" href={`tel:${e.phone.replace(/\s+/g, "")}`}>
                        {e.phone}
                      </a>
                    </dd>
                  </div>
                )}
                {e.specialty && (
                  <div className="flex gap-2">
                    <dt className="text-mist/80">Specialty</dt>
                    <dd className="font-semibold">{e.specialty}</dd>
                  </div>
                )}
                {e.stage && (
                  <div className="flex gap-2">
                    <dt className="text-mist/80">Stage</dt>
                    <dd className="font-semibold">{e.stage}</dd>
                  </div>
                )}
              </dl>

              <p className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm leading-relaxed">
                {e.question}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a href={replyLink(e)} className="btn-liquid px-5 py-2 text-xs">
                  ✉ Reply by email
                </a>
                {e.status !== "replied" && (
                  <button
                    onClick={() => setStatus(e, "replied")}
                    disabled={busy === e.id}
                    className="btn-ghost px-4 py-2 text-xs"
                  >
                    Mark replied
                  </button>
                )}
                {e.status !== "archived" && (
                  <button
                    onClick={() => setStatus(e, "archived")}
                    disabled={busy === e.id}
                    className="btn-ghost px-4 py-2 text-xs"
                  >
                    Archive
                  </button>
                )}
                {e.status !== "new" && (
                  <button
                    onClick={() => setStatus(e, "new")}
                    disabled={busy === e.id}
                    className="btn-ghost px-4 py-2 text-xs"
                  >
                    Reopen
                  </button>
                )}
                <button
                  onClick={() => remove(e)}
                  disabled={busy === e.id}
                  className="btn-danger ml-auto px-4 py-2 text-xs"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

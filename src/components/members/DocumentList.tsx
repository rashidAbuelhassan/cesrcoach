"use client";

import { useMemo, useState } from "react";
import type { Doc } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export default function DocumentList({ docs }: { docs: Doc[] }) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(docs.map((d) => d.category)))],
    [docs]
  );
  const [category, setCategory] = useState("All");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered =
    category === "All" ? docs : docs.filter((d) => d.category === category);

  async function download(doc: Doc) {
    setError(null);
    if (doc.external_url) {
      window.open(doc.external_url, "_blank", "noopener");
      return;
    }
    if (!doc.file_path) return;

    setBusy(doc.id);
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("coach-documents")
      .createSignedUrl(doc.file_path, 300, { download: true });
    setBusy(null);

    if (error || !data?.signedUrl) {
      setError("Could not generate the download link. Please try again.");
      return;
    }
    window.location.assign(data.signedUrl);
  }

  if (docs.length === 0) {
    return (
      <p className="glass rounded-3xl px-6 py-14 text-center text-sm text-mist/50">
        No documents published yet — templates and guides will appear here
        soon. 📂
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {categories.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`chip cursor-pointer transition ${
                category === c
                  ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                  : "hover:bg-white/12"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {filtered.map((d) => (
          <li
            key={d.id}
            className="glass glass-hover flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-400/20 text-lg ring-1 ring-white/10">
              📄
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{d.title}</p>
              <p className="truncate text-xs text-mist/50">
                {d.category}
                {d.file_size_kb
                  ? ` · ${
                      d.file_size_kb > 1024
                        ? `${(d.file_size_kb / 1024).toFixed(1)} MB`
                        : `${d.file_size_kb} KB`
                    }`
                  : ""}
                {d.description ? ` · ${d.description}` : ""}
              </p>
            </div>
            <button
              onClick={() => download(d)}
              disabled={busy === d.id}
              className="btn-liquid px-5 py-2 text-xs"
            >
              {busy === d.id ? "Preparing…" : "⬇ Download"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

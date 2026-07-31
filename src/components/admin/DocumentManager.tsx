"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Doc } from "@/lib/types";

const emptyForm = {
  title: "",
  description: "",
  category: "General",
  external_url: "",
  published: true,
};

export default function DocumentManager({ docs }: { docs: Doc[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function openCreate() {
    setForm(emptyForm);
    setFile(null);
    setEditing(null);
    setOpen(true);
  }

  function openEdit(d: Doc) {
    setForm({
      title: d.title,
      description: d.description ?? "",
      category: d.category,
      external_url: d.external_url ?? "",
      published: d.published,
    });
    setFile(null);
    setEditing(d);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!editing && !file && !form.external_url) {
      setError("Upload a file or provide an external link.");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    let file_path = editing?.file_path ?? null;
    let file_size_kb = editing?.file_size_kb ?? null;

    if (file) {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("coach-documents")
        .upload(path, file, { upsert: false });
      if (upErr) {
        setError(`Upload failed: ${upErr.message}`);
        setLoading(false);
        return;
      }
      file_path = path;
      file_size_kb = Math.round(file.size / 1024);
    }

    const payload = {
      title: form.title,
      description: form.description || null,
      category: form.category || "General",
      external_url: form.external_url || null,
      file_path,
      file_size_kb,
      published: form.published,
    };

    const { error } = editing
      ? await supabase.from("coach_documents").update(payload).eq("id", editing.id)
      : await supabase.from("coach_documents").insert(payload);
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function togglePublished(d: Doc) {
    const supabase = createClient();
    await supabase
      .from("coach_documents")
      .update({ published: !d.published })
      .eq("id", d.id);
    router.refresh();
  }

  async function remove(d: Doc) {
    if (!window.confirm(`Delete "${d.title}"?`)) return;
    const supabase = createClient();
    if (d.file_path) {
      await supabase.storage.from("coach-documents").remove([d.file_path]);
    }
    await supabase.from("coach_documents").delete().eq("id", d.id);
    router.refresh();
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">📄 Documents</h1>
          <p className="mt-2 text-mist/60">
            Upload PDFs for members to read. Uploaded files open in the secure
            view-only reader — no downloading or printing, and every page is
            watermarked with the reader&apos;s name and email. External links
            can&apos;t be protected this way.
          </p>
        </div>
        <button onClick={openCreate} className="btn-liquid px-6 py-2.5 text-sm">
          + Add document
        </button>
      </header>

      {error && !open && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {docs.length === 0 && (
          <p className="glass rounded-3xl px-6 py-12 text-center text-sm text-mist/50">
            No documents yet — upload your first one.
          </p>
        )}
        {docs.map((d) => (
          <div
            key={d.id}
            className={`glass flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4 ${
              d.published ? "" : "opacity-60"
            }`}
          >
            <span className="text-2xl">📄</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{d.title}</p>
              <p className="truncate text-xs text-mist/50">
                {d.category}
                {d.file_size_kb ? ` · ${d.file_size_kb} KB` : ""}
                {d.file_path ? ` · uploaded file` : d.external_url ? " · external link" : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => togglePublished(d)}
                className={`chip cursor-pointer ${
                  d.published
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                    : "border-white/15 bg-white/5 text-mist/50"
                }`}
              >
                {d.published ? "Published" : "Draft"}
              </button>
              <button onClick={() => openEdit(d)} className="btn-ghost px-4 py-1.5 text-xs">
                Edit
              </button>
              <button onClick={() => remove(d)} className="btn-danger px-4 py-1.5 text-xs">
                Delete
              </button>
            </div>
          </div>
        ))}
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
                {editing ? "Edit document" : "Add document"}
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
              <label className="label">Title</label>
              <input
                className="field"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="label">
                Upload PDF {editing?.file_path ? "(replaces the current file)" : ""}
                <span className="ml-1 font-normal text-cyan-300/70">
                  — protected, view-only
                </span>
              </label>
              <input
                ref={fileRef}
                type="file"
                className="field file:mr-3 file:rounded-full file:border-0 file:bg-cyan-400/20 file:px-4 file:py-1 file:text-xs file:font-semibold file:text-cyan-100"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <label className="label">
                …or link to an external file
                <span className="ml-1 font-normal text-amber-300/70">
                  — opens externally, not protected
                </span>
              </label>
              <input
                type="url"
                className="field"
                placeholder="https://…"
                value={form.external_url}
                onChange={(e) => setForm({ ...form, external_url: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Category</label>
              <input
                className="field"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <textarea
                rows={2}
                className="field resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-mist/70">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="accent-cyan-400"
              />
              Published (visible to members)
            </label>
            <button type="submit" disabled={loading} className="btn-liquid w-full py-3 text-sm">
              {loading ? "Saving…" : editing ? "Save changes" : "Add document"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

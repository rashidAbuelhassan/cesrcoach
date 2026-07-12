"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Video } from "@/lib/types";

const emptyForm = {
  title: "",
  description: "",
  video_url: "",
  thumbnail_url: "",
  category: "General",
  duration_minutes: "",
  sort_order: 0,
  published: true,
};

export default function VideoManager({ videos }: { videos: Video[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function openCreate() {
    setForm(emptyForm);
    setEditing(null);
    setOpen(true);
  }

  function openEdit(v: Video) {
    setForm({
      title: v.title,
      description: v.description ?? "",
      video_url: v.video_url,
      thumbnail_url: v.thumbnail_url ?? "",
      category: v.category,
      duration_minutes: v.duration_minutes?.toString() ?? "",
      sort_order: v.sort_order,
      published: v.published,
    });
    setEditing(v);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      title: form.title,
      description: form.description || null,
      video_url: form.video_url,
      thumbnail_url: form.thumbnail_url || null,
      category: form.category || "General",
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      sort_order: form.sort_order,
      published: form.published,
    };

    const supabase = createClient();
    const { error } = editing
      ? await supabase.from("coach_videos").update(payload).eq("id", editing.id)
      : await supabase.from("coach_videos").insert(payload);
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function togglePublished(v: Video) {
    const supabase = createClient();
    await supabase
      .from("coach_videos")
      .update({ published: !v.published })
      .eq("id", v.id);
    router.refresh();
  }

  async function remove(v: Video) {
    if (!window.confirm(`Delete "${v.title}"?`)) return;
    const supabase = createClient();
    await supabase.from("coach_videos").delete().eq("id", v.id);
    router.refresh();
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">🎬 Videos</h1>
          <p className="mt-2 text-mist/60">
            Add pre-recorded presentations (YouTube, Vimeo, Loom or direct MP4
            links). Only published videos appear to members.
          </p>
        </div>
        <button onClick={openCreate} className="btn-liquid px-6 py-2.5 text-sm">
          + Add video
        </button>
      </header>

      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {videos.length === 0 && (
          <p className="glass rounded-3xl px-6 py-12 text-center text-sm text-mist/50">
            No videos yet — add your first presentation.
          </p>
        )}
        {videos.map((v) => (
          <div
            key={v.id}
            className={`glass flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4 ${
              v.published ? "" : "opacity-60"
            }`}
          >
            <span className="text-2xl">🎬</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{v.title}</p>
              <p className="truncate text-xs text-mist/50">
                {v.category}
                {v.duration_minutes ? ` · ${v.duration_minutes} min` : ""} ·{" "}
                {v.video_url}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => togglePublished(v)}
                className={`chip cursor-pointer ${
                  v.published
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                    : "border-white/15 bg-white/5 text-mist/50"
                }`}
              >
                {v.published ? "Published" : "Draft"}
              </button>
              <button onClick={() => openEdit(v)} className="btn-ghost px-4 py-1.5 text-xs">
                Edit
              </button>
              <button onClick={() => remove(v)} className="btn-danger px-4 py-1.5 text-xs">
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
              <h3 className="text-lg font-bold">{editing ? "Edit video" : "Add video"}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="btn-ghost h-9 w-9 text-sm"
              >
                ✕
              </button>
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
            <div>
              <label className="label">Video URL (YouTube / Vimeo / Loom / MP4)</label>
              <input
                type="url"
                className="field"
                required
                placeholder="https://youtube.com/watch?v=…"
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category</label>
                <input
                  className="field"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Duration (minutes)</label>
                <input
                  type="number"
                  min={1}
                  className="field"
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Thumbnail URL (optional)</label>
              <input
                type="url"
                className="field"
                value={form.thumbnail_url}
                onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
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
              {loading ? "Saving…" : editing ? "Save changes" : "Add video"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

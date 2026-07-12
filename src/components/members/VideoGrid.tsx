"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import type { Video } from "@/lib/types";
import { formatDuration, toEmbedUrl } from "@/lib/utils";

export default function VideoGrid({ videos }: { videos: Video[] }) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(videos.map((v) => v.category)))],
    [videos]
  );
  const [category, setCategory] = useState("All");
  const [playing, setPlaying] = useState<Video | null>(null);

  const filtered =
    category === "All" ? videos : videos.filter((v) => v.category === category);

  if (videos.length === 0) {
    return (
      <p className="glass rounded-3xl px-6 py-14 text-center text-sm text-mist/50">
        No presentations published yet — new videos will appear here as soon as
        they&apos;re released. 🎥
      </p>
    );
  }

  return (
    <>
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => (
          <button
            key={v.id}
            onClick={() => setPlaying(v)}
            className="glass glass-hover group overflow-hidden rounded-3xl text-left"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-cyan-500/15 to-violet-500/15">
              {v.thumbnail_url ? (
                <img
                  src={v.thumbnail_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-5xl opacity-60">
                  🎬
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-xl backdrop-blur-md ring-1 ring-white/30 transition group-hover:scale-110 group-hover:bg-cyan-300/30">
                  ▶
                </span>
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 text-xs text-mist/50">
                <span className="chip">{v.category}</span>
                {v.duration_minutes ? (
                  <span>⏱ {formatDuration(v.duration_minutes)}</span>
                ) : null}
              </div>
              <h3 className="mt-2.5 font-bold leading-snug">{v.title}</h3>
              {v.description && (
                <p className="mt-1.5 line-clamp-2 text-sm text-mist/55">
                  {v.description}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* player modal */}
      {playing && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPlaying(null)}
        >
          <div
            className="glass-deep w-full max-w-4xl rounded-3xl p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <h3 className="font-bold sm:text-lg">{playing.title}</h3>
              <button
                onClick={() => setPlaying(null)}
                aria-label="Close player"
                className="btn-ghost h-9 w-9 shrink-0 text-sm"
              >
                ✕
              </button>
            </div>
            <PlayerFrame url={playing.video_url} title={playing.title} />
            {playing.description && (
              <p className="mt-4 text-sm text-mist/60">{playing.description}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function PlayerFrame({ url, title }: { url: string; title: string }) {
  const embed = toEmbedUrl(url);
  if (embed.kind === "iframe") {
    return (
      <iframe
        src={embed.src}
        title={title}
        className="aspect-video w-full rounded-2xl border border-white/10"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    <video
      src={embed.src}
      controls
      playsInline
      className="aspect-video w-full rounded-2xl border border-white/10 bg-black"
    />
  );
}

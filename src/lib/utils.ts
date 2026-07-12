export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h} hour${h > 1 ? "s" : ""}`;
}

export function daysUntil(iso: string) {
  return Math.floor(
    (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

/** Convert a YouTube / Vimeo / direct video URL into an embeddable URL. */
export function toEmbedUrl(url: string): { kind: "iframe" | "video"; src: string } {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").pop();
      return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (host === "youtu.be") {
      return {
        kind: "iframe",
        src: `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`,
      };
    }
    if (host === "vimeo.com") {
      return {
        kind: "iframe",
        src: `https://player.vimeo.com/video/${u.pathname.slice(1)}`,
      };
    }
    if (host === "loom.com" || host === "www.loom.com") {
      return { kind: "iframe", src: url.replace("/share/", "/embed/") };
    }
  } catch {
    // fall through to direct video
  }
  return { kind: "video", src: url };
}

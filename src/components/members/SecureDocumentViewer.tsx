"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  documentId: string;
  title: string;
  category: string;
  viewerLabel: string;
  viewerEmail: string;
}

/**
 * View-only PDF reader.
 *
 * Pages are rasterised to <canvas> with pdf.js, so the browser's native PDF
 * toolbar (with its download/print buttons) never appears and the file is
 * never handed to the browser as a saveable document. Each page is stamped
 * with the viewer's identity before it is painted, so the watermark is part
 * of the pixels — it survives any screenshot or canvas scrape.
 *
 * Screenshots themselves cannot be blocked by a web page; the watermark is
 * the deterrent, and the blur-on-blur behaviour stops casual capture tools.
 */
export default function SecureDocumentViewer({
  documentId,
  title,
  category,
  viewerLabel,
  viewerEmail,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [obscured, setObscured] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.25);

  const flashNotice = useCallback((text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(null), 2600);
  }, []);

  /* ---------------- render the document ---------------- */
  useEffect(() => {
    let cancelled = false;
    const stamp = new Date().toLocaleString("en-GB");

    async function run() {
      try {
        const pdfjs = await import("pdfjs-dist");
        if (cancelled) return;
        setStatus("loading");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        const response = await fetch(`/api/documents/${documentId}/stream`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Your session has expired. Please sign in again."
              : "This document could not be opened."
          );
        }
        const bytes = await response.arrayBuffer();
        if (cancelled) return;

        const pdf = await pdfjs.getDocument({ data: bytes }).promise;
        if (cancelled) return;
        setPageCount(pdf.numPages);

        const container = containerRef.current;
        if (!container) return;
        container.replaceChildren();

        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let n = 1; n <= pdf.numPages; n++) {
          if (cancelled) return;
          const page = await pdf.getPage(n);
          const viewport = page.getViewport({ scale: zoom * dpr });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${viewport.width / dpr}px`;
          canvas.style.height = `${viewport.height / dpr}px`;
          canvas.className =
            "mx-auto mb-6 block max-w-full rounded-xl border border-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]";
          canvas.setAttribute("aria-label", `${title} — page ${n}`);

          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;

          stampWatermark(ctx, canvas.width, canvas.height, [
            viewerLabel,
            viewerEmail,
            stamp,
          ]);

          container.appendChild(canvas);
        }

        if (!cancelled) setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setErrorText(
          err instanceof Error ? err.message : "This document could not be opened."
        );
        setStatus("error");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [documentId, title, viewerLabel, viewerEmail, zoom]);

  /* ---------------- protections ---------------- */
  useEffect(() => {
    const blockContextMenu = (e: MouseEvent) => e.preventDefault();
    const blockDrag = (e: DragEvent) => e.preventDefault();
    const blockCopy = (e: ClipboardEvent) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // save / print / firefox screenshot
      if (mod && ["s", "p"].includes(key)) {
        e.preventDefault();
        flashNotice("This document is view-only — saving and printing are disabled.");
        return;
      }
      // PrintScreen: can't be blocked, but we can hide the content and
      // overwrite whatever landed on the clipboard.
      if (e.key === "PrintScreen" || (mod && e.shiftKey && key === "s")) {
        setObscured(true);
        navigator.clipboard?.writeText("").catch(() => {});
        window.setTimeout(() => setObscured(false), 1200);
        flashNotice("Screen capture is not permitted for this document.");
      }
    };

    // hide the content whenever the window isn't the active one — most
    // capture tools take focus first
    const hide = () => setObscured(true);
    const show = () => setObscured(false);
    const onVisibility = () => setObscured(document.visibilityState !== "visible");

    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("dragstart", blockDrag);
    document.addEventListener("copy", blockCopy);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    window.addEventListener("beforeprint", hide);
    window.addEventListener("afterprint", show);

    return () => {
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("dragstart", blockDrag);
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      window.removeEventListener("beforeprint", hide);
      window.removeEventListener("afterprint", show);
    };
  }, [flashNotice]);

  return (
    <div className="reader-protected flex min-h-screen flex-col select-none">
      {/* toolbar */}
      <header className="glass-deep sticky top-0 z-20 flex flex-wrap items-center gap-3 px-4 py-3 print:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{title}</p>
          <p className="truncate text-xs text-mist/50">
            {category}
            {pageCount ? ` · ${pageCount} page${pageCount > 1 ? "s" : ""}` : ""} ·
            view-only
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.25).toFixed(2)))}
            className="btn-ghost h-9 w-9 text-sm"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="w-14 text-center text-xs text-mist/60">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
            className="btn-ghost h-9 w-9 text-sm"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>

        <button onClick={() => window.close()} className="btn-ghost px-4 py-2 text-xs">
          Close
        </button>
      </header>

      {/* document surface */}
      <main className="relative flex-1 overflow-auto px-4 py-6">
        {status === "loading" && (
          <p className="glass mx-auto max-w-sm rounded-2xl px-6 py-10 text-center text-sm text-mist/60">
            Opening secure reader…
          </p>
        )}
        {status === "error" && (
          <div className="glass mx-auto max-w-sm rounded-2xl px-6 py-10 text-center">
            <p className="text-sm text-red-200">{errorText}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-ghost mt-4 px-5 py-2 text-xs"
            >
              Try again
            </button>
          </div>
        )}

        <div
          ref={containerRef}
          className={`transition duration-150 ${
            obscured ? "pointer-events-none blur-2xl opacity-30" : ""
          }`}
        />

        {/* live watermark over the whole surface (the canvases are stamped too) */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-10 overflow-hidden opacity-[0.05] print:hidden"
        >
          <div className="absolute inset-0 grid rotate-[-30deg] scale-150 grid-cols-3 place-items-center gap-y-24 text-sm font-semibold tracking-widest">
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i} className="whitespace-nowrap">
                {viewerEmail || viewerLabel}
              </span>
            ))}
          </div>
        </div>

        {obscured && status === "ready" && (
          <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
            <p className="glass-deep rounded-2xl px-6 py-4 text-sm text-mist/80">
              🔒 Content hidden while this window is inactive
            </p>
          </div>
        )}
      </main>

      {notice && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 print:hidden">
          <p className="glass-deep rounded-2xl px-5 py-3 text-center text-sm text-amber-100">
            {notice}
          </p>
        </div>
      )}

      <footer className="px-4 pb-4 text-center text-[11px] text-mist/35 print:hidden">
        Licensed to {viewerLabel} ({viewerEmail}) for personal study only.
        Redistribution is prohibited and every page carries your identity.
      </footer>
    </div>
  );
}

/** Paint the viewer's identity across a rendered page, in the pixels. */
function stampWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lines: string[]
) {
  const text = lines.filter(Boolean).join("  ·  ");
  const fontSize = Math.max(12, Math.round(width / 70));

  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "#0f172a";
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // space the tiles off the real text width so rows never collide
  const gapX = ctx.measureText(text).width + fontSize * 4;
  const gapY = fontSize * 9;

  ctx.translate(width / 2, height / 2);
  ctx.rotate((-30 * Math.PI) / 180);

  const reach = Math.hypot(width, height);
  let row = 0;
  for (let y = -reach / 2; y < reach / 2; y += gapY, row++) {
    // offset alternate rows so the pattern reads as a lattice, not stripes
    const offset = row % 2 ? gapX / 2 : 0;
    for (let x = -reach / 2 - offset; x < reach / 2; x += gapX) {
      ctx.fillText(text, x + offset, y);
    }
  }
  ctx.restore();
}

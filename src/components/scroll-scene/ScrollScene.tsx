"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createCrowd, drawCrowd, paintStreetLayer } from "./crowd";
import { createPapers, drawPapers, paintDeskLayer } from "./desk";
import { clamp, makeLayer, smoothstep, type Viewport } from "./util";

/**
 * Site-wide background tied to the scrollbar:
 *   top of the page   — a figure stands still while a crowd streams past
 *   bottom of the page — papers fly in and settle into an open folder
 *
 * The crowd keeps walking on its own while the street is on screen, and
 * scrolling pushes it along faster; the papers move only with the scroll,
 * and scrolling back up plays them in reverse. With prefers-reduced-motion
 * it shows one still frame per scene.
 */

/** Pages shorter than this still get a gentle, partial play-through. */
const MIN_STORY_PX = 2200;
/**
 * Where in the scroll the street hands over to the desk. Pages can mark an
 * empty spacer with `data-scene-handover` so the cross-fade lands in clear
 * space; otherwise these fractions are used.
 */
const FALLBACK_HANDOVER: [number, number] = [0.44, 0.58];
/** Walking pace of the crowd when nobody is scrolling, in metres/second. */
const STROLL_SPEED = 1.15;
/** Idle walking only needs ~30fps; scrolling still renders every frame. */
const IDLE_FRAME_MS = 32;

export default function ScrollScene() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // the document reader wants a plain, distraction-free backdrop
  const hidden = pathname?.startsWith("/reader") ?? false;

  useEffect(() => {
    if (hidden) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const crowd = createCrowd();
    const papers = createPapers();

    let vp: Viewport = { w: 0, h: 0 };
    let dpr = 1;
    let street: HTMLCanvasElement | null = null;
    let desk: HTMLCanvasElement | null = null;
    // each scene renders opaque into its own buffer during the handover,
    // so layered details (rim light, shadows) never show through a fade
    let bufA: ReturnType<typeof makeLayer> | null = null;
    let bufB: ReturnType<typeof makeLayer> | null = null;

    let handover: [number, number] = FALLBACK_HANDOVER;
    let current = -1; // smoothed progress
    let trail = 0; // smoothed scroll speed
    let frame = 0;
    let last = 0;
    let strolled = 0; // metres the crowd has walked on its own
    let lastPaint = 0;

    const span = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      return Math.max(scrollable, MIN_STORY_PX);
    };

    const target = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      return clamp(window.scrollY / span());
    };

    /** Fade while the marked spacer crosses the middle of the screen. */
    const measure = () => {
      const marker = document.querySelector("[data-scene-handover]");
      if (!marker) {
        handover = FALLBACK_HANDOVER;
        return;
      }
      const r = marker.getBoundingClientRect();
      const top = r.top + window.scrollY;
      const from = top - window.innerHeight * 0.38; // spacer top reaches 38% down
      const to = top + r.height - window.innerHeight * 0.4; // bottom reaches 40%
      const s = span();
      handover = [clamp(from / s, 0, 0.9), clamp(Math.max(to, from + 80) / s, 0.05, 0.96)];
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      vp = { w: window.innerWidth, h: window.innerHeight };
      canvas.width = Math.round(vp.w * dpr);
      canvas.height = Math.round(vp.h * dpr);
      street = paintStreetLayer(vp, dpr);
      desk = paintDeskLayer(vp, dpr);
      bufA = bufB = null; // re-made at the new size on demand
    };

    const drawStreet = (c: CanvasRenderingContext2D, p: number) => {
      c.drawImage(street!, 0, 0, vp.w, vp.h);
      drawCrowd(c, vp, crowd, p, strolled, trail);
    };

    const drawDesk = (c: CanvasRenderingContext2D, p: number) => {
      c.drawImage(desk!, 0, 0, vp.w, vp.h);
      drawPapers(c, vp, papers, clamp((p - handover[1]) / Math.max(0.08, 0.95 - handover[1])));
    };

    const paint = (p: number) => {
      if (!street || !desk) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      const toDesk = smoothstep(handover[0], handover[1], p);

      if (toDesk <= 0.001) return drawStreet(ctx, p);
      if (toDesk >= 0.999) return drawDesk(ctx, p);

      bufA ??= makeLayer(vp, dpr);
      bufB ??= makeLayer(vp, dpr);
      drawStreet(bufA.ctx, p);
      drawDesk(bufB.ctx, p);
      ctx.drawImage(bufA.canvas, 0, 0, vp.w, vp.h);
      ctx.globalAlpha = toDesk;
      ctx.drawImage(bufB.canvas, 0, 0, vp.w, vp.h);
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      frame = 0;
      const goal = target();

      if (reduce.matches) {
        // one composed still per scene, no in-between motion
        trail = 0;
        paint(goal < 0.5 ? 0.12 : 1);
        return;
      }

      const dt = last ? Math.min(64, now - last) : 16.7;
      last = now;
      const prev = current < 0 ? goal : current;
      // frame-rate independent easing toward the scroll position
      current = prev + (goal - prev) * (1 - Math.pow(1 - 0.14, dt / 16.7));
      const speed = Math.abs(current - prev) / (dt / 16.7);
      trail += (Math.min(1, speed * 260) - trail) * 0.2;

      const scrolling = Math.abs(goal - current) > 0.00005 || trail > 0.01;
      const streetOnScreen = smoothstep(handover[0], handover[1], current) < 0.999;
      if (streetOnScreen) strolled += (STROLL_SPEED * dt) / 1000;

      if (scrolling || now - lastPaint >= IDLE_FRAME_MS) {
        paint(current);
        lastPaint = now;
      }

      if (scrolling || streetOnScreen) {
        frame = requestAnimationFrame(tick);
      } else {
        last = 0;
      }
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onResize = () => {
      measure();
      resize();
      wake();
    };

    measure();
    resize();
    current = target(); // start where the page already is, no fly-in
    wake();

    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", onResize);
    reduce.addEventListener("change", wake);
    // content height changes (images, data loading) shift the progress
    const ro = new ResizeObserver(() => {
      measure();
      wake();
    });
    ro.observe(document.body);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", onResize);
      reduce.removeEventListener("change", wake);
      ro.disconnect();
    };
  }, [hidden, pathname]);

  if (hidden) {
    return <div aria-hidden className="fixed inset-0 -z-10 bg-ink" />;
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* a soft vignette keeps the corners calm behind the navigation and text */}
      <div className="absolute inset-0 bg-[radial-gradient(125%_90%_at_50%_45%,transparent_45%,rgba(16,18,22,0.4)_100%)]" />
      {/* film grain */}
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

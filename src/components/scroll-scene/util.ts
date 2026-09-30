/** Small deterministic PRNG so the scene lays out identically on every visit. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

/** A neutral grey — the whole scene is strictly monochrome. */
export const grey = (l: number, a = 1) => {
  const v = Math.round(clamp(l, 0, 255));
  return `rgba(${v},${v},${v},${a})`;
};

export interface Viewport {
  w: number;
  h: number;
}

/** Offscreen canvas at device resolution, drawn in CSS pixels. */
export function makeLayer(vp: Viewport, dpr: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(vp.w * dpr));
  canvas.height = Math.max(1, Math.round(vp.h * dpr));
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { canvas, ctx };
}

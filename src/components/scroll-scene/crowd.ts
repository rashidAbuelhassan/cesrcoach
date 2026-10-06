import { addPerson, drawBackpack, STILL, walkPose, type Look } from "./figure";
import {
  clamp,
  focusX,
  grey,
  isPortrait,
  lerp,
  makeLayer,
  mulberry32,
  smoothstep,
  type Viewport,
} from "./util";

/*
 * Scene 1 — a figure stands still in the middle of a street, back to the
 * viewer, while a crowd streams past on both sides. The camera is at eye
 * level, so every head sits near the horizon and the crowd reads as
 * silhouettes against the glow at the end of the street.
 *
 * World units are metres: X lateral, Y up, Z depth away from the camera.
 */

const CAM_H = 1.55;
const Z_NEAR = 1.5;
const Z_FAR = 34;
const SPAN = Z_FAR - Z_NEAR;
const HERO_Z = 5.2;
/** extra metres the crowd covers over a full page scroll */
const WALK_DISTANCE = 70;
const STRIDE = 1.45;

interface Walker {
  x: number;
  z0: number;
  dir: 1 | -1;
  speed: number;
  height: number;
  build: number;
  look: Look;
  phase0: number;
}

export function createCrowd(seed = 11): Walker[] {
  const r = mulberry32(seed);
  const crowd: Walker[] = [];
  for (let i = 0; i < 30; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const female = r() < 0.46;
    const o = r();
    const h = r();
    const g = r();
    const look: Look = female
      ? {
          female,
          outfit: o < 0.33 ? "skirt" : o < 0.58 ? "coat" : "trousers",
          hair: h < 0.45 ? "long" : h < 0.65 ? "bun" : h < 0.85 ? "pony" : "short",
          bag: g < 0.12 ? 1 : g < 0.42 ? 2 : 0,
          hem: 0.46 + r() * 0.16,
          pack: g > 0.8,
        }
      : {
          outfit: o < 0.3 ? "coat" : "suit",
          hair: "short",
          bag: g < 0.24 ? 1 : g < 0.34 ? 2 : 0,
          hem: 0.5 + r() * 0.08,
          pack: g > 0.82,
        };
    crowd.push({
      x: side * (0.8 + r() * 2.7),
      z0: r() * SPAN,
      dir: r() < 0.55 ? -1 : 1,
      speed: 0.75 + r() * 0.6,
      height: female ? 1.58 + r() * 0.18 : 1.7 + r() * 0.22,
      build: 0.9 + r() * 0.22,
      look,
      phase0: r() * Math.PI * 2,
    });
  }
  return crowd;
}

function camera(vp: Viewport) {
  const f = vp.h * 0.95;
  // squeeze the street on narrow (portrait) screens so people stay in frame
  const lat = clamp(vp.w / vp.h / 1.5, 0.42, 1);
  // phones: drop the horizon so the headline has the sky to itself
  const horizon = vp.h * (isPortrait(vp) ? 0.64 : 0.47);
  return { f, lat, horizon, cx: focusX(vp) };
}

type Cam = ReturnType<typeof camera>;

function project(cam: Cam, X: number, Y: number, Z: number) {
  const s = cam.f / Z;
  return { x: cam.cx + X * s, y: cam.horizon + (CAM_H - Y) * s, s };
}

/* ------------------------------------------------------------------ */
/* static backdrop: sky glow, buildings, pavement — drawn once/resize  */
/* ------------------------------------------------------------------ */

export function paintStreetLayer(vp: Viewport, dpr: number) {
  const { canvas, ctx } = makeLayer(vp, dpr);
  const cam = camera(vp);
  const { w, h } = vp;
  const hz = cam.horizon / h;

  // overcast sky → bright haze at the end of the street → pavement that
  // darkens toward the viewer
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, grey(88));
  sky.addColorStop(hz * 0.5, grey(122));
  sky.addColorStop(Math.max(0, hz - 0.07), grey(178));
  sky.addColorStop(hz, grey(218));
  sky.addColorStop(Math.min(1, hz + 0.012), grey(168));
  sky.addColorStop(hz + (1 - hz) * 0.35, grey(132));
  sky.addColorStop(1, grey(92));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // the light at the end of the street
  const glow = ctx.createRadialGradient(cam.cx, cam.horizon, 0, cam.cx, cam.horizon, w * 0.55);
  glow.addColorStop(0, grey(255, 0.34));
  glow.addColorStop(0.3, grey(255, 0.12));
  glow.addColorStop(1, grey(255, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // pavement grid converging on the vanishing point
  ctx.lineWidth = 1;
  for (let k = -7; k <= 7; k++) {
    const X = k * 1.8 * cam.lat;
    const a = project(cam, X, 0, 1.2);
    const b = project(cam, X, 0, 90);
    ctx.strokeStyle = grey(255, Math.abs(k) === 3 ? 0.16 : 0.08);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.strokeStyle = grey(255, 0.07);
  for (let z = 2.2; z < 90; z *= 1.28) {
    const a = project(cam, -14, 0, z);
    const b = project(cam, 14, 0, z);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  // buildings lining both sides: dark and close, fading into the haze with distance
  const r = mulberry32(3);
  for (const side of [-1, 1]) {
    const X = side * 6.4 * cam.lat;
    let z = 3.5;
    const facades: { z1: number; z2: number; top: number }[] = [];
    while (z < 110) {
      const depth = 3 + r() * 7;
      facades.push({ z1: z, z2: z + depth, top: 7 + r() * 22 });
      z += depth + (r() < 0.25 ? 1.5 + r() * 3 : 0);
    }
    // far to near so nearer blocks overlap distant ones
    for (const b of facades.reverse()) {
      const p1 = project(cam, X, 0, b.z1);
      const p2 = project(cam, X, b.top, b.z1);
      const p3 = project(cam, X, b.top, b.z2);
      const p4 = project(cam, X, 0, b.z2);
      const haze = Math.pow(clamp(b.z1 / 80), 0.75);
      ctx.fillStyle = grey(lerp(58, 190, haze));
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = grey(255, 0.16 * (1 - haze * 0.6));
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.stroke();

      // lit windows, brighter than the facade but never panels of light
      const nearDim = clamp(b.z1 / 22, 0.35, 1);
      for (let wy = 2.6; wy < b.top - 1.2; wy += 3.2) {
        for (let wz = b.z1 + 0.8; wz < b.z2 - 1; wz += 2.3) {
          if (r() > 0.24) continue;
          const q1 = project(cam, X, wy, wz);
          const q2 = project(cam, X, wy + 1.5, wz);
          const q3 = project(cam, X, wy + 1.5, wz + 1.1);
          const q4 = project(cam, X, wy, wz + 1.1);
          ctx.fillStyle = grey(255, (0.1 + r() * 0.16) * nearDim * (1 - haze * 0.6));
          ctx.beginPath();
          ctx.moveTo(q1.x, q1.y);
          ctx.lineTo(q2.x, q2.y);
          ctx.lineTo(q3.x, q3.y);
          ctx.lineTo(q4.x, q4.y);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }

  return canvas;
}

/* ------------------------------------------------------------------ */
/* per-frame                                                           */
/* ------------------------------------------------------------------ */

/**
 * @param progress 0..1 page scroll progress (scrolling pushes the crowd on)
 * @param strolled metres walked on their own, so the street is never frozen
 * @param trail    0..1 how fast the page is scrolling (drives motion blur)
 */
export function drawCrowd(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  crowd: Walker[],
  progress: number,
  strolled: number,
  trail: number
) {
  const cam = camera(vp);
  const travelled = progress * WALK_DISTANCE + strolled;

  type Item = { z: number; draw: () => void };
  const items: Item[] = [];

  for (const w of crowd) {
    const X = Math.sign(w.x) * Math.max(0.62, Math.abs(w.x) * cam.lat);
    const dist = travelled * w.speed;
    const wrap = (d: number) => Z_NEAR + ((((w.z0 + w.dir * d) % SPAN) + SPAN) % SPAN);

    const z = wrap(dist);
    const visibility = smoothstep(Z_FAR, Z_FAR - 7, z) * smoothstep(Z_NEAR, Z_NEAR + 1.3, z);
    if (visibility <= 0.01) continue;

    // far figures melt into the haze, near ones are near-black
    const tone = lerp(16, 150, Math.pow(clamp((z - 2) / 30), 0.8));

    items.push({
      z,
      draw: () => {
        const ghostGap = 0.2 + trail * 1.3;
        // motion trail: earlier positions, fainter
        for (let g = 3; g >= 0; g--) {
          const d = dist - g * ghostGap;
          const zg = wrap(d);
          if (Math.abs(zg - z) > 6) continue; // skip across a wrap
          const alpha = g === 0 ? 1 : [0, 0.22, 0.11, 0.05][g] * (0.5 + trail);
          const p = project(cam, X, 0, zg);
          const path = new Path2D();
          addPerson(path, p.x, p.y, p.s, w.height, w.build, walkPose(w.phase0 + (d / STRIDE) * Math.PI * 2), w.look);
          ctx.fillStyle = grey(tone, clamp(alpha * visibility));
          ctx.fill(path, "nonzero");
        }
      },
    });
  }

  // the still figure, sharp and rim-lit, in depth order with the crowd
  items.push({
    z: HERO_Z,
    draw: () => {
      const p = project(cam, 0, 0, HERO_Z);

      const path = new Path2D();
      // slim, in a suit, ears just catching the glow, rucksack on his back
      const man = { outfit: "suit", hair: "short", ears: true, pack: true } as const;
      addPerson(path, p.x, p.y, p.s, 1.84, 0.92, STILL, man);

      // rim light: a lighter copy peeking out around the edge
      ctx.fillStyle = grey(245, 0.5);
      for (const [dx, dy] of [
        [0, -1.4],
        [-1.1, -0.4],
        [1.1, -0.4],
      ]) {
        ctx.save();
        ctx.translate(dx, dy);
        ctx.fill(path, "nonzero");
        ctx.restore();
      }
      ctx.fillStyle = grey(8);
      ctx.fill(path, "nonzero");
      drawBackpack(ctx, p.x, p.y, p.s, 1.84, 0.92, STILL);
    },
  });

  items.sort((a, b) => b.z - a.z);
  for (const it of items) it.draw();
}

import { clamp, grey, lerp, makeLayer, mulberry32, smoothstep, type Viewport } from "./util";

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
  coat: boolean;
  longHair: boolean;
  bag: 0 | 1 | 2;
  phase0: number;
}

export function createCrowd(seed = 11): Walker[] {
  const r = mulberry32(seed);
  const crowd: Walker[] = [];
  for (let i = 0; i < 30; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const bagRoll = r();
    crowd.push({
      x: side * (0.8 + r() * 2.7),
      z0: r() * SPAN,
      dir: r() < 0.55 ? -1 : 1,
      speed: 0.75 + r() * 0.6,
      height: 1.6 + r() * 0.3,
      build: 0.85 + r() * 0.3,
      coat: r() < 0.35,
      longHair: r() < 0.3,
      bag: bagRoll < 0.22 ? 1 : bagRoll < 0.4 ? 2 : 0,
      phase0: r() * Math.PI * 2,
    });
  }
  return crowd;
}

function camera(vp: Viewport) {
  const f = vp.h * 0.95;
  // squeeze the street on narrow (portrait) screens so people stay in frame
  const lat = clamp(vp.w / vp.h / 1.5, 0.42, 1);
  return { f, lat, horizon: vp.h * 0.47, cx: vp.w / 2 };
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

  // sky → glow at the horizon → dark pavement
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, grey(8));
  sky.addColorStop(0.3, grey(17));
  sky.addColorStop(0.47, grey(50));
  sky.addColorStop(0.56, grey(36));
  sky.addColorStop(0.78, grey(24));
  sky.addColorStop(1, grey(15));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // light at the end of the street
  const glow = ctx.createRadialGradient(cam.cx, cam.horizon, 0, cam.cx, cam.horizon, w * 0.6);
  glow.addColorStop(0, grey(255, 0.11));
  glow.addColorStop(0.35, grey(255, 0.035));
  glow.addColorStop(1, grey(255, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // pavement grid converging on the vanishing point
  ctx.lineWidth = 1;
  for (let k = -7; k <= 7; k++) {
    const X = k * 1.8 * cam.lat;
    const a = project(cam, X, 0, 1.2);
    const b = project(cam, X, 0, 90);
    ctx.strokeStyle = grey(255, Math.abs(k) === 3 ? 0.07 : 0.035);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.strokeStyle = grey(255, 0.03);
  for (let z = 2.2; z < 90; z *= 1.28) {
    const a = project(cam, -14, 0, z);
    const b = project(cam, 14, 0, z);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  // buildings lining both sides of the street
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
      ctx.fillStyle = grey(11);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = grey(255, 0.05);
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.stroke();

      // windows — dimmer up close so they never read as light panels
      const nearDim = clamp(b.z1 / 22, 0.3, 1);
      for (let wy = 2.6; wy < b.top - 1.2; wy += 3.2) {
        for (let wz = b.z1 + 0.8; wz < b.z2 - 1; wz += 2.3) {
          if (r() > 0.24) continue;
          const q1 = project(cam, X, wy, wz);
          const q2 = project(cam, X, wy + 1.5, wz);
          const q3 = project(cam, X, wy + 1.5, wz + 1.1);
          const q4 = project(cam, X, wy, wz + 1.1);
          ctx.fillStyle = grey(255, (0.04 + r() * 0.08) * nearDim);
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
/* figures                                                             */
/* ------------------------------------------------------------------ */

interface Pose {
  bob: number;
  sway: number;
  liftL: number;
  liftR: number;
  armL: number;
  armR: number;
}

const STILL: Pose = { bob: 0, sway: 0, liftL: 0, liftR: 0, armL: 0, armR: 0 };

function walkPose(phase: number): Pose {
  const s = Math.sin(phase);
  return {
    bob: 0.018 * Math.cos(phase * 2),
    sway: 0.016 * s,
    liftL: Math.max(0, s) * 0.09,
    liftR: Math.max(0, -s) * 0.09,
    armL: -s,
    armR: s,
  };
}

interface Look {
  coat?: boolean;
  longHair?: boolean;
  bag?: 0 | 1 | 2;
  /** the still figure: slim, arms close to the body, with ears */
  hero?: boolean;
}

/**
 * Adds a front/back-view person to `path`. Every sub-path winds clockwise,
 * so one nonzero fill paints the union without darkening where limbs overlap.
 */
function addPerson(
  path: Path2D,
  cx: number,
  footY: number,
  s: number,
  heightM: number,
  build: number,
  pose: Pose,
  look: Look
) {
  const k = heightM / 1.75;
  const b = build;
  const X = (u: number) => cx + (u + pose.sway) * s;
  const Y = (v: number) => footY - (v * k + pose.bob) * s;

  const M = (u: number, v: number) => path.moveTo(X(u), Y(v));
  const L = (u: number, v: number) => path.lineTo(X(u), Y(v));
  const Q = (cu: number, cv: number, u: number, v: number) =>
    path.quadraticCurveTo(X(cu), Y(cv), X(u), Y(v));
  const ell = (u: number, v: number, ru: number, rv: number) => {
    // start the ellipse as its own closed sub-path (no stray joining edge)
    path.moveTo(X(u) + ru * s, Y(v));
    path.ellipse(X(u), Y(v), ru * s, rv * s * k, 0, 0, Math.PI * 2);
    path.closePath();
  };

  // legs: tapered thigh → knee → calf → ankle
  for (const side of [-1, 1]) {
    const lift = side < 0 ? pose.liftL : pose.liftR;
    const c = side * 0.085 * b;
    const ankle = 0.075 + lift;
    M(c - 0.078 * b, 0.98);
    L(c + 0.078 * b, 0.98);
    Q(c + 0.07 * b, 0.64, c + 0.05, 0.5);
    Q(c + 0.06, 0.32, c + 0.034, ankle);
    L(c - 0.034, ankle);
    Q(c - 0.06, 0.32, c - 0.05, 0.5);
    Q(c - 0.07 * b, 0.64, c - 0.078 * b, 0.98);
    path.closePath();
    ell(c, ankle - 0.012, 0.046, 0.026); // shoe
  }

  // torso: sloping trapezius, rounded shoulders, waist, hips — a coat
  // continues to the knee with a slight A-line
  const hemV = look.coat ? 0.52 : 0.9;
  const hemW = (look.coat ? 0.2 : 0.168) * b;
  M(0.05, 1.5);
  Q(0.14 * b, 1.49, 0.2 * b, 1.44);
  Q(0.238 * b, 1.415, 0.226 * b, 1.3);
  Q(0.208 * b, 1.17, 0.162 * b, 1.06);
  Q(0.168 * b, look.coat ? 0.84 : 0.99, hemW, hemV);
  L(-hemW, hemV);
  Q(-0.168 * b, look.coat ? 0.84 : 0.99, -0.162 * b, 1.06);
  Q(-0.208 * b, 1.17, -0.226 * b, 1.3);
  Q(-0.238 * b, 1.415, -0.2 * b, 1.44);
  Q(-0.14 * b, 1.49, -0.05, 1.5);
  path.closePath();

  // arms: shoulder → slight elbow → wrist; a swinging arm reads as the hand rising
  for (const side of [-1, 1]) {
    const swing = side < 0 ? pose.armL : pose.armR;
    const sh = side * 0.205 * b;
    const el = side * (look.hero ? 0.232 : 0.238) * b;
    const wr = side * ((look.hero ? 0.234 : 0.243) * b + swing * 0.012);
    const wristV = 0.87 + Math.abs(swing) * 0.05;
    // rounded cap tucks under the shoulder curve; the outer edge is fuller
    const rw = side > 0 ? 1 : 0.8;
    const lw = side > 0 ? 0.8 : 1;
    M(sh - 0.045 * lw, 1.4);
    Q(sh, 1.455, sh + 0.045 * rw, 1.4);
    Q(el + 0.046 * rw, 1.22, el + 0.031 * rw, 1.12);
    Q(wr + 0.03, 1.0, wr + 0.022, wristV);
    L(wr - 0.022, wristV);
    Q(wr - 0.03, 1.0, el - 0.031 * lw, 1.12);
    Q(el - 0.046 * lw, 1.22, sh - 0.045 * lw, 1.4);
    path.closePath();
    ell(wr, wristV - 0.045, 0.027, 0.055); // hand

    if (look.bag === 1 && side > 0) {
      // briefcase seen edge-on, hanging from the hand
      path.rect(X(wr - 0.04), Y(wristV - 0.07), 0.08 * s, 0.28 * k * s);
    }
  }

  if (look.bag === 2) {
    // shoulder bag on the hip, with its strap
    M(-0.29 * b, 1.08);
    L(-0.14 * b, 1.08);
    Q(-0.12 * b, 0.9, -0.14 * b, 0.84);
    L(-0.29 * b, 0.84);
    Q(-0.31 * b, 0.9, -0.29 * b, 1.08);
    path.closePath();
    M(0.12 * b, 1.47);
    L(0.15 * b, 1.46);
    L(-0.2 * b, 1.07);
    L(-0.23 * b, 1.08);
    path.closePath();
  }

  // neck, head (a touch of hair volume at the crown) and, for the hero, ears
  M(-0.043, 1.585);
  L(0.043, 1.585);
  L(0.052, 1.47);
  L(-0.052, 1.47);
  path.closePath();
  ell(0, 1.645, 0.078, 0.1);
  ell(0, 1.69, 0.08, 0.07);
  if (look.hero) {
    ell(-0.078, 1.635, 0.017, 0.032);
    ell(0.078, 1.635, 0.017, 0.032);
  }
  if (look.longHair) {
    M(-0.085, 1.67);
    L(0.085, 1.67);
    Q(0.125, 1.5, 0.1, 1.37);
    Q(0, 1.33, -0.1, 1.37);
    Q(-0.125, 1.5, -0.085, 1.67);
    path.closePath();
  }
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
    const tone = lerp(2, 30, Math.pow(clamp((z - 2) / 30), 0.8));

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
          addPerson(path, p.x, p.y, p.s, w.height, w.build, walkPose(w.phase0 + (d / STRIDE) * Math.PI * 2), {
            coat: w.coat,
            longHair: w.longHair,
            bag: w.bag,
          });
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

      // soft shadow stretching toward the viewer (the light is ahead of him)
      const tip = project(cam, 0, 0, HERO_Z - 1.6);
      const len = tip.y - p.y;
      ctx.save();
      ctx.translate(p.x, p.y + len * 0.42);
      ctx.scale(0.36 * p.s, len * 0.6);
      const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      shadow.addColorStop(0, grey(0, 0.6));
      shadow.addColorStop(1, grey(0, 0));
      ctx.fillStyle = shadow;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const path = new Path2D();
      addPerson(path, p.x, p.y, p.s, 1.84, 0.84, STILL, { hero: true });

      // rim light: a lighter copy peeking out around the edge
      ctx.fillStyle = grey(150, 0.36);
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
      ctx.fillStyle = grey(4);
      ctx.fill(path, "nonzero");
    },
  });

  items.sort((a, b) => b.z - a.z);
  for (const it of items) it.draw();
}

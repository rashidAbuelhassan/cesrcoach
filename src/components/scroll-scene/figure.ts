/*
 * Realistic people seen from straight behind (or in front), as one smooth
 * outline per person — the way a silhouette is cut, not assembled from
 * shapes. The outline is traced through anatomical landmarks (crown, nape,
 * trapezius, deltoid, elbow, wrist, fingers, waist, hip, knee, calf, ankle,
 * heel) and smoothed with a Catmull-Rom spline, so arms leave a gap of light
 * against the waist, legs taper from thigh to ankle, and clothing changes
 * the outline instead of being bolted on.
 *
 * Units are metres for a 1.75 m person: u lateral (right is +), v up.
 */

import { grey } from "./util";

type Pt = [number, number];

export type Outfit = "suit" | "trousers" | "coat" | "skirt";
export type Hair = "short" | "long" | "bun" | "pony";

export interface Look {
  female?: boolean;
  outfit?: Outfit;
  hair?: Hair;
  /** 0 none, 1 briefcase in the right hand, 2 bag on the left shoulder */
  bag?: 0 | 1 | 2;
  /** skirt / coat hem height in metres */
  hem?: number;
  /** the still figure: ears just visible against the glow */
  ears?: boolean;
  /** a rucksack on the back (the outline only; see drawBackpack for the detail) */
  pack?: boolean;
}

export interface Pose {
  bob: number;
  sway: number;
  liftL: number;
  liftR: number;
  armL: number;
  armR: number;
}

export const STILL: Pose = { bob: 0, sway: 0, liftL: 0, liftR: 0, armL: 0, armR: 0 };

export function walkPose(phase: number): Pose {
  const s = Math.sin(phase);
  return {
    bob: 0.016 * Math.cos(phase * 2),
    sway: 0.014 * s,
    liftL: Math.max(0, s) * 0.085,
    liftR: Math.max(0, -s) * 0.085,
    armL: -s,
    armR: s,
  };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** One side of the body, from beside the crown down to beside the crotch. */
function halfOutline(look: Look, build: number, lift: number, swing: number): Pt[] {
  const f = !!look.female;
  const b = build;
  const out: Pt[] = [];
  const push = (u: number, v: number) => out.push([u, v]);

  // ---- head, nape, neck ----
  const hw = 0.92 + 0.08 * b;
  push(0.044 * hw, 1.748);
  push(0.074 * hw, 1.728);
  push(0.09 * hw, 1.695);
  push(0.095 * hw, 1.655);
  if (look.hair === "long") {
    // hair falls past the jaw onto the shoulders
    push(0.101, 1.6);
    push(0.106, 1.535);
    push(0.11, 1.48);
  } else {
    if (look.ears) {
      push(0.102 * hw, 1.648);
      push(0.096 * hw, 1.618);
    }
    push(0.087 * hw, 1.6);
    push(0.072 * hw, 1.57);
    push(0.062, 1.545);
  }

  // ---- shoulders: trapezius slope into a rounded deltoid ----
  const sh = (f ? 0.188 : 0.222) * b;
  const A = sh + 0.004; // outer line of the arm
  push(look.hair === "long" ? 0.125 : 0.085, look.hair === "long" ? 1.47 : 1.505);
  push(0.135 * b, 1.48);
  push(sh - 0.024, 1.458);
  push(sh, 1.425);

  // ---- arm, down the outside, round the hand, up the inside ----
  // a swinging arm, seen from behind, reads as the hand rising
  const raise = Math.abs(swing) * 0.07;
  const aw = f ? 0.86 : 1; // slimmer arms
  const arm = (u: number, v: number) => {
    const t = clamp01((1.37 - v) / 0.6);
    push(u + t * 0.03, v + raise * t);
  };
  arm(A, 1.37);
  arm(A + 0.002, 1.29);
  arm(A, 1.2);
  arm(A - 0.004, 1.1); // elbow
  arm(A - 0.004, 1.0);
  arm(A - 0.01, 0.905); // wrist
  arm(A - 0.006, 0.86);
  arm(A - 0.009, 0.81);
  arm(A - 0.02, 0.765); // fingertips
  arm(A - 0.034, 0.77);
  arm(A - 0.042 * aw, 0.815);
  arm(A - 0.04 * aw, 0.9);
  arm(A - 0.044 * aw, 1.0);
  arm(A - 0.048 * aw, 1.1);
  arm(A - 0.05 * aw, 1.2);
  arm(A - 0.058 * aw, 1.3); // armpit

  // ---- torso: chest, waist, hips ----
  const waist = (f ? 0.122 : 0.148) * b;
  const hip = (f ? 0.174 : 0.162) * b;
  // the torso stays inside the line of the inner arm, so light shows between
  push(Math.min(waist + (f ? 0.034 : 0.03), A - 0.066), 1.24);
  push(Math.min(waist + 0.012, A - 0.07), 1.14);
  push(waist, 1.05);
  push(hip - 0.006, 0.96);
  push(hip, 0.9);

  // ---- legs ----
  const thigh = (f ? 0.166 : 0.158) * b;
  const knee = f ? 0.116 : 0.127;
  const calf = f ? 0.11 : 0.12;
  const ankle = f ? 0.08 : 0.088;
  // the swinging leg's foot comes up off the ground; the knee barely moves
  const leg = (u: number, v: number) => push(u, v + lift * clamp01((0.58 - v) / 0.58));

  const hem = look.outfit === "coat" || look.outfit === "skirt" ? (look.hem ?? 0.52) : null;
  if (hem !== null) {
    const flare = hip + (look.outfit === "skirt" ? 0.045 : 0.03);
    push(hip + 0.012, (0.9 + hem) / 2 + 0.06);
    push(flare, hem + 0.035);
    push(flare - 0.006, hem);
    // under the hem the outline steps in to the leg
    leg(Math.min(knee + 0.01, flare - 0.03), hem - 0.012);
  } else {
    if (look.outfit === "suit") push(hip + 0.008, 0.84); // jacket hem over the hips
    leg(thigh, 0.8);
    leg(thigh - 0.012, 0.7);
    leg(knee + 0.004, 0.58);
  }
  const below = (v: number) => hem === null || v < hem - 0.025;
  if (below(0.5)) leg(knee, 0.5);
  if (below(0.4)) leg(calf, 0.4);
  leg(calf - 0.012, 0.3);
  leg(ankle + 0.005, 0.17);
  leg(ankle, 0.1);
  // shoe: heel counter, sole, toe tucked under
  leg(ankle + 0.012, 0.055);
  leg(ankle + 0.01, 0.015);
  leg(ankle - 0.012, 0);
  leg(0.05, 0);
  leg(0.042, 0.02);
  // inner leg back up
  leg(0.044, 0.1);
  leg(0.048, 0.2);
  leg(0.054, 0.33);
  if (below(0.45)) leg(0.05, 0.45);
  if (below(0.55)) leg(0.044, 0.55);
  if (below(0.66)) leg(0.038, 0.66);
  if (below(0.75)) leg(0.026, 0.75);
  return out;
}

/** Closed Catmull-Rom spline through screen points, as cubic béziers. */
function smoothClosed(path: Path2D, pts: Pt[]) {
  const n = pts.length;
  path.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    path.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6,
      p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6,
      p2[1] - (p3[1] - p1[1]) / 6,
      p2[0],
      p2[1]
    );
  }
  path.closePath();
}

/**
 * Adds a person to `path`, feet at (cx, footY), `s` pixels per metre.
 * Every sub-path winds clockwise on screen, so one nonzero fill paints the
 * union (outline + hair bun + bag) without darkening where they overlap.
 */
export function addPerson(
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
  const X = (u: number) => cx + (u + pose.sway) * s;
  const Y = (v: number) => footY - (v * k + pose.bob) * s;
  const toScreen = (pts: Pt[]): Pt[] => pts.map(([u, v]) => [X(u), Y(v)]);
  const polygon = (pts: Pt[]) => {
    const p = toScreen(pts);
    path.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) path.lineTo(p[i][0], p[i][1]);
    path.closePath();
  };

  const right = halfOutline(look, build, pose.liftR, pose.armR);
  const left = halfOutline(look, build, pose.liftL, pose.armL)
    .map(([u, v]): Pt => [-u, v])
    .reverse();
  const crotchV = look.outfit === "coat" || look.outfit === "skirt" ? (look.hem ?? 0.52) - 0.008 : 0.79;
  smoothClosed(path, toScreen([[0, 1.756], ...right, [0, crotchV], ...left]));

  const ellipse = (u: number, v: number, ru: number, rv: number) => {
    path.moveTo(X(u) + ru * s, Y(v));
    path.ellipse(X(u), Y(v), ru * s, rv * k * s, 0, 0, Math.PI * 2);
    path.closePath();
  };

  if (look.hair === "bun") ellipse(0, 1.742, 0.04, 0.04);
  if (look.hair === "pony") {
    smoothClosed(path, toScreen([[0, 1.66], [0.03, 1.6], [0.022, 1.5], [0, 1.47], [-0.022, 1.5], [-0.03, 1.6]]));
  }

  if (look.pack) {
    const hw = (look.female ? 0.14 : 0.158) * build;
    const top = 1.405;
    const bot = 0.93;
    const c = 0.045;
    // the pack itself, with softened corners
    polygon([
      [-hw + c, top], [hw - c, top], [hw, top - c], [hw * 0.96, bot + 0.05],
      [hw * 0.96 - 0.04, bot], [-hw * 0.96 + 0.04, bot], [-hw * 0.96, bot + 0.05], [-hw, top - c],
    ]);
    // and the two shoulder straps that climb over the shoulders
    polygon([[0.066 * build, 1.497], [0.126 * build, 1.476], [0.122 * build, top], [0.07 * build, top]]);
    polygon([[-0.126 * build, 1.476], [-0.066 * build, 1.497], [-0.07 * build, top], [-0.122 * build, top]]);
  }

  if (look.bag === 1) {
    // briefcase hanging from the right hand, seen edge-on
    const hu = (look.female ? 0.188 : 0.222) * build + 0.004 - 0.022 + 0.03;
    const hv = 0.8 + Math.abs(pose.armR) * 0.07 * 0.72;
    polygon([[hu - 0.036, hv], [hu + 0.036, hv], [hu + 0.04, hv - 0.29], [hu - 0.04, hv - 0.29]]);
  }
  if (look.bag === 2) {
    // strap across the back from the right shoulder, bag on the left hip
    const hip = (look.female ? 0.174 : 0.162) * build;
    polygon([[0.11, 1.47], [0.14, 1.462], [-hip + 0.02, 1.06], [-hip - 0.005, 1.07]]);
    smoothClosed(path, toScreen([[-hip - 0.085, 1.07], [-hip + 0.02, 1.07], [-hip + 0.03, 0.84], [-hip - 0.095, 0.84]]));
  }
}

/**
 * The standing man's rucksack, seen from behind, drawn over his silhouette:
 * shoulder straps, top handle, a flap, compression strap, front zip pocket
 * and a water bottle in the side pocket.
 */
export function drawBackpack(
  ctx: CanvasRenderingContext2D,
  cx: number,
  footY: number,
  s: number,
  heightM: number,
  build: number,
  pose: Pose
) {
  const k = heightM / 1.75;
  const X = (u: number) => cx + (u + pose.sway) * s;
  const Y = (v: number) => footY - (v * k + pose.bob) * s;
  const b = build;
  const hw = 0.158 * b;
  const top = 1.405;
  const bot = 0.93;
  const edge = Math.max(1, 0.0055 * s);

  const poly = (pts: Pt[]) => {
    ctx.beginPath();
    pts.forEach(([u, v], i) => (i ? ctx.lineTo(X(u), Y(v)) : ctx.moveTo(X(u), Y(v))));
    ctx.closePath();
  };
  // rounded rectangle from (u0, v0 top) to (u1, v1 bottom)
  const rr = (u0: number, v0: number, u1: number, v1: number, r: number) => {
    const x0 = X(u0), x1 = X(u1), y0 = Y(v0), y1 = Y(v1), rad = r * s;
    ctx.beginPath();
    ctx.moveTo(x0 + rad, y0);
    ctx.arcTo(x1, y0, x1, y1, rad);
    ctx.arcTo(x1, y1, x0, y1, rad);
    ctx.arcTo(x0, y1, x0, y0, rad);
    ctx.arcTo(x0, y0, x1, y0, rad);
    ctx.closePath();
  };
  const rim = (alpha: number) => {
    ctx.strokeStyle = grey(205, alpha);
    ctx.lineWidth = edge;
    ctx.stroke();
  };

  // shoulder straps, rising from the top of the pack to the shoulders
  for (const sd of [-1, 1]) {
    poly([
      [sd * 0.066 * b, 1.497], [sd * 0.126 * b, 1.476], [sd * 0.122 * b, top + 0.01], [sd * 0.07 * b, top + 0.01],
    ]);
    ctx.fillStyle = grey(50);
    ctx.fill();
    rim(0.4);
  }

  // water bottle in the side pocket, on his left
  rr(-hw - 0.04, bot + 0.27, -hw + 0.03, bot + 0.02, 0.026);
  ctx.fillStyle = grey(44);
  ctx.fill();
  rim(0.45);
  rr(-hw - 0.026, bot + 0.335, -hw + 0.01, bot + 0.265, 0.012);
  ctx.fillStyle = grey(78);
  ctx.fill();
  rim(0.5);

  // main body, a little lighter at the top where the lamp catches it
  const body = ctx.createLinearGradient(0, Y(top), 0, Y(bot));
  body.addColorStop(0, grey(66));
  body.addColorStop(1, grey(38));
  rr(-hw, top, hw, bot, 0.055);
  ctx.fillStyle = body;
  ctx.fill();
  rim(0.55);

  // top flap with its lower edge
  rr(-hw, top, hw, top - 0.16, 0.05);
  ctx.fillStyle = grey(74);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(X(-hw + 0.02), Y(top - 0.16));
  ctx.lineTo(X(hw - 0.02), Y(top - 0.16));
  ctx.strokeStyle = grey(14, 0.8);
  ctx.lineWidth = edge * 1.4;
  ctx.stroke();

  // compression strap with a buckle
  ctx.fillStyle = grey(30);
  ctx.fillRect(X(-hw), Y(1.13) - edge, 2 * hw * s, edge * 2.2);
  rr(-0.05, 1.155, -0.012, 1.105, 0.008);
  ctx.fillStyle = grey(120);
  ctx.fill();

  // front pocket and its zip
  rr(-hw * 0.78, bot + 0.2, hw * 0.78, bot + 0.04, 0.03);
  ctx.strokeStyle = grey(190, 0.5);
  ctx.lineWidth = edge;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(X(-hw * 0.7), Y(bot + 0.185));
  ctx.lineTo(X(hw * 0.7), Y(bot + 0.185));
  ctx.strokeStyle = grey(210, 0.6);
  ctx.setLineDash([edge * 1.2, edge * 1.2]);
  ctx.stroke();
  ctx.setLineDash([]);

  // grab handle
  ctx.beginPath();
  ctx.moveTo(X(-0.034), Y(top + 0.002));
  ctx.quadraticCurveTo(X(0), Y(top + 0.062), X(0.034), Y(top + 0.002));
  ctx.strokeStyle = grey(170, 0.75);
  ctx.lineWidth = edge * 1.8;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.lineCap = "butt";
}

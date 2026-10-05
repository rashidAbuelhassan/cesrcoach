import { clamp, focusX, grey, isPortrait, lerp, makeLayer, mulberry32, type Viewport } from "./util";

/*
 * Scene 2 — loose papers blow in and settle, one by one, into an open
 * folder lying on a desk under a lamp.
 *
 * Units are metres: X lateral, Y height above the desk top, D depth away
 * from the camera, which sits CAM_H above the desk looking down at it.
 */

const CAM_H = 0.6;
const PAPER_W = 0.105; // half-width  (A4 210mm)
const PAPER_L = 0.1485; // half-length (A4 297mm)
const FOLDER = { spine: 0.02, d1: 1.19, d2: 1.51, half: 0.23 };
const TARGET = { x: 0.135, d: 1.35 };
const PAPERS = 14;

function camera(vp: Viewport) {
  // size off the shorter dimension so the folder always fits on screen
  const U = Math.min(vp.h, vp.w * 1.15);
  const A = 0.98 * U; // CAM_H × focal length
  const f = A / CAM_H;
  return { f, y0: vp.h * (isPortrait(vp) ? 0.7 : 0.6) - A / TARGET.d, cx: focusX(vp) };
}

type Cam = ReturnType<typeof camera>;

function project(cam: Cam, X: number, Y: number, D: number) {
  const s = cam.f / D;
  return { x: cam.cx + X * s, y: cam.y0 + (CAM_H - Y) * s, s };
}

function quad(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

/* ------------------------------------------------------------------ */
/* static set: wall, desk, lamp, folder, mug, pen — drawn once/resize  */
/* ------------------------------------------------------------------ */

export function paintDeskLayer(vp: Viewport, dpr: number) {
  const { canvas, ctx } = makeLayer(vp, dpr);
  const cam = camera(vp);
  const { w, h } = vp;
  const P = (X: number, Y: number, D: number) => project(cam, X, Y, D);

  const farD = 2.3;
  const farY = P(0, 0, farD).y;

  // wall
  const wall = ctx.createLinearGradient(0, 0, 0, farY);
  wall.addColorStop(0, grey(90));
  wall.addColorStop(1, grey(124));
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, farY + 1);

  // a framed certificate on the wall — the destination
  const f1 = P(0.42, 0.44, farD);
  const f2 = P(0.84, 0.24, farD);
  ctx.fillStyle = grey(62);
  ctx.fillRect(f1.x, f1.y, f2.x - f1.x, f2.y - f1.y);
  const inset = (f2.x - f1.x) * 0.07;
  ctx.fillStyle = grey(176);
  ctx.fillRect(f1.x + inset, f1.y + inset, f2.x - f1.x - inset * 2, f2.y - f1.y - inset * 2);
  ctx.strokeStyle = grey(255, 0.22);
  ctx.lineWidth = 1;
  ctx.strokeRect(f1.x, f1.y, f2.x - f1.x, f2.y - f1.y);
  ctx.fillStyle = grey(50, 0.4);
  const lineW = f2.x - f1.x - inset * 4;
  for (let i = 0; i < 4; i++) {
    const yy = f1.y + inset * 2.2 + i * (f2.y - f1.y) * 0.15;
    ctx.fillRect(f1.x + inset * 2 + (i === 0 ? lineW * 0.2 : 0), yy, lineW * (i === 0 ? 0.6 : 1 - i * 0.12), Math.max(1, (f2.y - f1.y) * 0.03));
  }

  // desk top
  const desk = ctx.createLinearGradient(0, farY, 0, h);
  desk.addColorStop(0, grey(122));
  desk.addColorStop(1, grey(74));
  ctx.fillStyle = desk;
  quad(ctx, [P(-3, 0, farD), P(3, 0, farD), P(3, 0, 0.35), P(-3, 0, 0.35)]);
  ctx.fill();

  // wood grain
  const r = mulberry32(21);
  ctx.lineWidth = 1;
  for (let i = 0; i < 46; i++) {
    const D = lerp(0.45, farD, Math.pow(r(), 0.8));
    const amp = 0.004 + r() * 0.01;
    const freq = 2 + r() * 5;
    ctx.strokeStyle = grey(255, 0.05 + r() * 0.07);
    ctx.beginPath();
    for (let X = -3; X <= 3; X += 0.05) {
      const p = P(X, 0, D + Math.sin(X * freq + i) * amp);
      if (X === -3) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  // far edge highlight
  ctx.strokeStyle = grey(255, 0.3);
  ctx.beginPath();
  ctx.moveTo(0, farY);
  ctx.lineTo(w, farY);
  ctx.stroke();

  // pool of lamplight on the folder
  const c = P(TARGET.x - 0.05, 0, TARGET.d);
  const pool = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.max(w, h) * 0.5);
  pool.addColorStop(0, grey(255, 0.3));
  pool.addColorStop(0.4, grey(255, 0.1));
  pool.addColorStop(1, grey(255, 0));
  ctx.fillStyle = pool;
  ctx.fillRect(0, farY, w, h - farY);

  // open folder: soft shadow, board thickness, then the two inner panels
  const { spine, d1, d2, half } = FOLDER;
  ctx.fillStyle = grey(0, 0.4);
  quad(ctx, [P(-half + 0.01, 0, d2 + 0.012), P(spine + half + 0.02, 0, d2 + 0.012), P(spine + half + 0.03, 0, d1 - 0.018), P(-half + 0.015, 0, d1 - 0.018)]);
  ctx.fill();
  ctx.fillStyle = grey(118);
  quad(ctx, [P(-half, 0.004, d2), P(spine + half, 0.004, d2), P(spine + half, 0, d1), P(-half, 0, d1)]);
  ctx.fill();
  // left panel (inside of the front cover)
  ctx.fillStyle = grey(178);
  quad(ctx, [P(-half, 0.004, d2), P(spine, 0.004, d2), P(spine, 0.004, d1), P(-half, 0.004, d1)]);
  ctx.fill();
  // right panel (inside of the back cover) with its index tab
  ctx.fillStyle = grey(194);
  quad(ctx, [P(spine, 0.004, d2), P(spine + half, 0.004, d2), P(spine + half, 0.004, d1), P(spine, 0.004, d1)]);
  ctx.fill();
  quad(ctx, [P(0.12, 0.004, d2 + 0.035), P(spine + half - 0.012, 0.004, d2 + 0.035), P(spine + half - 0.012, 0.004, d2), P(0.12, 0.004, d2)]);
  ctx.fill();
  // crease
  ctx.strokeStyle = grey(0, 0.32);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  const s1 = P(spine, 0.004, d1);
  const s2 = P(spine, 0.004, d2);
  ctx.moveTo(s1.x, s1.y);
  ctx.lineTo(s2.x, s2.y);
  ctx.stroke();

  // label on the inside cover, foreshortened with the desk
  const lab = P(-half / 2 + spine / 2, 0.004, 1.44);
  const labW = 0.19 * lab.s;
  ctx.fillStyle = grey(238);
  ctx.save();
  ctx.translate(lab.x, lab.y);
  ctx.scale(1, CAM_H / 1.44);
  ctx.fillRect(-labW / 2, -0.028 * lab.s, labW, 0.056 * lab.s);
  ctx.fillStyle = grey(30, 0.9);
  ctx.font = `600 ${Math.max(7, 0.019 * lab.s)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CESR PORTFOLIO", 0, 0);
  ctx.restore();

  // pen resting beside the folder
  const pa = P(0.31, 0.006, 1.24);
  const pb = P(0.5, 0.006, 1.33);
  ctx.lineCap = "round";
  ctx.strokeStyle = grey(0, 0.3);
  ctx.lineWidth = 0.011 * pa.s;
  ctx.beginPath();
  ctx.moveTo(pa.x + 3, pa.y + 3);
  ctx.lineTo(pb.x + 3, pb.y + 3);
  ctx.stroke();
  ctx.strokeStyle = grey(26);
  ctx.beginPath();
  ctx.moveTo(pa.x, pa.y);
  ctx.lineTo(pb.x, pb.y);
  ctx.stroke();
  ctx.strokeStyle = grey(255, 0.4);
  ctx.lineWidth = Math.max(0.6, 0.002 * pa.s);
  ctx.beginPath();
  ctx.moveTo(pa.x, pa.y - 0.003 * pa.s);
  ctx.lineTo(pb.x, pb.y - 0.003 * pb.s);
  ctx.stroke();

  // mug
  const mug = { x: 0.5, d: 1.62, r: 0.045, h: 0.1 };
  const top = P(mug.x, mug.h, mug.d);
  const bot = P(mug.x, 0, mug.d);
  const rx = mug.r * top.s;
  const ryTop = rx * ((CAM_H - mug.h) / mug.d);
  const ryBot = rx * (CAM_H / mug.d);
  ctx.fillStyle = grey(0, 0.3);
  ctx.beginPath();
  ctx.ellipse(bot.x + rx * 0.35, bot.y + ryBot * 0.3, rx * 1.2, ryBot * 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = grey(222);
  ctx.beginPath();
  ctx.moveTo(top.x - rx, top.y);
  ctx.lineTo(bot.x - rx, bot.y);
  ctx.ellipse(bot.x, bot.y, rx, ryBot, 0, Math.PI, 0, true);
  ctx.lineTo(top.x + rx, top.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = grey(212);
  ctx.lineWidth = 0.011 * top.s;
  ctx.beginPath();
  ctx.ellipse(top.x + rx * 1.15, (top.y + bot.y) / 2, rx * 0.42, (bot.y - top.y) * 0.3, 0, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.fillStyle = grey(54);
  ctx.beginPath();
  ctx.ellipse(top.x, top.y, rx, ryTop, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = grey(255, 0.7);
  ctx.lineWidth = 1;
  ctx.stroke();

  // desk lamp on the left, arching over the folder
  const base = P(-0.72, 0, 1.85);
  const elbow = P(-0.66, 0.3, 1.72);
  const head = P(-0.38, 0.4, 1.5);
  const aim = P(TARGET.x - 0.05, 0, TARGET.d);
  ctx.fillStyle = grey(34);
  ctx.beginPath();
  ctx.ellipse(base.x, base.y, 0.085 * base.s, 0.085 * base.s * (CAM_H / 1.85), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = grey(38);
  ctx.lineWidth = 0.016 * elbow.s;
  ctx.beginPath();
  ctx.moveTo(base.x, base.y - 0.02 * base.s);
  ctx.lineTo(elbow.x, elbow.y);
  ctx.lineTo(head.x, head.y);
  ctx.stroke();
  ctx.strokeStyle = grey(255, 0.28);
  ctx.lineWidth = 1;
  ctx.stroke();

  // shade pointing at the folder, and the beam it throws
  const dx = aim.x - head.x;
  const dy = aim.y - head.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const shadeL = 0.13 * head.s;
  const mouth = { x: head.x + ux * shadeL, y: head.y + uy * shadeL };
  const wide = 0.085 * head.s;
  const narrow = 0.03 * head.s;

  const beam = ctx.createLinearGradient(mouth.x, mouth.y, aim.x, aim.y);
  beam.addColorStop(0, grey(255, 0.15));
  beam.addColorStop(1, grey(255, 0));
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(mouth.x + nx * wide, mouth.y + ny * wide);
  ctx.lineTo(aim.x + nx * len * 0.36, aim.y + ny * len * 0.14);
  ctx.lineTo(aim.x - nx * len * 0.36, aim.y - ny * len * 0.14);
  ctx.lineTo(mouth.x - nx * wide, mouth.y - ny * wide);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = grey(48);
  ctx.beginPath();
  ctx.moveTo(head.x + nx * narrow, head.y + ny * narrow);
  ctx.lineTo(mouth.x + nx * wide, mouth.y + ny * wide);
  ctx.lineTo(mouth.x - nx * wide, mouth.y - ny * wide);
  ctx.lineTo(head.x - nx * narrow, head.y - ny * narrow);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = grey(255, 0.38);
  ctx.stroke();

  const bulb = ctx.createRadialGradient(mouth.x, mouth.y, 0, mouth.x, mouth.y, wide * 1.6);
  bulb.addColorStop(0, grey(255, 0.55));
  bulb.addColorStop(0.3, grey(255, 0.12));
  bulb.addColorStop(1, grey(255, 0));
  ctx.fillStyle = bulb;
  ctx.beginPath();
  ctx.arc(mouth.x, mouth.y, wide * 1.6, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

/* ------------------------------------------------------------------ */
/* papers                                                              */
/* ------------------------------------------------------------------ */

interface Paper {
  startScreen: { x: number; y: number; D: number };
  drift: { X: number; D: number };
  target: { X: number; D: number; yaw: number };
  yaw0: number;
  pitch0: number;
  roll0: number;
  phase: number[];
  shade: number;
  lines: number[];
  window: [number, number];
}

export function createPapers(seed = 5): Paper[] {
  const r = mulberry32(seed);
  const papers: Paper[] = [];
  for (let i = 0; i < PAPERS; i++) {
    const fromTop = r() < 0.62;
    const side = r() < 0.5 ? -1 : 1;
    const begin = 0.02 + (i / PAPERS) * 0.52;
    papers.push({
      // screen-space launch point, resolved against the viewport later —
      // always well outside the frame so waiting papers stay hidden
      startScreen: fromTop
        ? { x: r(), y: -0.35 - r() * 0.3, D: 0.95 + r() * 1.2 }
        : { x: side < 0 ? -0.35 : 1.35, y: r() * 0.45, D: 0.95 + r() * 1.2 },
      drift: { X: (r() - 0.5) * 0.5, D: (r() - 0.5) * 0.3 },
      target: {
        X: TARGET.x + (r() - 0.5) * 0.014,
        D: TARGET.d + (r() - 0.5) * 0.014,
        yaw: (r() - 0.5) * 0.12,
      },
      yaw0: (r() - 0.5) * 3,
      pitch0: (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.8),
      roll0: (r() < 0.5 ? -1 : 1) * (0.4 + r() * 0.8),
      phase: [r() * 6.3, r() * 6.3, r() * 6.3, r() * 6.3, r() * 6.3],
      shade: (r() - 0.5) * 14,
      lines: Array.from({ length: 9 }, () => 0.45 + r() * 0.55),
      window: [begin, begin + 0.26],
    });
  }
  return papers;
}

type V3 = [number, number, number];

function rotate(p: V3, yaw: number, pitch: number, roll: number): V3 {
  let [x, y, d] = p;
  // roll about the depth axis
  let c = Math.cos(roll);
  let s = Math.sin(roll);
  [x, y] = [x * c - y * s, x * s + y * c];
  // pitch about the lateral axis
  c = Math.cos(pitch);
  s = Math.sin(pitch);
  [y, d] = [y * c - d * s, y * s + d * c];
  // yaw about the vertical axis
  c = Math.cos(yaw);
  s = Math.sin(yaw);
  [x, d] = [x * c + d * s, -x * s + d * c];
  return [x, y, d];
}

const LIGHT: V3 = (() => {
  const v: V3 = [-0.35, 0.85, -0.4];
  const m = Math.hypot(...v);
  return [v[0] / m, v[1] / m, v[2] / m];
})();

/**
 * @param progress 0..1 through the paper sequence
 */
export function drawPapers(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  papers: Paper[],
  progress: number
) {
  const cam = camera(vp);

  papers.forEach((paper, i) => {
    const [a, b] = paper.window;
    const u = clamp((progress - a) / (b - a));
    if (u <= 0) return;

    // launch point in world space for this viewport
    const { x: sxF, y: syF, D: D0 } = paper.startScreen;
    const sx = sxF * vp.w;
    const sy = syF * vp.h;
    const start = {
      X: ((sx - cam.cx) * D0) / cam.f,
      Y: CAM_H - ((sy - cam.y0) * D0) / cam.f,
      D: D0,
    };
    const landY = 0.0045 + i * 0.0009;

    // eased flight along a curve that hovers over the folder before landing
    const e = 1 - Math.pow(1 - u, 2.4);
    const hover = { X: paper.target.X + paper.drift.X, Y: landY + 0.32, D: paper.target.D + paper.drift.D };
    const q = (p0: number, p1: number, p2: number) =>
      (1 - e) * (1 - e) * p0 + 2 * (1 - e) * e * p1 + e * e * p2;
    const settle = Math.pow(1 - u, 1.4);
    const X = q(start.X, hover.X, paper.target.X) + Math.sin(u * 9 + paper.phase[0]) * 0.1 * settle;
    const Y = q(start.Y, hover.Y, landY) + Math.sin(u * 14 + paper.phase[1]) * 0.03 * settle;
    const D = q(start.D, hover.D, paper.target.D);

    const yaw = lerp(paper.yaw0, paper.target.yaw, e) + Math.sin(u * 7 + paper.phase[2]) * 0.7 * settle;
    const pitch = paper.pitch0 * settle * Math.cos(u * 10 + paper.phase[3]);
    const roll = paper.roll0 * settle * Math.sin(u * 8.5 + paper.phase[4]);

    const local: V3[] = [
      [-PAPER_W, 0, PAPER_L],
      [PAPER_W, 0, PAPER_L],
      [PAPER_W, 0, -PAPER_L],
      [-PAPER_W, 0, -PAPER_L],
    ];
    const world = local.map((p) => {
      const [x, y, d] = rotate(p, yaw, pitch, roll);
      return { X: X + x, Y: Y + y, D: D + d };
    });

    // shadow on the desk, darker as the sheet comes down
    const height = Math.max(0, Y - landY);
    const shadowA = 0.32 * clamp(1 - height / 0.45);
    if (shadowA > 0.01 && u < 0.999) {
      ctx.fillStyle = grey(0, shadowA);
      quad(
        ctx,
        world.map((p) => project(cam, p.X + height * 0.35, 0, p.D + height * 0.2))
      );
      ctx.fill();
    }

    const pts = world.map((p) => project(cam, p.X, p.Y, p.D));

    // flat-shaded: brightness follows how squarely the sheet faces the lamp
    const n = rotate([0, 1, 0], yaw, pitch, roll);
    const lit = Math.abs(n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
    const tone = lerp(168, 252, lit) + paper.shade;
    ctx.fillStyle = grey(tone);
    quad(ctx, pts);
    ctx.fill();
    ctx.strokeStyle = grey(0, 0.28);
    ctx.lineWidth = 0.7;
    ctx.stroke();

    // typed lines, so each sheet reads as a document
    ctx.strokeStyle = grey(0, 0.26);
    ctx.lineWidth = Math.max(0.5, 0.0024 * pts[0].s);
    paper.lines.forEach((len, li) => {
      const d = PAPER_L * 0.72 - li * (PAPER_L * 0.16);
      const x0 = -PAPER_W * 0.72;
      const x1 = x0 + PAPER_W * 1.44 * (li === 0 ? len * 0.55 : len);
      const [ax, ay, ad] = rotate([x0, 0, d], yaw, pitch, roll);
      const [bx, by, bd] = rotate([x1, 0, d], yaw, pitch, roll);
      const pa = project(cam, X + ax, Y + ay, D + ad);
      const pb = project(cam, X + bx, Y + by, D + bd);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    });
  });
}

// The virtual camera. ONE track of keyframes (world centre x/y, scale s, rotation r), each segment eased by its destination key's ease; scale is interpolated in
// LOG space so a zoom feels constant-speed to the eye. On top of that:
//   PUSH   a slow push-in on every spoken sentence (+4 % of scale over the sentence), released while the camera travels
//   PUNCH  a fast zoom-in on an alarm word (x1.25 in 6 frames, a spring settles it, then it eases back) with a 2-frame 1.5 px shake
//   DRIFT  a tiny seeded idle float (+-6 px, +-0.2 deg, 4-second noise): the frame is never fully frozen
// Names of the camera vocabulary used in the keys: START, HOLD, FLY-TO, PULL, DOLLY-THROUGH (the move kinds), PUSH and PUNCH are the layers above.
import { FPS } from "./theme";
import { EaseName, ease, smoothstep, springT } from "./easing";
import { noise1 } from "./motion";

export type Move = "START" | "HOLD" | "GLIDE" | "FLY-TO" | "PULL" | "DOLLY-THROUGH" | "REVERSE-DOLLY" | "ORBIT";
export interface CamKey { f: number; x: number; y: number; s: number; r?: number; move: Move; ease?: EaseName; dip?: number; settle?: boolean }
export interface Punch { f: number; amount?: number; id?: string }
export interface Sentence { start: number; end: number }
export interface CamState { x: number; y: number; s: number; r: number }

const TRAVEL: Move[] = ["FLY-TO", "PULL", "DOLLY-THROUGH", "REVERSE-DOLLY"];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function makeCamera(keysIn: CamKey[], punches: Punch[], sentences: Sentence[]) {
  const keys = [...keysIn].sort((a, b) => a.f - b.f);
  const travels = keys.map((k, i) => ({ k, a: keys[i - 1] })).filter((t) => t.a && TRAVEL.includes(t.k.move)).map((t) => ({ from: t.a!.f, to: t.k.f }));

  /** the base track at frame f (no push / punch / drift) */
  const base = (f: number): CamState & { u: number; move: Move } => {
    if (f <= keys[0].f) return { x: keys[0].x, y: keys[0].y, s: keys[0].s, r: keys[0].r ?? 0, u: 0, move: keys[0].move };
    let i = keys.findIndex((k) => k.f > f) - 1;
    if (i < 0) i = keys.length - 1;
    const a = keys[i], b = keys[i + 1];
    if (!b) return { x: a.x, y: a.y, s: a.s, r: a.r ?? 0, u: 1, move: a.move };
    const u = clamp01((f - a.f) / (b.f - a.f)), la = Math.log(a.s), lb = Math.log(b.s);
    let p: number, ps: number, ls: number;
    if (b.move === "FLY-TO") {
      // zoom out, glide across, zoom in: the position travels through the middle of the move, the scale dips to b.dip at the half-way point
      p = ease("glide", clamp01((u - 0.1) / 0.8)); ps = ease("swing", u);
      ls = la + (lb - la) * ps;
      if (b.dip) { const mid = (la + lb) / 2; ls += (Math.log(b.dip) - mid) * Math.sin(Math.PI * u) ** 2; }
    } else { p = ps = ease(b.ease ?? "glide", u); ls = la + (lb - la) * ps; }
    const state = { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, s: Math.exp(ls), r: (a.r ?? 0) + ((b.r ?? 0) - (a.r ?? 0)) * ps, u, move: b.move };
    return state;
  };
  /** a soft spring settle (about 1.5 % overshoot of the scale) after every arrival of a travelling move */
  const settleTerm = (f: number): number => {
    let t = 1;
    for (const k of keys) if (TRAVEL.includes(k.move) && k.settle !== false && f >= k.f) { const dt = (f - k.f) / FPS; if (dt < 1.4) t *= 1 + 0.015 * Math.exp(-dt / 0.22) * Math.sin((2 * Math.PI * dt) / 0.55); }
    return t;
  };
  /** log of the sentence push factor */
  const pushLog = (f: number): number => {
    let A = 0;
    for (const t of travels) if (t.to <= f) A = Math.max(A, t.to);
    let sum = 0;
    for (const s of sentences) {
      if (s.end <= A || s.start > f) continue;
      const st = Math.max(s.start, A), p = clamp01((f - st) / Math.max(1, s.end - st));
      sum += 0.04 * ease("swing", p);
    }
    let rel = 1;
    for (const t of travels) if (f >= t.from && f < t.to) rel *= 1 - smoothstep((f - t.from) / (0.4 * (t.to - t.from)));
    return sum * rel;
  };
  /** the punch factor: x(1 + amount) in 6 frames (spring settle), held 10 frames, eased back over 40 */
  const punchFactor = (f: number): number => {
    let m = 1;
    for (const p of punches) {
      const dt = f - p.f; if (dt < 0) continue;
      const A = p.amount ?? 0.25;
      const rise = springT(dt / FPS, 1600, 56, 1);                 // 0 -> 1 in about 6 frames, a spring settles it (omega 40 rad/s, zeta 0.7)
      const rel = ease("glide", clamp01((dt - 16) / 44));
      m *= 1 + A * rise * (1 - rel);
    }
    return m;
  };
  const shake = (f: number): { x: number; y: number } => {
    for (const p of punches) { const k = f - p.f; if (k >= 0 && k < 2) { const sg = k === 0 ? 1 : -0.7; return { x: 1.5 * sg, y: -1.1 * sg }; } }
    return { x: 0, y: 0 };
  };
  const at = (f: number): CamState & { sx: number; sy: number } => {
    const b = base(f);
    const s = b.s * Math.exp(pushLog(f)) * punchFactor(f) * settleTerm(f);
    // drift: 4-second seeded noise; amplitude +-6 px (screen), +-0.2 deg
    const t = f / FPS / 4, dx = 6 * noise1(t, 3), dy = 6 * noise1(t, 4), dr = 0.2 * noise1(t, 5);
    const sh = shake(f);
    return { x: b.x - dx / s, y: b.y - dy / s, s, r: b.r + dr, sx: sh.x, sy: sh.y };
  };
  /** screen-space camera speed in px/s at frame f (for the motion-blur decision): translation + the zoom's push at the screen edge */
  const speed = (f: number): number => {
    const a = at(f - 0.5), b = at(f + 0.5);
    const dx = (b.x - a.x) * b.s, dy = (b.y - a.y) * b.s, dz = Math.abs(Math.log(b.s / a.s)) * 700, dr = Math.abs(b.r - a.r) * (Math.PI / 180) * 700;
    return Math.hypot(dx, dy) * FPS + dz * FPS + dr * FPS;
  };
  return { keys, at, base, speed, travels };
}
export type Camera = ReturnType<typeof makeCamera>;

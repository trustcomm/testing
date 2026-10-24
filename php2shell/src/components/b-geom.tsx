// Geometry helpers for the analogy world of S5-S7 (the dabbawala, the houses, the tiffins, the key, the racks).
// Everything is drawn in SCREEN pixels with a fixed 3 px stroke: shapes are described in their own local units (y up is negative), a transform
// (`Xf`) puts them on the screen through the world camera (`Cam`), so zooming never thickens a line and details stay crisp at any scale.
import { clamp01, lerp } from "../motion";

/** The world is laid out in "wide shot" screen coordinates. A camera: the world point (cx, cy) is at the centre of the stage (540, 800) and everything is scaled by s. */
export interface Cam { cx: number; cy: number; s: number }
export const CAM_WIDE: Cam = { cx: 540, cy: 900, s: 1 };       // the wide shot: ground at screen y 970
export const CAM_HALL: Cam = { cx: 540, cy: 800, s: 1 };       // identity: the server hall of S7's last frames (and S8's first)
export const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({ cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), t)) });
export const toScreen = (cam: Cam, x: number, y: number): [number, number] => [(x - cam.cx) * cam.s + 540, (y - cam.cy) * cam.s + 800];

/** a local -> screen transform: origin at screen (x, y), k screen px per local unit, rotation r (radians), fx = -1 mirrors left-right */
export interface Xf { x: number; y: number; k: number; r: number; fx: number }
export const place = (cam: Cam, wx: number, wy: number, ks = 1, r = 0, fx = 1): Xf => { const [x, y] = toScreen(cam, wx, wy); return { x, y, k: ks * cam.s, r, fx }; };
export const pt = (xf: Xf, lx: number, ly: number): [number, number] => {
  const c = Math.cos(xf.r), s = Math.sin(xf.r), px = lx * xf.fx;
  return [xf.x + (px * c - ly * s) * xf.k, xf.y + (px * s + ly * c) * xf.k];
};
/** a child transform: the point (lx, ly) of `xf` becomes the origin of a new one (scale ks, rotation r added) */
export const child = (xf: Xf, lx: number, ly: number, ks = 1, r = 0): Xf => { const [x, y] = pt(xf, lx, ly); return { x, y, k: xf.k * ks, r: xf.r + r * xf.fx, fx: xf.fx }; };

const n2 = (v: number) => Math.round(v * 100) / 100;
/** A path builder: local coordinates in, a screen-space SVG path string out. */
export class PB {
  d = "";
  constructor(public xf: Xf) {}
  private p(x: number, y: number) { const [X, Y] = pt(this.xf, x, y); return `${n2(X)} ${n2(Y)}`; }
  M(x: number, y: number) { this.d += `M${this.p(x, y)}`; return this; }
  L(x: number, y: number) { this.d += `L${this.p(x, y)}`; return this; }
  Q(cx: number, cy: number, x: number, y: number) { this.d += `Q${this.p(cx, cy)} ${this.p(x, y)}`; return this; }
  /** circular arc to (x, y) with local radius r (uniform scale only) */
  A(r: number, x: number, y: number, large = 0, sweep = 1) { const rr = n2(r * this.xf.k); this.d += `A${rr} ${rr} 0 ${large} ${this.xf.fx < 0 ? 1 - sweep : sweep} ${this.p(x, y)}`; return this; }
  Z() { this.d += "Z"; return this; }
  line(x1: number, y1: number, x2: number, y2: number) { return this.M(x1, y1).L(x2, y2); }
  poly(pts: [number, number][], close = false) { pts.forEach(([x, y], i) => (i ? this.L(x, y) : this.M(x, y))); return close ? this.Z() : this; }
  circle(cx: number, cy: number, r: number) { return this.M(cx - r, cy).A(r, cx + r, cy, 1, 1).A(r, cx - r, cy, 1, 1); }
  /** rounded rectangle, clockwise from the top-left */
  rrect(x: number, y: number, w: number, h: number, r = 0) {
    r = Math.min(r, w / 2, h / 2);
    if (!r) return this.M(x, y).L(x + w, y).L(x + w, y + h).L(x, y + h).Z();
    return this.M(x + r, y).L(x + w - r, y).A(r, x + w, y + r).L(x + w, y + h - r).A(r, x + w - r, y + h).L(x + r, y + h).A(r, x, y + h - r).L(x, y + r).A(r, x + r, y).Z();
  }
}
export const pb = (xf: Xf) => new PB(xf);

/** quadratic Bezier point + tangent angle (radians) at t (world coordinates) */
export const qpt = (p0: [number, number], p1: [number, number], p2: [number, number], t: number) => {
  const u = 1 - t, x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
  const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]), dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  return { x, y, angle: Math.atan2(dy, dx) };
};
/** a world-space quadratic arc as a screen path (dotted guide lines, written on with Stroke) */
export const arcPath = (cam: Cam, a: [number, number], c: [number, number], b: [number, number]) => {
  const [x0, y0] = toScreen(cam, a[0], a[1]), [x1, y1] = toScreen(cam, c[0], c[1]), [x2, y2] = toScreen(cam, b[0], b[1]);
  return `M${n2(x0)} ${n2(y0)}Q${n2(x1)} ${n2(y1)} ${n2(x2)} ${n2(y2)}`;
};

/** two-bone arm: shoulder S, hand target T, link lengths l1, l2; the elbow bends to one side (bend +1 / -1). Returns the elbow and the (clamped) hand. */
export const arm2 = (S: [number, number], T: [number, number], l1: number, l2: number, bend = 1) => {
  const dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy) || 1e-6;
  const reach = Math.min(d, (l1 + l2) * 0.999), ux = dx / d, uy = dy / d;
  const a = (l1 * l1 - l2 * l2 + reach * reach) / (2 * reach), hgt = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const E: [number, number] = [S[0] + ux * a - uy * hgt * bend, S[1] + uy * a + ux * hgt * bend];
  return { E, H: [S[0] + ux * reach, S[1] + uy * reach] as [number, number] };
};

export const smoothstep = (a: number, b: number, x: number) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
export const easeInOutSine = (x: number) => -(Math.cos(Math.PI * clamp01(x)) - 1) / 2;

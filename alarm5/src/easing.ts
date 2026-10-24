// The easing set of the piece (the brief's names). Nothing moves linearly except slow drifts.
//   glide  (0.25, 0.1, 0.25, 1)  camera travel        settle (0.16, 1, 0.3, 1)  arrivals
//   launch (0.7, 0, 0.84, 0)     departures           swing  (0.65, 0, 0.35, 1) continuous moves
export type EaseName = "linear" | "glide" | "settle" | "launch" | "swing";

/** CSS cubic-bezier(x1, y1, x2, y2) as a function x -> y (Newton, with a bisection fallback). */
export const cubicBezier = (x1: number, y1: number, x2: number, y2: number) => {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t;
  const Y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = X(t) - x;
      if (Math.abs(err) < 1e-7) return Y(t);
      const d = dX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0, hi = 1;
    t = x;
    for (let i = 0; i < 40; i++) { const e = X(t) - x; if (Math.abs(e) < 1e-7) break; if (e > 0) hi = t; else lo = t; t = (lo + hi) / 2; }
    return Y(t);
  };
};
export const glide = cubicBezier(0.25, 0.1, 0.25, 1);
export const settle = cubicBezier(0.16, 1, 0.3, 1);
export const launch = cubicBezier(0.7, 0, 0.84, 0);
export const swing = cubicBezier(0.65, 0, 0.35, 1);
export const EASE: Record<EaseName, (x: number) => number> = { linear: (x) => Math.min(1, Math.max(0, x)), glide, settle, launch, swing };
export const ease = (name: EaseName | undefined, x: number) => EASE[name ?? "linear"](x);

/** closed-form damped spring 0 -> 1 (sub-frame exact): stiffness k, damping c, mass m. k 150, c 20, m 1 overshoots ~1 %. */
export const springT = (t: number, k = 150, c = 20, m = 1): number => {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(k / m), z = c / (2 * Math.sqrt(k * m));
  if (z >= 1) { const r = w0 * (z + Math.sqrt(z * z - 1)) ; const a = w0 * (z - Math.sqrt(z * z - 1)); return 1 - (r * Math.exp(-a * t) - a * Math.exp(-r * t)) / (r - a); }
  const wd = w0 * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
};
export const smoothstep = (x: number) => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };

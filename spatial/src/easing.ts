// The easing set of the piece. "settle" / "snap" / "breathe" are the brief's cubic-beziers; "fall" is gravity (t^2) for the drop.
export type EaseName = "linear" | "settle" | "snap" | "breathe" | "fall";

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

const settle = cubicBezier(0.16, 1, 0.3, 1);
const snap = cubicBezier(0.7, 0, 0.84, 0);
const breathe = cubicBezier(0.45, 0, 0.55, 1);

export const EASE: Record<EaseName, (x: number) => number> = {
  linear: (x) => Math.min(1, Math.max(0, x)),
  settle, snap, breathe,
  fall: (x) => { const u = Math.min(1, Math.max(0, x)); return u * u; },
};
export const ease = (name: EaseName | undefined, x: number) => EASE[name ?? "linear"](x);
export const smoothstep = (x: number) => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };

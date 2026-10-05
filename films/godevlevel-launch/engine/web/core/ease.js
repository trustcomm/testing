// Easing and timing helpers, written from first principles for this film.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
/** 0→1 progress of time t across [a, b]. */
export const prog = (t, a, b) => (b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));

export const easeInCubic = (p) => p * p * p;
export const easeOutCubic = (p) => 1 - (1 - p) ** 3;
export const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
export const easeOutQuint = (p) => 1 - (1 - p) ** 5;
export const easeInOutQuint = (p) => (p < 0.5 ? 16 * p ** 5 : 1 - (-2 * p + 2) ** 5 / 2);

/**
 * Cubic Bézier timing curve through (0,0), (x1,y1), (x2,y2), (1,1).
 * Solves x(s) = p by Newton steps with a bisection fallback, then returns y(s).
 */
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (s) => ((ax * s + bx) * s + cx) * s;
  const Y = (s) => ((ay * s + by) * s + cy) * s;
  const dX = (s) => (3 * ax * s + 2 * bx) * s + cx;
  return (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let s = p;
    for (let i = 0; i < 8; i++) {
      const e = X(s) - p;
      if (Math.abs(e) < 1e-7) return Y(s);
      const d = dX(s);
      if (Math.abs(d) < 1e-6) break;
      s -= e / d;
    }
    let lo = 0, hi = 1;
    s = p;
    for (let i = 0; i < 40; i++) {
      const v = X(s);
      if (Math.abs(v - p) < 1e-7) break;
      if (v < p) lo = s; else hi = s;
      s = (lo + hi) / 2;
    }
    return Y(s);
  };
}
/** Fast-out, long-settle curve used for snaps. */
export const snap = bezier(0.16, 1, 0.3, 1);

/**
 * Under-damped spring from 0 to 1 (closed form), for stamps and pops.
 * f = natural frequency (Hz), z = damping ratio (< 1 overshoots).
 */
export function spring(tSec, f = 3.2, z = 0.42) {
  if (tSec <= 0) return 0;
  const w = 2 * Math.PI * f;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tSec) * (Math.cos(wd * tSec) + ((z * w) / wd) * Math.sin(wd * tSec));
}

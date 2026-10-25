// Hand-written easing. No animation libraries; everything is a pure function of t.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const win = (t, a, b) => clamp((t - a) / (b - a));
export const outCubic = (x) => 1 - Math.pow(1 - x, 3);
export const outExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const inOutQuint = (x) => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2);
export const outBack = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
export const spring = (x, k = 7, z = 0.45) => 1 - Math.exp(-z * k * x) * Math.cos(k * Math.sqrt(1 - z * z) * x);

// Minimum legible hold for a block of copy, in seconds.
export const holdFor = (words, minHold) => Math.max(minHold, 0.35 + words / 3.2);

// Stateless integer hash, 0..1. Used for any randomness in the draw path.
export function hash(i, seed = 0) {
  let x = (i * 0x9e3779b9 + seed * 0x85ebca6b + 0x165667b1) >>> 0;
  x ^= x >>> 16; x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15; x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16;
  return x / 4294967295;
}

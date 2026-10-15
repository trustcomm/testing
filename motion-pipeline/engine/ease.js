export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, x) => a + (b - a) * x;
export const win = (t, a, b) => clamp01((t - a) / (b - a));      // 0..1 inside [a, b]
export const outCubic = (x) => 1 - Math.pow(1 - x, 3);
export const inOutQuint = (x) => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2);
export const outExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const outBack = (x, s = 1.70158) => 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2;

// Exact step response of a damped spring, 0 -> 1, starting at rest: x is time in the spring's own units,
// k the natural frequency (radians per unit x), z the damping ratio (< 1 overshoots, 1 is critical, > 1 creeps).
export function spring(x, k = 10, z = 0.5) {
  if (x <= 0) return 0;
  if (z < 1) {
    const w = k * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * k * x) * (Math.cos(w * x) + ((z * k) / w) * Math.sin(w * x));
  }
  if (z === 1) return 1 - Math.exp(-k * x) * (1 + k * x);
  const s = k * Math.sqrt(z * z - 1);
  return 1 - Math.exp(-z * k * x) * (Math.cosh(s * x) + ((z * k) / s) * Math.sinh(s * x));
}

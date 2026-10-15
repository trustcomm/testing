export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const win = (t, a, b) => clamp01((t - a) / (b - a));      // 0..1 inside [a, b]
export const outCubic = (x) => 1 - Math.pow(1 - x, 3);
export const inOutQuint = (x) => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2);
export const outExpo = (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const spring = (x, k = 7, z = 0.35) => 1 - Math.exp(-z * k * x) * Math.cos(k * x * Math.sqrt(1 - z * z));

// Flow State — small deterministic toolkit: math, easing, springs, seeded randomness, value noise, colour.
// Nothing here reads a clock; every value is a pure function of its inputs.
(function (root) {
  const TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, x) => clamp((x - a) / (b - a)); // 0..1 progress of x through [a, b]
  const smooth = (t) => t * t * (3 - 2 * t);
  const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const fract = (x) => x - Math.floor(x);

  const E = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
    outQuint: (t) => 1 - Math.pow(1 - t, 5),
    inOutQuint: (t) => (t < 0.5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2),
    inSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
    outSine: (t) => Math.sin((t * Math.PI) / 2),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutExpo: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
    outBack: (t, s = 1.4) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  };

  // Damped spring step response (0 → 1). tau in seconds; light overshoot with zeta ≈ 0.5–0.7.
  function spring(tau, freq = 2.0, zeta = 0.6) {
    if (tau <= 0) return 0;
    const w = TAU * freq;
    const wd = w * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w * tau) * (Math.cos(wd * tau) + ((zeta * w) / wd) * Math.sin(wd * tau));
  }

  // mulberry32: seeded PRNG
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    let u = 0, v = 0;
    while (u === 0) u = r();
    while (v === 0) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
  }

  // integer hash → [0, 1)
  function hash(i, j = 0, k = 0) {
    let h = (Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(j | 0, 0x165667b1) ^ Math.imul(k | 0, 0x9e3779b1)) | 0;
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  // smooth value noise in [-1, 1]
  function noise1(x, seed = 0) {
    const i = Math.floor(x), f = x - i, u = smoother(f);
    return lerp(hash(i, seed) * 2 - 1, hash(i + 1, seed) * 2 - 1, u);
  }
  function noise2(x, y, seed = 0) {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = smoother(fx), v = smoother(fy);
    const a = hash(i, j, seed), b = hash(i + 1, j, seed), c = hash(i, j + 1, seed), d = hash(i + 1, j + 1, seed);
    return lerp(lerp(a, b, u), lerp(c, d, u), v) * 2 - 1;
  }
  // two octaves, for organic drift
  const fbm1 = (x, seed = 0) => noise1(x, seed) * 0.67 + noise1(x * 2.13 + 17.3, seed + 7) * 0.33;

  // ---- colour
  const cache = new Map();
  function hex(h) {
    let c = cache.get(h);
    if (!c) {
      const n = parseInt(h.slice(1), 16);
      c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      cache.set(h, c);
    }
    return c;
  }
  const rgba = (h, a = 1) => {
    const c = typeof h === "string" ? hex(h) : h;
    return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a)})`;
  };
  const mixc = (a, b, t) => {
    const x = typeof a === "string" ? hex(a) : a, y = typeof b === "string" ? hex(b) : b;
    return [lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)];
  };

  root.L = { TAU, clamp, lerp, inv, smooth, smoother, fract, E, spring, rng, gauss, hash, noise1, noise2, fbm1, hex, rgba, mixc };
})(window);

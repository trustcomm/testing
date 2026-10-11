// Shared math for every world. Pure functions only: nothing here reads a clock or Math.random.
(function () {
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const mix = (a, b, t) => a + (b - a) * t;
  const remap = (v, a, b) => clamp((v - a) / (b - a));
  const smooth = (v) => v * v * (3 - 2 * v);
  const smoother = (v) => v * v * v * (v * (v * 6 - 15) + 10);
  const sstep = (a, b, v) => smooth(remap(v, a, b));

  // Eases (GSAP-equivalent curves, so picture timing reads like the design spec)
  const E = {
    linear: (t) => t,
    p2in: (t) => t * t,
    p2out: (t) => 1 - (1 - t) * (1 - t),
    p2io: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    p3in: (t) => t * t * t,
    p3out: (t) => 1 - Math.pow(1 - t, 3),
    p3io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    p4out: (t) => 1 - Math.pow(1 - t, 4),
    expoIn: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
    expoOut: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    expoIo: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
    sineIo: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    backOut: (t, s = 1.70158) => {
      const c3 = s + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
    },
    backIn: (t, s = 1.70158) => (s + 1) * t * t * t - s * t * t,
    elasticOut: (t, amp = 1, period = 0.3) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      const s = (period / (2 * Math.PI)) * Math.asin(1 / amp);
      return amp * Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / period) + 1;
    },
  };
  // eased segment: progress of v across [a,b] through ease e
  const seg = (v, a, b, e = E.linear) => e(remap(v, a, b));

  // Damped spring response to a unit step at t=0 (0→1 with overshoot); pure function of elapsed time
  const spring = (dt, freq = 6, damp = 0.35) => {
    if (dt <= 0) return 0;
    const w = 2 * Math.PI * freq;
    const z = damp;
    if (z < 1) {
      const wd = w * Math.sqrt(1 - z * z);
      return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt));
    }
    return 1 - Math.exp(-w * dt) * (1 + w * dt);
  };
  // decaying sine "kick" (impulse response), for wobbles on a hit
  const kick = (dt, freq = 5, decay = 6) => (dt <= 0 ? 0 : Math.sin(2 * Math.PI * freq * dt) * Math.exp(-decay * dt));

  // Seeded PRNG (mulberry32)
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Integer hash → [0,1) (same constants as the GLSL hash so CPU and GPU agree closely)
  const fract = (x) => x - Math.floor(x);
  const hash1 = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
  const hash3 = (x, y, z) => fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123);
  function vnoise3(x, y, z) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const fx = x - ix, fy = y - iy, fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
    const n = (a, b, c) => hash3(ix + a, iy + b, iz + c);
    const x00 = mix(n(0, 0, 0), n(1, 0, 0), ux), x10 = mix(n(0, 1, 0), n(1, 1, 0), ux);
    const x01 = mix(n(0, 0, 1), n(1, 0, 1), ux), x11 = mix(n(0, 1, 1), n(1, 1, 1), ux);
    return mix(mix(x00, x10, uy), mix(x01, x11, uy), uz);
  }
  const fbm3 = (x, y, z) => 0.5 * vnoise3(x, y, z) + 0.25 * vnoise3(x * 2.03, y * 2.03, z * 2.03) + 0.125 * vnoise3(x * 4.01, y * 4.01, z * 4.01) + 0.0625 * vnoise3(x * 7.97, y * 7.97, z * 7.97);

  const hex = (h) => {
    const v = parseInt(h.replace("#", ""), 16);
    return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
  };
  const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lin = (h) => hex(h).map(srgbToLinear);

  const PAL = {
    void: "#06070B", bone: "#EDE6DA", infra: "#FF4A24", ice: "#8FD8FF",
    ember: "#FFB37A", deep: "#3A0B04", slate: "#1B2230",
  };

  window.U = { clamp, mix, remap, smooth, smoother, sstep, E, seg, spring, kick, rng, hash1, hash3, vnoise3, fbm3, fract, hex, lin, srgbToLinear, PAL };
})();

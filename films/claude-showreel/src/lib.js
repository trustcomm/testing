// Motion math for the reel. Everything here is a pure function: no clocks, no unseeded randomness.
(function () {
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const sat = (x) => clamp(x, 0, 1);
  const lerp = (a, b, u) => a + (b - a) * u;
  const seg = (t, t0, t1) => sat((t - t0) / (t1 - t0));
  const smooth = (e0, e1, x) => {
    const u = sat((x - e0) / (e1 - e0));
    return u * u * (3 - 2 * u);
  };
  const TAU = Math.PI * 2;

  // Seeded PRNG (mulberry32) + a normal deviate from it.
  function rng(seed) {
    let a = seed >>> 0;
    const r = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.gauss = () => {
      const u = Math.max(1e-9, r());
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * r());
    };
    return r;
  }
  // Integer hash for per-frame offsets (grain).
  function hash(n) {
    n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
    n ^= n >>> 13;
    n = Math.imul(n, 0xc2b2ae35);
    return (n ^ (n >>> 16)) >>> 0;
  }

  // GSAP's own ease functions, cached, so every curve the HUD draws is the one that moves the picture.
  const cache = {};
  const ease = (name) => cache[name] || (cache[name] = gsap.parseEase(name));

  // springEase: a damped spring's exact position curve (hyperframes-animation gsap-easing adapter).
  function springEase({ response = 0.5, dampingFraction = 1 } = {}) {
    const w = (2 * Math.PI) / response;
    const z = dampingFraction;
    let pos;
    if (z < 1) {
      const wd = w * Math.sqrt(1 - z * z);
      pos = (t) => 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
    } else if (z > 1) {
      const wo = w * Math.sqrt(z * z - 1);
      pos = (t) => 1 - Math.exp(-z * w * t) * (Math.cosh(wo * t) + ((z * w) / wo) * Math.sinh(wo * t));
    } else {
      pos = (t) => 1 - Math.exp(-w * t) * (1 + w * t);
    }
    const EPS = 0.001;
    const rate = z <= 1 ? z * w : (z - Math.sqrt(z * z - 1)) * w;
    const SCAN = 12 / rate;
    const N = 4800;
    let T = SCAN;
    for (let i = N; i >= 0; i--) {
      const t = (i / N) * SCAN;
      if (Math.abs(1 - pos(t)) > EPS) {
        T = ((i + 1) / N) * SCAN;
        break;
      }
    }
    const xT = pos(T);
    return { duration: T, ease: (p) => pos(p * T) + p * (1 - xT) };
  }
  // A spring evaluated in seconds since its trigger (0 before, settles to 1).
  function springAt(spring, tau) {
    if (tau <= 0) return 0;
    if (tau >= spring.duration) return 1;
    return spring.ease(tau / spring.duration);
  }

  // Tween helper: value of a from→to move over [t0, t0+dur] with a named ease (or ease function).
  function tw(t, t0, dur, from, to, e) {
    const f = typeof e === "function" ? e : ease(e || "none");
    return lerp(from, to, f(seg(t, t0, t0 + dur)));
  }

  // Colours.
  function hex(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mixHex(a, b, u) {
    const A = hex(a), B = hex(b);
    return `rgb(${Math.round(lerp(A[0], B[0], u))},${Math.round(lerp(A[1], B[1], u))},${Math.round(lerp(A[2], B[2], u))})`;
  }
  const rgba = (h, a) => {
    const c = hex(h);
    return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  };

  // Frame snapping: renders seek to exact frame times; preview may pass anything. Work in frames where a
  // contact must land on one exact frame.
  const FPS = 60;
  const frameOf = (t) => Math.round(t * FPS * 1000) / 1000; // fractional frame, snapped to 1/1000

  window.L = { clamp, sat, lerp, seg, smooth, TAU, rng, hash, ease, springEase, springAt, tw, hex, mixHex, rgba, FPS, frameOf };
})();

// Motion core: pure functions of time. Every scene and technique is render(ctx, t) with t in seconds,
// so any frame can be drawn on demand, rendered with motion blur, and scrubbed for review.

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => clamp((v - a) / (b - a));
export const mix = (a, b, t) => Array.isArray(a) ? a.map((x, i) => lerp(x, b[i], t)) : lerp(a, b, t);

// CSS-style cubic-bezier easing (x1, y1, x2, y2); y may overshoot.
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = u => ((ax * u + bx) * u + cx) * u, Y = u => ((ay * u + by) * u + cy) * u;
  return t => {
    if (t <= 0) return 0; if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 8; i++) { const d = (3 * ax * u + 2 * bx) * u + cx; if (Math.abs(d) < 1e-6) break; u -= (X(u) - t) / d; }
    u = clamp(u); let lo = 0, hi = 1;
    for (let i = 0; i < 20 && Math.abs(X(u) - t) > 1e-5; i++) { X(u) < t ? lo = u : hi = u; u = (lo + hi) / 2; }
    return Y(u);
  };
}

// Measured curve: 11 samples of progress at t = 0, .1 … 1 (values > 1 = overshoot). Ground truth from the references.
export const curve = samples => t => {
  t = clamp(t); const n = samples.length - 1, i = Math.min(n - 1, Math.floor(t * n));
  const f = t * n - i, p0 = samples[Math.max(0, i - 1)], p1 = samples[i], p2 = samples[i + 1], p3 = samples[Math.min(n, i + 2)];
  // Catmull-Rom between samples keeps velocity continuous (no visible kinks at sample points)
  return 0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
};

// Damped spring from 0 to 1 (freq in Hz, damping ratio < 1 overshoots). t in seconds since start.
export function spring(t, freq = 2.2, damping = 0.55) {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * freq, z = damping;
  if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
}

// Named eases used by the style (see style.json "easing"). Measured ones are filled in from cases.
export const EASE = {
  linear: t => clamp(t),
  out: bezier(0.16, 1, 0.3, 1),        // default entrance: fast start, long settle
  in: bezier(0.32, 0, 0.67, 0),        // exits / turn-aways: slow start, fast end
  inOut: bezier(0.65, 0, 0.35, 1),     // camera moves, morphs between two held states
  pop: bezier(0.34, 1.56, 0.64, 1),    // UI pop with overshoot
  snap: bezier(0.2, 0, 0, 1),          // morphs that "click" into place
};
export const ease = e => typeof e === 'function' ? e : Array.isArray(e) ? (e.length === 4 ? bezier(...e) : curve(e)) : (EASE[e] || EASE.out);

// Progress of a move that starts at t0 and lasts dur (s), eased. Returns 0 before, 1 after.
export const seg = (t, t0, dur, e = 'out') => ease(e)(clamp((t - t0) / dur));
// Same, but also returns raw linear progress and whether it is active (for SFX/motion-blur decisions).
export const move = (t, t0, dur, e = 'out') => { const u = clamp((t - t0) / dur); return { p: ease(e)(u), u, on: u > 0 && u < 1 }; };

// Stagger: i-th item's progress for a group starting at t0, items `gap` s apart, each lasting dur.
export const stagger = (t, i, t0, gap, dur, e = 'out') => seg(t, t0 + i * gap, dur, e);

// Keyframes: [[time, value], ...] with per-segment easing ([time, value, ease]).
export function keys(t, frames) {
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1, e] = frames[i], [t0, v0] = frames[i - 1];
    if (t <= t1) return mix(v0, v1, ease(e || 'inOut')((t - t0) / (t1 - t0)));
  }
  return frames[frames.length - 1][1];
}

// Deterministic noise (for grain, jitter, drift) so renders are reproducible.
export function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
export function noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; }

// Timeline: one JSON of named beats drives scenes, sound and review (beats in seconds).
export function timeline(json) {
  const beats = json.beats || json;
  return { ...json, at: name => { const v = beats[name]; if (v === undefined) throw new Error('no beat ' + name); return v; } };
}

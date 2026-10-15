// Particles as formulas: every attribute is a hash of the particle's index, every position a closed-form function of t,
// so a frame never depends on the one before it. Each look has a pure state function (riseAt, sparkAt, confettiAt: what
// the particle is doing at t, or null) and a draw function on top (motes, sparks, confetti), all (ctx, t, opts).
// Every alpha is 0 where a particle appears and where it disappears: nothing pops. Colours come from tokens.js.
//
// More than ~2,000 particles: use the GPU field (shaders/particles.vert, window.PARTICLES). Particles that must
// collide or follow something need state: simulate at a fixed dt with engine/sim.js `replay` and keep N small.
import { tokens as T } from "../tokens.js";
import { clamp01, lerp } from "./ease.js";
import { hash } from "./rng.js";
import { shade, rgba } from "./draw.js";

const TAU = Math.PI * 2;
// A burst's particles fade in over 0.15 s: from alpha 0 at birth, but not so fast (two frames at 30 fps) that the first
// frame is a flash. npm test measures the biggest frame-to-frame jump.
const RAMP = 0.15;
// QA switch: when set, the draw functions below draw nothing (so the design layer can be measured without particles).
const off = () => globalThis.NO_PARTICLES === true;
const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const wrap = (x, n) => ((x % n) + n) % n;
const seeded = (i, o, k) => hash(i, (o.seed ?? 0) * 977 + k);

// Soft round sprites, built once at load (the browser only): a mote is one drawImage, and the far layer's softness is
// the sprite, not a per-particle blur filter.
function sprite(color, stops) {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  for (const [at, a] of stops) r.addColorStop(at, rgba(color, a));
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return c;
}
const SOFT = [[0, 1], [0.35, 0.5], [0.7, 0.12], [1, 0]], DISC = [[0, 1], [0.55, 0.9], [0.8, 0.35], [1, 0]];
const SPRITES = { soft: { ink: sprite(T.color.ink, SOFT), accent: sprite(T.color.accent, SOFT) }, disc: { ink: sprite(T.color.ink, DISC), accent: sprite(T.color.accent, DISC) } };

/* ---------- motes and dust: a looping field ---------- */

// One particle of a rising field at time t, or null. opts: seed, depth (0.3 far .. 1 near: scales sway and camera
// parallax), cam [x, y] (the camera's offset in px: the field follows it at a depth-scaled rate), speed [min, max] px/s,
// size [min, max] px, spread (seconds over which births are spread), loop (default true: it never runs out),
// density 0..1 (a per-particle threshold fades particles in and out, so the dial never pops one).
export function riseAt(i, t, o = {}) {
  const r = (k) => seeded(i, o, k), d = o.depth ?? 1, cam = o.cam ?? [0, 0], W = T.W, H = T.H;
  const [s0, s1] = o.speed ?? [60, 180], [z0, z1] = o.size ?? [1, 4];
  const born = r(1) * (o.spread ?? 6), life = lerp(2, 5, r(2));
  const age = o.loop === false ? t - born : wrap(t - born, life);
  if (age < 0 || age > life) return null;
  const p = age / life;
  const x = wrap(r(3) * W + Math.sin(t * (0.3 + r(4)) + r(5) * TAU) * 40 * d - cam[0] * d, W);
  const y = wrap(r(11) * (H + 80) - age * lerp(s0, s1, r(6)) - cam[1] * d, H + 80) - 40;   // from its own height: the field fills the frame
  // where the camera wraps the field round the frame edge, the particle is already faded out
  const edge = smooth(0, 60, x) * smooth(0, 60, W - x) * smooth(-40, 20, y) * (1 - smooth(H - 20, H + 40, y));
  const dial = clamp01(((o.density ?? 1) - 0.9 * r(9)) / 0.1);
  return { x, y, size: lerp(z0, z1, r(7)), alpha: Math.sin(Math.PI * p) * lerp(0.3, 1, r(8)) * edge * dial, accent: r(10) > 0.88, p };
}

// Three depth layers at different speeds and sizes, drawn additively; the far one is soft (blurred), the near one crisp.
// opts: cam [x, y], density 0..1 (default 1), seed.
export function motes(ctx, t, o = {}) {
  if (off()) return;
  const layers = [
    { depth: 0.35, n: 110, speed: [14, 40], size: [3, 7], alpha: 0.35, sprite: SPRITES.soft },
    { depth: 0.65, n: 80, speed: [24, 70], size: [2, 5], alpha: 0.5, sprite: SPRITES.disc },
    { depth: 1, n: 40, speed: [40, 110], size: [2, 6], alpha: 0.7, sprite: SPRITES.disc },
  ];
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  layers.forEach((L, li) => {
    for (let i = 0; i < L.n; i++) {
      const m = riseAt(i, t, { seed: (o.seed ?? 0) + li + 1, depth: L.depth, cam: o.cam, density: o.density, speed: L.speed, size: L.size });
      if (!m || m.alpha <= 0.002 || !L.sprite.ink) continue;
      ctx.globalAlpha = m.alpha * L.alpha;
      ctx.drawImage(m.accent ? L.sprite.accent : L.sprite.ink, m.x - m.size, m.y - m.size, m.size * 2, m.size * 2);
    }
  });
  ctx.restore();
}

/* ---------- sparks: one burst, ballistic ---------- */

// Spark i of a burst at (o.x, o.y) that goes off at o.t0, or null. Position is v * age + g * age^2 / 2. opts: angle (the
// centre of the cone, default straight up), spread (default a full circle), speed [min, max], gravity, life [min, max], seed.
export function sparkAt(i, t, o) {
  const r = (k) => seeded(i, o, k), age = t - o.t0, life = lerp(...(o.life ?? [0.5, 1.1]), r(2));
  if (age < 0 || age > life) return null;
  const ang = (o.angle ?? -Math.PI / 2) + (r(1) - 0.5) * (o.spread ?? TAU), sp = lerp(...(o.speed ?? [260, 760]), r(3)), g = o.gravity ?? 900;
  const at = (a) => [o.x + Math.cos(ang) * sp * a, o.y + Math.sin(ang) * sp * a + 0.5 * g * a * a];
  const [x, y] = at(age), [x2, y2] = at(Math.max(0, age - 0.03)), p = age / life;
  return { x, y, x2, y2, p, alpha: smooth(0, RAMP, age) * (1 - p) * (1 - p), accent: i % 3 !== 0 };
}

// Each spark is a short line from where it is to where it was 0.03 s ago: motion blur for free. opts: count (default 40), + sparkAt's.
export function sparks(ctx, t, o) {
  if (off()) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
  for (let i = 0; i < (o.count ?? 40); i++) {
    const s = sparkAt(i, t, o);
    if (!s || s.alpha <= 0.002) continue;
    ctx.beginPath(); ctx.moveTo(s.x2, s.y2); ctx.lineTo(s.x, s.y);
    ctx.strokeStyle = s.accent ? T.color.accent : T.color.ink;
    ctx.globalAlpha = s.alpha * 0.3; ctx.lineWidth = T.stroke.outline * 2.5 * (1 - 0.6 * s.p); ctx.stroke();     // halo
    ctx.globalAlpha = s.alpha; ctx.lineWidth = T.stroke.outline * (1 - 0.6 * s.p); ctx.stroke();                  // core
  }
  ctx.restore();
}

/* ---------- confetti: ballistic with drag, and a flip ---------- */

const CONFETTI = [T.color.accent, T.color.ice, T.color.coral, T.color.violet, T.color.ink];

// Piece i of a burst at (o.x, o.y) at o.t0, or null. With drag k and gravity g, the exact position is
// v * (1 - e^(-k age)) / k + (g / k) * (age - (1 - e^(-k age)) / k): still closed form. scaleY = cos(age * spin) turns the
// rectangle over. opts: angle, spread (default 2.2 rad), speed, drag (2.4), gravity (700), life [min, max], seed.
export function confettiAt(i, t, o) {
  const r = (k) => seeded(i, o, k), age = t - o.t0, life = lerp(...(o.life ?? [2.2, 3.4]), r(2));
  if (age < 0 || age > life) return null;
  const ang = (o.angle ?? -Math.PI / 2) + (r(1) - 0.5) * (o.spread ?? 2.2), sp = lerp(...(o.speed ?? [500, 1300]), r(3)), k = o.drag ?? 2.4, g = o.gravity ?? 700;
  const e = (1 - Math.exp(-k * age)) / k, p = age / life, w = lerp(8, 16, r(7));
  return {
    x: o.x + Math.cos(ang) * sp * e, y: o.y + Math.sin(ang) * sp * e + (g / k) * (age - e),
    rot: r(4) * TAU + (r(5) - 0.5) * 6 * age, flip: Math.cos(age * lerp(6, 16, r(6))), w, h: w * lerp(0.45, 0.7, r(8)),
    color: CONFETTI[Math.floor(r(9) * CONFETTI.length)], p, alpha: smooth(0, RAMP, age) * (1 - smooth(0.7, 1, p)),
  };
}

// opts: count (default 120), + confettiAt's. A piece edge-on is darker, so the flip reads.
export function confetti(ctx, t, o) {
  if (off()) return;
  for (let i = 0; i < (o.count ?? 120); i++) {
    const c = confettiAt(i, t, o);
    if (!c || c.alpha <= 0.002) continue;
    ctx.save();
    ctx.globalAlpha = c.alpha;
    ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.scale(1, c.flip);
    ctx.fillStyle = shade(c.color, -0.25 * (1 - Math.abs(c.flip)));
    ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
    ctx.restore();
  }
}

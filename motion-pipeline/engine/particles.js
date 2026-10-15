// Particles as formulas, for the renderFrame(t) engine. There is no particle array and nothing is updated from frame to
// frame: every attribute of particle i is hash(i, k) and its state is a closed-form function of (i, t), so a frame never
// depends on the one before it. Each look has a pure state function (moteAt, sparkAt, confettiAt, glParticleAt: what
// particle i is doing at t, or null) and a draw function on top of it (motes, burst, confetti, sparksFromGlyphs,
// glParticles). Every alpha is 0 where a particle appears and where it disappears, and changes by well under 0.2 between
// two frames at 30 fps: nothing pops. Colours come from tokens.js.
//
// Camera. Every function takes `cam: { dx, dy, z }`, the scene's camera offset in px (default 0). A particle at depth d
// (0.35 far .. 1 near) shifts by -dx*d, -dy*d: the far layers move less, which is the parallax. z is a dolly: the layer
// scales by 1 + z*d about the frame centre, so near particles rush outward faster than far ones. Bursts and confetti
// live at depth 1. Pass the same cam the scene moves by.
//
// More than ~2,000 particles: glParticles draws them on the GPU. Particles that must collide or follow something need
// state: simulate at a fixed dt with engine/sim.js `replay` and keep N small.
import { tokens as T } from "../tokens.js";
import { clamp01, lerp } from "./ease.js";
import { hash } from "./rng.js";
import { shade, rgba } from "./draw.js";

const TAU = Math.PI * 2, W = T.W, H = T.H, CX = W / 2, CY = H / 2;
// A burst's or confetti's particles fade in over 0.3 s (a smoothstep: at most 0.17 of alpha per frame at 30 fps). From
// alpha 0 at birth, and never a flash. npm test scans every frame for a jump of more than 0.2.
const RAMP = 0.3;
// The density dial: each particle has a threshold in 0..1 - DIAL and fades in over DIAL of the dial's travel. At 30 fps one
// frame must not move a particle's alpha by 0.2, so move `density` by at most ~1 per second (a 0..1 change over 1 s or more).
const DIAL = 0.25;
const STREAK = 0.03;       // a spark is drawn from where it is to where it was this many seconds ago
// QA switch: when set, the 2D draw functions below draw nothing (so the design layer can be measured without particles).
const off = () => globalThis.NO_PARTICLES === true;
const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const wrap = (x, n) => ((x % n) + n) % n;
const rnd = (i, o, k) => hash(i, (o.seed ?? 0) * 977 + k);
const camOf = (o) => ({ dx: 0, dy: 0, z: 0, ...o.cam });
// world (x, y) at depth d -> screen: the camera offset scaled by depth, then the dolly about the frame centre. Returns [x, y, scale].
const place = (x, y, d, c) => { const k = 1 + c.z * d; return [CX + (x - c.dx * d - CX) * k, CY + (y - c.dy * d - CY) * k, k]; };

/* ---------- sprites: soft round dots, built once ---------- */

// A mote is one drawImage of a pre-rendered sprite. The far layer's blur is the sprite (a soft gradient disc, baked at
// load), not a per-particle blur filter. Built at load for the token colours (the browser only: none under Node); a
// colour passed to motes() is built the first time it is used, which is still a pure function of the colour.
const KINDS = { soft: [[0, 1], [0.35, 0.5], [0.7, 0.12], [1, 0]], disc: [[0, 1], [0.55, 0.9], [0.8, 0.35], [1, 0]] };
const sprites = new Map();
function sprite(color, kind) {
  if (typeof document === "undefined") return null;
  const key = `${kind}${color}`;
  let c = sprites.get(key);
  if (!c) {
    c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    for (const [at, a] of KINDS[kind]) r.addColorStop(at, rgba(color, a));
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    sprites.set(key, c);
  }
  return c;
}
for (const c of [T.color.ink, T.color.accent, T.color.ice, T.color.coral, T.color.violet]) for (const k of Object.keys(KINDS)) sprite(c, k);

/* ---------- motes: slow rising dust in depth layers ---------- */

// Layer l of L: 0 is far and 1 near. Far: slow, dim, big and soft (out of focus); near: faster, brighter, crisp.
const layer = (l, L) => {
  const u = L === 1 ? 1 : l / (L - 1);
  return { l, depth: lerp(0.35, 1, u), speed: [lerp(14, 40, u), lerp(40, 110, u)], size: [lerp(3, 2, u), lerp(7, 6, u)], alpha: lerp(0.35, 0.7, u), soft: u < 0.34 };
};
// Which layer particle i is in: the far layer holds the most (layer l has L - l shares of n).
function layerOf(i, o) {
  const L = o.layers ?? 3, n = o.n ?? 600, total = (L * (L + 1)) / 2;
  let cum = 0;
  for (let l = 0; l < L; l++) { cum += L - l; if (i < Math.round((n * cum) / total)) return layer(l, L); }
  return layer(L - 1, L);
}

// Mote i at time t. It loops: age = ((t - born) % life + life) % life, so it is alive at t = 0 and forever, and its alpha
// sin(pi * age / life) is 0 at birth and at death. Rises from its own height, sways, drifts sideways. opts: n (600),
// layers (3), color (default ink with 12 % accent), drift (px/s of sideways wind at depth 1, default 8), cam, seed,
// density 0..1 (a per-particle threshold fades particles in and out; move it by at most ~1 per second and no particle pops), alpha (a scene fade).
export function moteAt(i, t, o = {}) {
  const r = (k) => rnd(i, o, k), c = camOf(o), Ly = layerOf(i, o), d = Ly.depth;
  const born = r(1) * 6, life = lerp(2, 5, r(2)), age = wrap(t - born, life), p = age / life, k = 1 + c.z * d;
  const wx = wrap(r(3) * W + Math.sin(t * (0.3 + r(4)) + r(5) * TAU) * 40 * d + (o.drift ?? 8) * t * d - c.dx * d, W);
  const wy = wrap(r(11) * (H + 80) - age * lerp(...Ly.speed, r(6)) - c.dy * d, H + 80) - 40;
  // where the camera wraps the field round the frame edge, the particle is already faded out
  const edge = smooth(0, 60, wx) * smooth(0, 60, W - wx) * smooth(-40, 20, wy) * (1 - smooth(H - 20, H + 40, wy));
  const dial = clamp01(((o.density ?? 1) - (1 - DIAL) * r(9)) / DIAL);
  return {
    x: CX + (wx - CX) * k, y: CY + (wy - CY) * k, r: lerp(...Ly.size, r(7)) * k, p, layer: Ly.l, soft: Ly.soft,
    alpha: Math.sin(Math.PI * p) * lerp(0.3, 1, r(8)) * Ly.alpha * edge * dial * (o.alpha ?? 1),
    color: o.color ?? (r(10) > 0.88 ? T.color.accent : T.color.ink),
  };
}

// opts: moteAt's. Drawn additively ('lighter'), far layer first.
export function motes(ctx, t, o = {}) {
  if (off()) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < (o.n ?? 600); i++) {
    const m = moteAt(i, t, o), s = m.alpha > 0.002 && sprite(m.color, m.soft ? "soft" : "disc");
    if (!s) continue;
    ctx.globalAlpha = m.alpha;
    ctx.drawImage(s, m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
  }
  ctx.restore();
}

/* ---------- burst: ballistic sparks ---------- */

// Spark i of a burst at (o.x, o.y) that goes off at o.t0, or null. Position is v * age + g * age^2 / 2. opts: angle (the
// centre of the cone, default straight up), spread (default a full circle), speed [min, max] px/s, gravity px/s^2, life
// [min, max] s (default [0.8, 1.4]: each spark fades linearly over its own life), colors, cam, seed.
export function sparkAt(i, t, o) {
  const r = (k) => rnd(i, o, k), c = camOf(o), age = t - o.t0, life = lerp(...(o.life ?? [0.8, 1.4]), r(2));
  if (age < 0 || age > life) return null;
  const ang = (o.angle ?? -Math.PI / 2) + (r(1) - 0.5) * (o.spread ?? TAU), sp = lerp(...(o.speed ?? [220, 900]), r(3)), g = o.gravity ?? 900;
  const at = (a) => place(o.x + Math.cos(ang) * sp * a, o.y + Math.sin(ang) * sp * a + 0.5 * g * a * a, 1, c);
  const [x, y, k] = at(age), [x2, y2] = at(Math.max(0, age - STREAK)), p = age / life, colors = o.colors ?? [T.color.accent, T.color.ink];
  return { x, y, x2, y2, k, p, alpha: smooth(0, RAMP, age) * (1 - p), color: colors[Math.floor(r(4) * colors.length)] };
}

// Each spark is a short line from pos(age - 0.03) to pos(age): motion blur for free. A wide faint halo under a core line,
// added together. opts: n (default 220), + sparkAt's.
export function burst(ctx, t, o) {
  if (off()) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
  for (let i = 0; i < (o.n ?? 220); i++) {
    const s = sparkAt(i, t, o);
    if (!s || s.alpha <= 0.002) continue;
    const w = T.stroke.outline * (1 - 0.6 * s.p) * s.k;
    ctx.beginPath(); ctx.moveTo(s.x2, s.y2); ctx.lineTo(s.x, s.y);
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = s.alpha * 0.3; ctx.lineWidth = w * 2.5; ctx.stroke();       // halo
    ctx.globalAlpha = s.alpha; ctx.lineWidth = w; ctx.stroke();                   // core
  }
  ctx.restore();
}

/* ---------- confetti: ballistic with drag, and a flip ---------- */

const CONFETTI = [T.color.accent, T.color.ice, T.color.coral, T.color.violet, T.color.ink];

// Piece i of a burst at (o.x, o.y) at o.t0, or null. With drag k and gravity g the exact position is
// v * (1 - e^(-k age)) / k + (g / k) * (age - (1 - e^(-k age)) / k): still closed form. scaleY = cos(age * spin) turns the
// rectangle over. opts: angle, spread (default 2.2 rad), speed [min, max], drag (2.4), gravity (700), life [min, max]
// (default [2.2, 3.4]), colors, cam, seed.
export function confettiAt(i, t, o) {
  const r = (k) => rnd(i, o, k), c = camOf(o), age = t - o.t0, life = lerp(...(o.life ?? [2.2, 3.4]), r(2));
  if (age < 0 || age > life) return null;
  const ang = (o.angle ?? -Math.PI / 2) + (r(1) - 0.5) * (o.spread ?? 2.2), sp = lerp(...(o.speed ?? [700, 2000]), r(3)), k = o.drag ?? 2.4, g = o.gravity ?? 700;
  const e = (1 - Math.exp(-k * age)) / k, p = age / life, w = lerp(8, 16, r(7)), colors = o.colors ?? CONFETTI;
  const [x, y, z] = place(o.x + Math.cos(ang) * sp * e, o.y + Math.sin(ang) * sp * e + (g / k) * (age - e), 1, c);
  return {
    x, y, k: z, rot: r(4) * TAU + (r(5) - 0.5) * 6 * age, flip: Math.cos(age * lerp(6, 16, r(6))), w, h: w * lerp(0.45, 0.7, r(8)),
    color: colors[Math.floor(r(9) * colors.length)], p, alpha: smooth(0, RAMP, age) * (1 - smooth(0.7, 1, p)),
  };
}

// opts: n (default 160), + confettiAt's. A piece edge-on is darker, so the flip reads.
export function confetti(ctx, t, o) {
  if (off()) return;
  for (let i = 0; i < (o.n ?? 160); i++) {
    const c = confettiAt(i, t, o);
    if (!c || c.alpha <= 0.002) continue;
    ctx.save();
    ctx.globalAlpha = c.alpha;
    ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.scale(c.k, c.k * c.flip);
    ctx.fillStyle = shade(c.color, -0.25 * (1 - Math.abs(c.flip)));
    ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
    ctx.restore();
  }
}

/* ---------- sparks from glyphs: a tiny burst where each letter locks ---------- */

// The bursts sparksFromGlyphs fires: one per glyph (spaces skipped), at the glyph's centre, at the time it locks. `glyphs`
// is layoutGlyphs(...).glyphs and lockTimes[i] the time glyph i locks (engine/type.js: lockTimes, the times `scramble`
// locks its glyphs at). opts: y (default the glyph's baseline) and lift (px above it, default 40), n (14), speed, life
// (default [0.7, 1.2]), gravity, spread (2.6 rad, a cone), angle, colors, cam, seed.
export function glyphBursts(glyphs, lockTimes, o = {}) {
  return glyphs.flatMap((g, i) => (g.ch === " " ? [] : [{
    x: g.x + g.w / 2, y: (o.y ?? g.y) - (o.lift ?? 40), t0: lockTimes[i], n: o.n ?? 14,
    speed: o.speed ?? [140, 520], life: o.life ?? [0.7, 1.2], gravity: o.gravity ?? 700, spread: o.spread ?? 2.6, angle: o.angle,
    colors: o.colors, cam: o.cam, seed: (o.seed ?? 0) + 131 * (i + 1),
  }]));
}
export function sparksFromGlyphs(ctx, t, glyphs, lockTimes, o = {}) {
  for (const b of glyphBursts(glyphs, lockTimes, o)) burst(ctx, t, b);
}

/* ---------- the GPU field ---------- */

// Thousands of points with nothing uploaded: every attribute is a hash of gl_VertexID, every position a formula of uTime.
// The hash is an integer one (PCG), not fract(sin(x) * 43758.5): sin() is implemented differently on different GPUs, so a
// sin-hash field is not the same field on another machine, and at ids in the tens of thousands float32 runs out of
// precision. Integer maths is the same everywhere, which is also what lets glParticleAt below match it bit for bit.
// age = mod(...) loops it; alpha = sin(pi * age / life) is 0 at birth and at death; points are added (ONE, ONE) into
// whatever framebuffer is bound, as soft round sprites.
export const GLSL = {
  vert: `#version 300 es
precision highp float;
precision highp int;
uniform float uTime, uDensity, uSize, uDrift, uZoom;
uniform vec2 uRes, uCam;
uniform int uSeed, uFirst;
uniform vec3 uInk, uAccent, uIce;
out float vA;
out vec3 vC;
uint pcg(uint v) { uint s = v * 747796405u + 2891336453u; uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
float h(uint i, uint k) { return float(pcg(pcg(i + uint(uSeed) * 7919u) + k * 2654435761u) >> 8u) / 16777216.0; }
float sm(float a, float b, float x) { float u = clamp((x - a) / (b - a), 0.0, 1.0); return u * u * (3.0 - 2.0 * u); }
void main() {
  uint id = uint(gl_VertexID + uFirst);
  float life = 2.0 + 3.0 * h(id, 1u);
  float age = mod(uTime - h(id, 2u) * 6.0, life);
  float depth = 0.25 + 0.75 * h(id, 3u);                        // far .. near
  float k = 1.0 + uZoom * depth;                                // the camera's dolly
  float rows = uRes.y + 80.0;
  vec2 w;
  w.x = mod(h(id, 4u) * uRes.x + sin(uTime * (0.3 + h(id, 5u)) + h(id, 6u) * 6.2831853) * 40.0 * depth + uDrift * uTime * depth - uCam.x * depth, uRes.x);
  w.y = mod(h(id, 7u) * rows - age * (60.0 + 120.0 * h(id, 8u)) * depth - uCam.y * depth, rows) - 40.0;   // the camera shifts by depth: parallax
  vec2 p = uRes * 0.5 + (w - uRes * 0.5) * k;
  gl_Position = vec4(p / uRes * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y *= -1.0;
  gl_PointSize = max(1.5, uSize * (1.0 + 3.0 * h(id, 9u)) * (0.5 + 0.5 * depth) * k);
  // density is a dial: each particle has a threshold and fades in as the dial passes it (over a quarter of its travel), so
  // turning it at a sane speed never pops one
  float dial = clamp((uDensity - 0.75 * h(id, 10u)) / 0.25, 0.0, 1.0);
  // where the camera wraps the field, the particle is already faded out
  float edge = sm(0.0, 60.0, w.x) * sm(0.0, 60.0, uRes.x - w.x) * sm(-40.0, 20.0, w.y) * (1.0 - sm(uRes.y - 20.0, uRes.y + 40.0, w.y));
  vA = sin(3.14159265 * age / life) * (0.3 + 0.7 * h(id, 11u)) * dial * edge;
  vC = mix(mix(uInk, uAccent, step(0.85, h(id, 12u))), uIce, step(0.93, h(id, 13u)));
}`,
  frag: `#version 300 es
precision highp float;
uniform float uIntensity;
in float vA;
in vec3 vC;
out vec4 fragColor;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.0, r);                            // a soft round sprite
  fragColor = vec4(vC * a * a * vA * uIntensity, 1.0);
}`,
};

const lin = (hex) => [1, 3, 5].map((i) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
const programs = new WeakMap();                                 // per GL context: compiled once, on first use
function build(gl) {
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`particle shader compile failed: ${gl.getShaderInfoLog(s)}`);
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, GLSL.vert)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, GLSL.frag));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`particle program link failed: ${gl.getProgramInfoLog(p)}`);
  const u = {};
  for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
  return { p, u, vao: gl.createVertexArray() };                  // the empty VAO a vertex-less draw needs
}

// Draws the field into the framebuffer that is bound (the caller sets it and the viewport), added on top of what is there.
// opts: n (default 40000), cam, density 0..1 (1), size px (1.5), intensity (0.9: HDR, so bright ones can bloom), drift
// (px/s, 8), seed, first (the id of the first point: QA draws one particle with n 1), colors [ink, accent, ice] as hex (default the tokens). Leaves the blend state, program and VAO as it found them.
export function glParticles(gl, t, o = {}) {
  const n = o.n ?? 40000;
  if (n <= 0) return;
  let P = programs.get(gl);
  if (!P) programs.set(gl, (P = build(gl)));
  const c = camOf(o), [ink, accent, ice] = (o.colors ?? [T.color.ink, T.color.accent, T.color.ice]).map(lin);
  const was = { prog: gl.getParameter(gl.CURRENT_PROGRAM), vao: gl.getParameter(gl.VERTEX_ARRAY_BINDING), blend: gl.isEnabled(gl.BLEND),
    fn: [gl.BLEND_SRC_RGB, gl.BLEND_DST_RGB, gl.BLEND_SRC_ALPHA, gl.BLEND_DST_ALPHA].map((k) => gl.getParameter(k)) };
  gl.useProgram(P.p); gl.bindVertexArray(P.vao);
  gl.uniform1f(P.u.uTime, t); gl.uniform1f(P.u.uDensity, o.density ?? 1); gl.uniform1f(P.u.uSize, o.size ?? 1.5);
  gl.uniform1f(P.u.uIntensity, o.intensity ?? 0.9); gl.uniform1f(P.u.uDrift, o.drift ?? 8); gl.uniform1f(P.u.uZoom, c.z);
  gl.uniform2f(P.u.uRes, W, H); gl.uniform2f(P.u.uCam, c.dx, c.dy); gl.uniform1i(P.u.uSeed, o.seed ?? 0); gl.uniform1i(P.u.uFirst, o.first ?? 0);
  gl.uniform3fv(P.u.uInk, ink); gl.uniform3fv(P.u.uAccent, accent); gl.uniform3fv(P.u.uIce, ice);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
  gl.drawArrays(gl.POINTS, 0, n);
  gl.blendFuncSeparate(...was.fn);
  if (!was.blend) gl.disable(gl.BLEND);
  gl.bindVertexArray(was.vao); gl.useProgram(was.prog);
}

// The JS twin of the vertex shader's maths: the same integer hash (bit for bit) and the same formulas in float64. npm test
// scans it for alpha jumps (the GPU's output cannot be read back per particle); the shader itself is checked for its
// structure. Returns the point's screen position, size, and alpha (vA: the sprite's falloff and the intensity come later).
const pcg = (v) => { const s = (Math.imul(v | 0, 747796405) + 2891336453) >>> 0, w = Math.imul(((s >>> ((s >>> 28) + 4)) ^ s) | 0, 277803737) >>> 0; return ((w >>> 22) ^ w) >>> 0; };
const gh = (i, k, seed) => (pcg((pcg((i + seed * 7919) >>> 0) + Math.imul(k, 2654435761 | 0)) >>> 0) >>> 8) / 16777216;
export function glParticleAt(i, t, o = {}) {
  const c = camOf(o), h = (k) => gh(i, k, o.seed ?? 0), rows = H + 80;
  const life = 2 + 3 * h(1), age = wrap(t - h(2) * 6, life), depth = 0.25 + 0.75 * h(3), k = 1 + c.z * depth;
  const wx = wrap(h(4) * W + Math.sin(t * (0.3 + h(5)) + h(6) * TAU) * 40 * depth + (o.drift ?? 8) * t * depth - c.dx * depth, W);
  const wy = wrap(h(7) * rows - age * (60 + 120 * h(8)) * depth - c.dy * depth, rows) - 40;
  const edge = smooth(0, 60, wx) * smooth(0, 60, W - wx) * smooth(-40, 20, wy) * (1 - smooth(H - 20, H + 40, wy));
  const dial = clamp01(((o.density ?? 1) - (1 - DIAL) * h(10)) / DIAL);
  return {
    x: CX + (wx - CX) * k, y: CY + (wy - CY) * k, p: age / life,
    size: Math.max(1.5, (o.size ?? 1.5) * (1 + 3 * h(9)) * (0.5 + 0.5 * depth) * k),
    alpha: Math.sin(Math.PI * (age / life)) * (0.3 + 0.7 * h(11)) * dial * edge,
  };
}

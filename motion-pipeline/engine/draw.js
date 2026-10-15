// Finish for Canvas2D illustrations: lit fills, grain, line boil, shadows, draw-on strokes, pulses. Pure functions of t;
// colours, stroke widths, radii and the shadow alpha come from tokens.js. Light comes from the top left.
import { tokens as T } from "../tokens.js";
import { clamp01, lerp } from "./ease.js";
import { hash, mulberry32 } from "./rng.js";

/* ---------- colour ---------- */

function hexToHsl(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let hue = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    hue = (max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4) / 6;
  }
  return [hue, s, l];
}
function hslToHex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => { const k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  const to = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

// Shift a colour's HSL lightness by dl (a fraction: +0.1 is ten points lighter). Hue and saturation stay put.
export const shade = (hex, dl) => { const [h, s, l] = hexToHsl(hex); return hslToHex(h, s, clamp01(l + dl)); };
export const lightness = (hex) => hexToHsl(hex)[2];
export const hue = (hex) => hexToHsl(hex)[0] * 360;
export const rgba = (hex, a) => {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

// A gradient lit from the top left: lighter at the top left, darker at the bottom right, three stops from one base.
// Returns the CanvasGradient; set it as fillStyle (or strokeStyle).
export function litFill(ctx, x, y, w, h, base) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, shade(base, 0.1));
  g.addColorStop(0.55, base);
  g.addColorStop(1, shade(base, -0.14));
  return g;
}

/* ---------- grain ---------- */

// A 512x512 noise tile, built once at load from a seeded generator (load time is the only time mulberry32 may run).
// Under Node, where the tests import the scenes, there is no document and no tile; nothing draws there.
const GRAIN = 512, GRAIN_ALPHA = 0.08;
const TILE = typeof document === "undefined" ? null : (() => {
  const c = document.createElement("canvas");
  c.width = c.height = GRAIN;
  const g = c.getContext("2d"), img = g.createImageData(GRAIN, GRAIN), rnd = mulberry32(20260101);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + Math.round((rnd() + rnd() - 1) * 90);   // triangular noise around mid grey, which overlay leaves alone
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
})();

// The tile over the whole frame, overlay blend at 8 %, shifted by hash(frame) so the grain lives. Call it last.
export function grain(ctx, t) {
  if (!TILE) return;
  const f = Math.round(t * T.FPS), ox = Math.floor(hash(f, 1) * GRAIN), oy = Math.floor(hash(f, 2) * GRAIN);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = GRAIN_ALPHA;
  ctx.fillStyle = ctx.createPattern(TILE, "repeat");
  ctx.translate(-ox, -oy);                                   // the pattern follows the transform
  ctx.fillRect(ox, oy, T.W, T.H);
  ctx.restore();
}

/* ---------- boiling line ---------- */

// Strokes the polyline `pts` as an inked line that re-draws itself fps times a second: every vertex is nudged by up to
// amp px with hash(i, seed + floor(t * fps)), and each segment's width varies by +-15 %. Uses the context's strokeStyle
// and lineWidth. opts: amp 1.5, fps 8, seed 0, closed (the last point joins the first); and, for finished work,
// step (jitter is hashed every `step` vertices and blended between, 1 = every vertex alone), weight(mx, my) -> width
// multiplier and color(mx, my) -> stroke colour per segment, given the segment's midpoint.
export function boilPath(ctx, pts, t, o = {}) {
  const amp = o.amp ?? 1.5, fps = o.fps ?? 8, seed = o.seed ?? 0, step = o.step ?? 1, k = Math.floor(t * fps), n = pts.length, base = ctx.lineWidth;
  const noise = (i, salt) => lerp(hash(Math.floor(i / step), seed + k + salt), hash(Math.floor(i / step) + 1, seed + k + salt), (i % step) / step);
  const j = pts.map(([x, y], i) => [x + amp * (2 * noise(i, 0) - 1), y + amp * (2 * noise(i, 9973) - 1)]);
  const color = ctx.strokeStyle;
  for (let i = 0; i < (o.closed ? n : n - 1); i++) {
    const a = j[i], b = j[(i + 1) % n], mx = (pts[i][0] + pts[(i + 1) % n][0]) / 2, my = (pts[i][1] + pts[(i + 1) % n][1]) / 2;
    ctx.lineWidth = base * (o.weight ? o.weight(mx, my) : 1) * (1 + 0.15 * (2 * hash(i, seed + k + 4999) - 1));
    if (o.color) ctx.strokeStyle = o.color(mx, my);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  ctx.lineWidth = base; ctx.strokeStyle = color;
}

/* ---------- shadows and light on the floor ---------- */

// Where an object meets the floor: a soft penumbra and a tighter core under it, both blurred ellipses at the token shadow alpha.
export function contactShadow(ctx, x, y, w) {
  ctx.save();
  ctx.globalAlpha = T.shadowAlpha;
  ctx.fillStyle = shade(T.color.bg, -1);
  for (const [f, hgt, blur] of [[1, 0.075, 0.04], [0.72, 0.03, 0.012]]) {
    ctx.filter = `blur(${w * blur}px)`;
    ctx.beginPath(); ctx.ellipse(x, y + w * 0.012, (w * f) / 2, w * hgt, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// A pool of the object's own colour on the floor, so the contact shadow has something to darken.
export function pool(ctx, x, y, w, color) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(1, 0.26);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
  g.addColorStop(0, rgba(color, T.shadowAlpha)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, w / 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* ---------- paths: draw-on and pulse ---------- */

// Cumulative lengths of a polyline, cached by array identity: call it once at load for every path a scene uses.
const lengths = new WeakMap();
export function measure(pts) {
  let m = lengths.get(pts);
  if (!m) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    lengths.set(pts, (m = { cum, len: cum[cum.length - 1] }));
  }
  return m;
}
function pointAt(pts, s) {
  const { cum } = measure(pts);
  let i = 1;
  while (i < pts.length - 1 && cum[i] < s) i++;
  const u = clamp01((s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1));
  return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)];
}

// Stroke reveal by dash offset: p in 0..1 is how much of the polyline is drawn. Uses the context's strokeStyle and lineWidth.
export function drawOn(ctx, pts, p) {
  const { len } = measure(pts);
  if (p <= 0 || !len) return;
  ctx.save();
  ctx.lineCap = ctx.lineJoin = "round";
  ctx.setLineDash([len, len]); ctx.lineDashOffset = len * (1 - clamp01(p));
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.restore();
}

// A pulse at p (0..1) along the polyline: a bright head with an 8-dot tail, all additive.
export function pulseAlong(ctx, pts, p) {
  if (p <= 0 || p >= 1) return;
  const { len } = measure(pts), head = p * len, TAIL = 8, STEP = 16;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let k = TAIL; k >= 1; k--) {                          // oldest, dimmest dot first
    const s = head - k * STEP;
    if (s < 0) continue;
    const [x, y] = pointAt(pts, s), f = 1 - k / (TAIL + 1);
    ctx.globalAlpha = 0.7 * f * f; ctx.fillStyle = T.color.accent;
    ctx.beginPath(); ctx.arc(x, y, 3 + 6 * f, 0, Math.PI * 2); ctx.fill();
  }
  const [hx, hy] = pointAt(pts, head), g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 30);
  g.addColorStop(0, rgba(T.color.accent, 0.9)); g.addColorStop(1, rgba(T.color.accent, 0));
  ctx.globalAlpha = 1; ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(hx, hy, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = T.color.ink;
  ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

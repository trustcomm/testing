// Kinetic typography for the Canvas2D renderFrame(t) engine. Each move is (ctx, t, opts): it draws immediately and is a
// pure function of t (scene seconds); it leaves the context as it found it. Fonts and colours come from tokens.js.
//
// opts shared by every move:
//   text, x, y   the string, and the left end of its baseline
//   role, size   type role from the tokens (default "h1") and an optional px override
//   t0           when the entrance starts
//   color        ink by default
//   out          [start, end] of a quick exit (fade and lift); splitExit uses it for the split
import { tokens as T } from "../tokens.js";
import { win, lerp, outCubic, inOutQuint, outExpo } from "./ease.js";
import { hash } from "./rng.js";
import { fontFor } from "./layout.js";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>";
const LIFT = 18;   // px an exiting line rises while it fades

function face(o) {
  const role = o.role ?? "h1", px = o.size ?? T.size[role];
  return { px, font: fontFor(role, px), track: (T.track[role] ?? 0) * px };
}
const exitK = (t, o) => (o.out ? inOutQuint(win(t, o.out[0], o.out[1])) : 0);
const ink = (o) => o.color ?? T.color.ink;

// Words as spans over the glyph list: [{ a, b, x0, x1 }] with a..b the glyph indices.
function wordsOf(glyphs) {
  const out = [];
  let cur = null;
  for (const g of glyphs) {
    if (g.ch === " ") { cur = null; continue; }
    if (!cur) out.push((cur = { a: g.i, b: g.i + 1, x0: g.x, x1: g.x + g.w }));
    else { cur.b = g.i + 1; cur.x1 = g.x + g.w; }
  }
  return out;
}

// 1. Where every glyph sits. Measured as prefixes of the whole string, so kerning and tracking are exactly what
//    drawing the string in one go would give. width excludes the tracking after the last glyph.
export function layoutGlyphs(ctx, str, x, y, font, trackPx = 0) {
  ctx.save();
  ctx.font = font; ctx.letterSpacing = `${trackPx}px`; ctx.textAlign = "left";
  const M = (s) => ctx.measureText(s).width;
  const glyphs = [];
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    glyphs.push({ ch, i, x: x + M(str.slice(0, i + 1)) - M(ch), y, w: M(ch) - trackPx });
  }
  const width = str.length ? M(str) - trackPx : 0;
  ctx.restore();
  return { glyphs, width };
}

// 2. riseIn: glyphs rise, un-blur and fade in on a stagger (opts: stagger 0.03 s, dur 0.3 s per glyph, rise, blur).
export const riseInDur = (text, o = {}) => (text.replace(/ /g, "").length - 1) * (o.stagger ?? 0.03) + (o.dur ?? 0.3);
export function riseIn(ctx, t, o) {
  const { px, font, track } = face(o);
  const { glyphs } = layoutGlyphs(ctx, o.text, o.x, o.y, font, track);
  const stagger = o.stagger ?? 0.03, dur = o.dur ?? 0.3, rise = o.rise ?? px * 0.4, blur = o.blur ?? px * 0.1, k = exitK(t, o);
  ctx.save();
  ctx.font = font; ctx.letterSpacing = "0px"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = ink(o);
  let v = 0;
  for (const g of glyphs) {
    if (g.ch === " ") continue;
    const s = o.t0 + v++ * stagger, p = outExpo(win(t, s, s + dur)), a = p * (1 - k);
    if (a <= 0.002) continue;
    ctx.globalAlpha = a;
    ctx.filter = p < 0.995 ? `blur(${(1 - p) * blur}px)` : "none";
    ctx.fillText(g.ch, g.x, g.y + (1 - p) * rise - LIFT * k);
  }
  ctx.restore();
}

// when glyph i of n locks in a scramble: left to right across `dur`
export const scrambleLock = (i, n, o) => o.t0 + ((o.dur ?? 0.5) * (i + 1)) / n;
// the times all n glyphs lock at: what sparksFromGlyphs (engine/particles.js) takes
export const lockTimes = (n, o) => Array.from({ length: n }, (_, i) => scrambleLock(i, n, o));

// 3. scramble: glyphs resolve left to right (opts: dur, seed). Slots come from the FINAL string, and each scrambled
//    character is centred in its slot, so the line never jitters. A mono role keeps every slot the same width.
export function scramble(ctx, t, o) {
  const { font, track } = face(o);
  const { glyphs } = layoutGlyphs(ctx, o.text, o.x, o.y, font, track);
  const n = glyphs.length, dur = o.dur ?? 0.5, seed = o.seed ?? 0, k = exitK(t, o), frame = Math.floor(t * 20);
  ctx.save();
  ctx.font = font; ctx.letterSpacing = "0px"; ctx.textBaseline = "alphabetic"; ctx.textAlign = "center";
  glyphs.forEach((g, i) => {
    if (g.ch === " ") return;
    const lock = scrambleLock(i, n, o), locked = t >= lock;
    ctx.globalAlpha = (1 - k) * win(t, o.t0, o.t0 + 0.08);
    ctx.fillStyle = !locked ? T.color.dim : t < lock + 0.12 ? T.color.accent : ink(o);   // a glyph flashes accent as it locks
    ctx.fillText(locked ? g.ch : CHARS[Math.floor(hash(i, seed + frame) * CHARS.length)], g.x + g.w / 2, g.y - LIFT * k);
  });
  ctx.restore();
}

// 4. typeOn: uneven keystrokes (opts: dur, seed). The caret is solid while typing and blinks at 2 Hz after;
//    the newest character is accent.
export function typeOn(ctx, t, o) {
  const { px, font, track } = face(o);
  const { glyphs, width } = layoutGlyphs(ctx, o.text, o.x, o.y, font, track);
  const n = glyphs.length, dur = o.dur ?? 0.5, seed = o.seed ?? 0, k = exitK(t, o);
  const cum = [0];
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + 0.6 + 0.8 * hash(i - 1, seed));   // the wait before char i, hashed
  const at = (i) => o.t0 + (dur * cum[i]) / (cum[n - 1] || 1);                         // the last char lands at t0 + dur
  let count = 0;
  while (count < n && t >= at(count)) count++;
  if (count === 0) return;
  const y = o.y - LIFT * k;
  ctx.save();
  ctx.font = font; ctx.letterSpacing = "0px"; ctx.textBaseline = "alphabetic"; ctx.globalAlpha = 1 - k;
  for (let i = 0; i < count; i++) {
    if (glyphs[i].ch === " ") continue;
    ctx.fillStyle = i === count - 1 ? T.color.accent : ink(o);
    ctx.fillText(glyphs[i].ch, glyphs[i].x, y);
  }
  const done = at(n - 1);
  if (t < done || Math.floor((t - done) * 4) % 2 === 0) {
    ctx.fillStyle = T.color.accent;
    ctx.fillRect((count < n ? glyphs[count].x : o.x + width) + px * 0.05, y - px * 0.74, Math.max(3, px * 0.07), px * 0.82);
  }
  ctx.restore();
}

// 5. odometer: an integer rolls from `from` to `to` (opts: dur, spins, prefix, suffix, affixColor). Every digit column
//    is clipped to the line height, rolls on outCubic and lands with the others; leading zeros fade in or out.
//    A column whose digit does not change still rolls one full turn, and spins adds more. Fast columns smear: the
//    number of taps follows how far the digit moves in a shutter, so they fuse into a vertical blur, over a crisp lead copy.
export function odometer(ctx, t, o) {
  const { px, font, track } = face(o);
  const dur = o.dur ?? 0.55, spins = o.spins ?? 0, k = exitK(t, o), alpha = 1 - k;
  const sa = String(o.from), sb = String(o.to), n = Math.max(sa.length, sb.length);
  const da = sa.padStart(n, "0"), db = sb.padStart(n, "0");
  const y = o.y - LIFT * k, shutter = 1 / 60, roll = (u) => outCubic(win(u, o.t0, o.t0 + dur));
  ctx.save();
  ctx.font = font; ctx.textBaseline = "alphabetic"; ctx.letterSpacing = `${track}px`;
  const slot = Math.max(...[..."0123456789"].map((d) => ctx.measureText(d).width));   // tabular: the widest digit
  const affix = (s, x, a) => { ctx.fillStyle = o.affixColor ?? ink(o); ctx.globalAlpha = a; ctx.fillText(s, x, y); return ctx.measureText(s).width; };
  const fade = alpha * win(t, o.t0, o.t0 + 0.2);
  let x = o.x;
  if (o.prefix) x += affix(o.prefix, x, fade);
  ctx.letterSpacing = "0px"; ctx.textAlign = "center";
  for (let j = 0; j < n; j++) {
    const a = +da[j], r = ((+db[j] - a + 10) % 10 || 10) + 10 * spins;
    const s = roll(t), pos = a + s * r, prev = a + roll(t - shutter) * r, D = Math.abs(pos - prev);
    const moving = D > 0.12, taps = moving ? Math.min(16, Math.max(2, Math.ceil(D / 0.06))) : 1;
    const al = alpha * (j < n - sa.length ? win(s, 0, 0.3) : 1) * (j < n - sb.length ? 1 - win(s, 0.7, 1) : 1);
    if (al > 0.002) {
      const at = (p, a8) => {                              // the digit column with the strip at position p
        const d0 = Math.floor(p), f = p - d0;
        ctx.globalAlpha = a8;
        ctx.fillText(String(d0 % 10), x + (slot - track) / 2, y - f * px);
        ctx.fillText(String((d0 + 1) % 10), x + (slot - track) / 2, y + (1 - f) * px);
      };
      ctx.save();
      ctx.beginPath(); ctx.rect(x - 1, y - 0.82 * px, slot + 2, px); ctx.clip();   // one line high
      ctx.fillStyle = ink(o);
      if (moving) { for (let m = 0; m < taps; m++) at(lerp(prev, pos, m / (taps - 1)), al * 0.14); at(pos, al * 0.45); }
      else at(pos, al);
      ctx.restore();
    }
    x += slot;
  }
  ctx.textAlign = "left"; ctx.letterSpacing = `${track}px`;
  if (o.suffix) affix(o.suffix, x, fade);
  ctx.restore();
}

// 6. markerWipe: an accent pill grows behind one word (opts: mark = word index, default the last; dur, delay, pad), and
//    the word flips to dark-on-accent as the pill covers it. The flip is clipped to the pill, so the word is never
//    unreadable: light on the dark, dark on the lime.
export function markerWipe(ctx, t, o) {
  const { px, font, track } = face(o);
  const { glyphs } = layoutGlyphs(ctx, o.text, o.x, o.y, font, track);
  const words = wordsOf(glyphs), w = words[o.mark ?? words.length - 1];
  const dur = o.dur ?? 0.45, delay = o.delay ?? 0.1, k = exitK(t, o);
  const lineP = outExpo(win(t, o.t0, o.t0 + 0.3)), p = outExpo(win(t, o.t0 + delay, o.t0 + delay + dur));
  const pad = o.pad ?? px * 0.2, x0 = w.x0, top = o.y - px * 0.86, h = px * 1.02, pw = (w.x1 - w.x0 + 2 * pad) * p;
  const room = pad * p, dx = (i) => (i < w.a ? 0 : i < w.b ? room : 2 * room);      // the words make room as the pill grows
  ctx.save();
  ctx.translate(0, (1 - lineP) * px * 0.2 - LIFT * k);
  ctx.globalAlpha = lineP * (1 - k);
  ctx.font = font; ctx.letterSpacing = "0px"; ctx.textBaseline = "alphabetic";
  const pill = new Path2D();
  if (pw > 0.5) pill.roundRect(x0, top, pw, h, Math.min(h / 2, pw / 2));
  ctx.fillStyle = T.color.accent; ctx.fill(pill);
  ctx.fillStyle = ink(o);
  for (const g of glyphs) if (g.ch !== " " && (g.i < w.a || g.i >= w.b)) ctx.fillText(g.ch, g.x + dx(g.i), g.y);
  const outside = new Path2D();
  outside.rect(-10, -10, T.W + 20, T.H + 20); outside.addPath(pill);
  const word = () => { for (let i = w.a; i < w.b; i++) ctx.fillText(glyphs[i].ch, glyphs[i].x + dx(i), glyphs[i].y); };
  ctx.save(); ctx.clip(outside, "evenodd"); word(); ctx.restore();                              // the part of the word outside the pill: ink
  ctx.save(); ctx.clip(pill); ctx.fillStyle = T.color.bg; word(); ctx.restore();                // the part inside: dark on accent
  ctx.restore();
}

// 7. splitExit: the line breaks before its middle word (opts: at = word index, dist, shutter) and the halves slide
//    apart over `out` with a 6-tap motion blur (shutter 1/90 s: longer and the six taps stop fusing into one smear). With `in: [start, end]` the halves also slide together on the way in.
export function splitExit(ctx, t, o) {
  const { font, track } = face(o);
  const { glyphs } = layoutGlyphs(ctx, o.text, o.x, o.y, font, track);
  const words = wordsOf(glyphs), cut = words[o.at ?? Math.floor(words.length / 2)].a;
  const dist = o.dist ?? 420, shutter = o.shutter ?? 1 / 90;
  const state = (u) => {
    const pin = o.in ? outExpo(win(u, o.in[0], o.in[1])) : 1, q = inOutQuint(win(u, o.out[0], o.out[1]));
    return { off: dist * (1 - pin + q), a: pin * (1 - q) };
  };
  const now = state(t), moving = Math.abs(now.off - state(t - shutter).off) > 0.5, taps = moving ? 6 : 1;
  if (now.a <= 0.002 && !moving) return;
  ctx.save();
  ctx.font = font; ctx.letterSpacing = "0px"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = ink(o);
  for (let m = taps - 1; m >= 0; m--) {                                      // oldest tap first, so the newest sits on top
    const s = moving ? state(t - (shutter * m) / 5) : now;
    ctx.globalAlpha = 1 - Math.pow(1 - s.a, 1 / taps);                         // taps that coincide add back up to s.a
    for (const g of glyphs) if (g.ch !== " ") ctx.fillText(g.ch, g.x + (g.i < cut ? -s.off : s.off), g.y);
  }
  ctx.restore();
}

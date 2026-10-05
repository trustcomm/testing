// One module renders every card of the reel (the timeline entry says what the card is).
// Two colours only: charcoal + orange, inverted on every cut. Flat colour, no glow/gradient/blur effects
// (the only blur is the engine's motion blur on the three smear entries).
import { ASSETS } from "../../godevlevel-launch/engine/web/core/assets.js";
import { C, FONT } from "../../godevlevel-launch/engine/web/core/brand.js";
import { drawCarry } from "../../godevlevel-launch/engine/web/core/carry.js";
import { clamp } from "../../godevlevel-launch/engine/web/core/ease.js";
import { text } from "../../godevlevel-launch/engine/web/core/text.js";

const W = 1080, H = 1920, CX = 540, CY = 960;
const MAXW = 900; // ≥ 63 px side margins even on the 1.06 punch frame
const BASE = 132; // regular words (never below MIN)
const EMPH = 2.2 * BASE; // emphasis target
const MIN = 120;
const DRIFT = 0.02; // linear scale 1.00 → 1.02 across each card
const PUNCH = 1.06; // emphasis lands at 1.06 for one frame
const SMEAR_PX = 520; // incoming word starts this far right, settles in 2 frames
const LOGO_W = 440;

export const lang = () => window.REEL_LANG ?? "en";
const ink = (ground) => (ground === "charcoal" ? "orange" : "charcoal");

const cache = new Map();
/** Fit a word/phrase: one line, or two balanced lines if that is larger; capped at the target size. */
export function layout(ctx, str, emphasis) {
  const key = `${FONT.display}|${str}|${emphasis}`;
  if (cache.has(key)) return cache.get(key);
  ctx.save();
  ctx.font = `800 100px ${FONT.display}`;
  const w = (s) => ctx.measureText(s).width;
  const words = str.split(" ");
  const options = [[str]];
  for (let i = 1; i < words.length; i++) options.push([words.slice(0, i).join(" "), words.slice(i).join(" ")]);
  const target = emphasis ? EMPH : BASE;
  let best = null;
  for (const lines of options) {
    const size = Math.min(target, (100 * MAXW) / Math.max(...lines.map(w)));
    // Prefer one line unless two lines are clearly bigger.
    const score = size - (lines.length - 1) * 8;
    if (!best || score > best.score) best = { lines, size, score };
  }
  ctx.font = `800 ${best.size}px ${FONT.display}`;
  const m = best.lines.map((l) => ctx.measureText(l));
  ctx.restore();
  const lh = best.size * 0.95;
  const asc = m[0].actualBoundingBoxAscent, desc = m.at(-1).actualBoundingBoxDescent;
  const blockH = asc + (best.lines.length - 1) * lh + desc;
  const out = { lines: best.lines, size: best.size, lh, first: CY - blockH / 2 + asc, widths: m.map((x) => x.width) };
  cache.set(key, out);
  return out;
}

// Linear, settled by 1.5 frames so frames 0–1 smear (engine motion blur) and frame 2 lands crisp.
const smearOffset = (lt) => SMEAR_PX * Math.max(0, 1 - lt / (1.5 / 30)); // negative lt (pre-roll) is further right

function scaleFor(e, lt) {
  const b = e.entry;
  const f = Math.round(lt * e.fps);
  if (b.emphasis && f === 0) return PUNCH;
  return 1 + DRIFT * clamp(f / Math.max(1, b.frames - 1));
}

export default {
  carry: () => ({}),
  track(lt, e) {
    return [[CX + (e.entry.smear ? smearOffset(lt) : 0), CY]];
  },
  render(ctx, lt, e) {
    const b = e.entry;
    ctx.fillStyle = C[b.ground];
    ctx.fillRect(-W, -H, 3 * W, 3 * H);
    const s = scaleFor(e, lt);
    ctx.save();
    ctx.translate(CX + (b.smear ? smearOffset(lt) : 0), CY);
    ctx.scale(s, s);
    ctx.translate(-CX, -CY);
    const fill = ink(b.ground);

    if (b.kind === "word") {
      const L = layout(ctx, b.text[lang()], b.emphasis);
      L.lines.forEach((line, i) => text(ctx, line, CX, L.first + i * L.lh, { family: FONT.display, size: L.size, fill, align: "center", zoom: e.zoom * s }));
    } else if (b.kind === "type") {
      // The caret types the URL letter by letter, then blinks on the half beat.
      const str = b.text.en;
      const L = layout(ctx, str, false);
      ctx.save();
      ctx.font = `800 ${L.size}px ${FONT.display}`;
      const x0 = CX - ctx.measureText(str).width / 2;
      const f = Math.floor(lt * e.fps + 1e-6);
      const n = clamp(Math.floor((f - 1) / 1.3) + 1, 0, str.length);
      const shown = str.slice(0, n);
      const xEnd = x0 + ctx.measureText(shown).width;
      ctx.restore();
      if (n > 0) text(ctx, shown, x0, L.first, { family: FONT.display, size: L.size, fill, zoom: e.zoom * s });
      const typedAt = (Math.ceil(1.3 * (str.length - 1)) + 1) / e.fps;
      const on = lt < typedAt || Math.floor((lt - typedAt) / (e.beat / 2)) % 2 === 1;
      const ch = L.size * 1.0;
      if (on) drawCarry(ctx, { kind: "caret", x: xEnd + L.size * 0.08, y: L.first - L.size * 0.78, w: Math.round(L.size * 0.09), h: ch, r: 2, colour: fill });
    } else if (b.kind === "logo") {
      // Small and centred on charcoal. The reversed logo (Go/Level off-white, Dev orange) is the one
      // element outside the two colours: on charcoal the logo's own charcoal letters would vanish.
      const lw = LOGO_W, lh = (LOGO_W * ASSETS.logo.height) / ASSETS.logo.width;
      ctx.drawImage(ASSETS.logo, CX - lw / 2, CY - lh / 2, lw, lh);
    }
    ctx.restore();
  },
};

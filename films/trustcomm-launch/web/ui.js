// Vector UI parts for the Trustcomm film, built from the QR square's geometry (rounded squares, pills, circles).
// The rating-page layout is PROVISIONAL: drawn from the brief's own words (BRIEF §4) until real /r/demo screenshots
// arrive in ui/; nothing here copies Google's UI, logo, font or colours.
import { rrect } from "../../godevlevel-launch/engine/web/core/carry.js";
import { clamp } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col, FONT, rgba } from "./brand.js";

export { rrect };

/** Every string drawn on screen is recorded here so the checker can audit it against the fact ledger. */
export const DRAWN = new Set();

export function txt(ctx, s, x, y, { size, weight = 600, fill = "ink", align = "center", alpha = 1, baseline = "alphabetic" }) {
  DRAWN.add(s);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = col(fill);
  ctx.fillText(s, x, y);
  ctx.restore();
}

export function textWidth(ctx, s, size, weight = 600) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT}`;
  const w = ctx.measureText(s).width;
  ctx.restore();
  return w;
}

/** Deterministic illustrative QR (25×25 modules, three finder patterns). Not a scannable code. */
const QN = 25;
const QR = (() => {
  let s = 0x7c0ffee;
  const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 2 ** 32);
  const m = Array.from({ length: QN }, () => Array(QN).fill(0));
  const finder = new Set();
  for (const [ox, oy] of [[0, 0], [QN - 7, 0], [0, QN - 7]])
    for (let y = -1; y <= 7; y++) for (let x = -1; x <= 7; x++) finder.add(`${ox + x},${oy + y}`);
  for (let y = 0; y < QN; y++) for (let x = 0; x < QN; x++) if (!finder.has(`${x},${y}`)) m[y][x] = rnd() < 0.48 ? 1 : 0;
  for (let i = 8; i < QN - 8; i++) { m[6][i] = i % 2 === 0 ? 1 : 0; m[i][6] = i % 2 === 0 ? 1 : 0; }
  return m;
})();

/** QR at (x, y) top-left, side `size`. `grow` 0–1 reveals modules from the centre (unused = all shown). */
export function qr(ctx, x, y, size, { fill = "ink", alpha = 1 } = {}) {
  const u = size / QN;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = col(fill);
  for (let j = 0; j < QN; j++)
    for (let i = 0; i < QN; i++) {
      const inFinder = (i < 7 && j < 7) || (i >= QN - 7 && j < 7) || (i < 7 && j >= QN - 7);
      if (inFinder || !QR[j][i]) continue;
      rrect(ctx, x + i * u + u * 0.06, y + j * u + u * 0.06, u * 0.88, u * 0.88, u * 0.28);
      ctx.fill();
    }
  for (const [ox, oy] of [[0, 0], [QN - 7, 0], [0, QN - 7]]) {
    const fx = x + ox * u, fy = y + oy * u;
    ctx.lineWidth = u;
    ctx.strokeStyle = col(fill);
    rrect(ctx, fx + u / 2, fy + u / 2, 6 * u, 6 * u, u * 1.6);
    ctx.stroke();
    rrect(ctx, fx + 2 * u, fy + 2 * u, 3 * u, 3 * u, u * 0.9);
    ctx.fill();
  }
  ctx.restore();
}

/** Phone body centred at (cx, cy). Returns the screen rect; `screen(ctx, rect)` draws the screen contents (clipped). */
export const PHONE = { w: 360, h: 740, r: 56, inset: 14 };
/** Screen rect of a phone centred at (cx, cy) at scale s (world coords, unrotated). */
export const screenRect = (cx, cy, s = 1) => ({
  x: cx + (-PHONE.w / 2 + PHONE.inset) * s, y: cy + (-PHONE.h / 2 + PHONE.inset) * s,
  w: (PHONE.w - 2 * PHONE.inset) * s, h: (PHONE.h - 2 * PHONE.inset) * s, r: (PHONE.r - PHONE.inset) * s,
});
export function phone(ctx, cx, cy, screen, { s = 1, alpha = 1, rot = 0 } = {}) {
  const w = PHONE.w, h = PHONE.h;
  // screen contents are laid out in the phone's own units (332 × 712) and scale with it
  const sr = { x: -w / 2 + PHONE.inset, y: -h / 2 + PHONE.inset, w: w - 2 * PHONE.inset, h: h - 2 * PHONE.inset, r: PHONE.r - PHONE.inset };
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.fillStyle = rgba("ink", 0.12);
  rrect(ctx, -w / 2 + 10, -h / 2 + 18, w, h, PHONE.r);
  ctx.fill();
  ctx.fillStyle = col("ink");
  rrect(ctx, -w / 2, -h / 2, w, h, PHONE.r);
  ctx.fill();
  ctx.save();
  rrect(ctx, sr.x, sr.y, sr.w, sr.h, sr.r);
  ctx.clip();
  screen(ctx, sr);
  ctx.restore();
  ctx.fillStyle = col("ink");
  rrect(ctx, -46, -h / 2 + 24, 92, 22, 11); // camera pill
  ctx.fill();
  ctx.restore();
  return sr;
}

/** Pill chip centred at (cx, cy). */
export function chip(ctx, label, cx, cy, { size = 34, fill = "white", ink = "ink", stroke = null, tick = false, alpha = 1, s = 1, rot = 0 } = {}) {
  const tw = textWidth(ctx, label, size, 600);
  const pad = size * 0.8, tickW = tick ? size * 1.15 : 0;
  const w = tw + 2 * pad + tickW, h = size * 2;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.fillStyle = col(fill);
  rrect(ctx, -w / 2, -h / 2, w, h, h / 2);
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = size * 0.09;
    ctx.strokeStyle = col(stroke);
    ctx.stroke();
  }
  if (tick) {
    const x0 = -w / 2 + pad * 0.85, r = size * 0.42;
    ctx.fillStyle = col(ink);
    ctx.beginPath();
    ctx.arc(x0 + r, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = col(fill);
    ctx.lineWidth = size * 0.1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x0 + r * 0.55, 0);
    ctx.lineTo(x0 + r * 0.9, r * 0.35);
    ctx.lineTo(x0 + r * 1.5, -r * 0.4);
    ctx.stroke();
  }
  txt(ctx, label, tickW / 2, size * 0.36, { size, weight: 600, fill: ink });
  ctx.restore();
  return { w: w * s, h: h * s };
}

/** Simple face glyph for rating buttons: mood −1 (frown) … +1 (smile). */
function face(ctx, cx, cy, r, mood, colour) {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = r * 0.11;
  ctx.lineCap = "round";
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + sx * r * 0.32, cy - r * 0.2, r * 0.085, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.36, cy + r * 0.28 - mood * r * 0.06);
  ctx.quadraticCurveTo(cx, cy + r * 0.28 + mood * r * 0.28, cx + r * 0.36, cy + r * 0.28 - mood * r * 0.06);
  ctx.stroke();
  ctx.restore();
}

/**
 * The rating page (F4), inside screen rect sr (phone-local coords).
 * pop: 0–1 entry of the five buttons (staggered). PROVISIONAL layout pending ui/ screenshots.
 */
export function ratingPage(ctx, sr, { pop = 1, shop = "Meera's Tiffin Room", question = "How was the food?" } = {}) {
  const cx = sr.x + sr.w / 2;
  ctx.fillStyle = col("white");
  ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
  // header: shop colour band + name (F3: the shop's own name and colours)
  ctx.fillStyle = col("shop");
  ctx.fillRect(sr.x, sr.y, sr.w, 132);
  txt(ctx, shop, cx, sr.y + 100, { size: 25, weight: 700, fill: "ink" });
  txt(ctx, question, cx, sr.y + 330, { size: 29, weight: 700, fill: "ink" });
  const r = 27, gap = 62;
  for (let i = 0; i < 5; i++) {
    const p = clamp(pop * 5 - i * 0.8);
    const s = p <= 0 ? 0 : 1 + 0.18 * Math.sin(Math.PI * p) * (1 - p);
    if (s <= 0) continue;
    const x = cx + (i - 2) * gap, y = sr.y + 420;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = col("white");
    ctx.strokeStyle = col("blue");
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    face(ctx, 0, 0, r, -1 + i / 2, col("blue"));
    ctx.restore();
  }
}

/** Mention chips page (Beat 9 → 10): stacked pills, the first two ticked (F6). */
export const MENTIONS = [["The food", true], ["The staff", true], ["Filter Coffee", false]];
export function mentionsPage(ctx, sr, { alpha = 1, lift = 0 } = {}) {
  ctx.fillStyle = col("white");
  ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
  const cx = sr.x + sr.w / 2;
  MENTIONS.forEach(([label, on], i) => {
    chip(ctx, label, cx, sr.y + 250 + i * 104 - lift, { size: 28, fill: on ? "blue" : "white", ink: on ? "white" : "ink", stroke: on ? null : "ink", tick: on, alpha });
  });
}

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

/** Word-wrap `s` to `maxW` at `size`/`weight`; returns lines. */
export function wrap(ctx, s, maxW, size, weight = 500) {
  const words = s.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (cur && textWidth(ctx, t, size, weight) > maxW) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------------------------------------------------------
// The real /r/demo screens (ui/demo-*.jpg), rebuilt in vector inside the phone's screen (332 × 712 units).
// Layout, copy, order, components and colours follow the screenshots; positions are the screenshot's column
// (602 px) scaled to the phone's 300-unit content width; type is ~1.2× that scale, as the page renders on a phone.
// Font: Poppins (the user's choice for the film) — the product itself uses a system-style sans.
// ---------------------------------------------------------------------------------------------------------------
const X0 = 16, CW = 300; // content left edge and width in the screen

/** Progress dots: step 0..2 of 3 (done = blue dot, current = blue pill, to-do = grey dot). */
function dots(ctx, sr, step) {
  const cx = sr.x + sr.w / 2, y = sr.y + 24;
  const widths = [0, 1, 2].map((i) => (i === step ? 18 : 6));
  let x = cx - (widths.reduce((a, b) => a + b, 0) + 2 * 6) / 2;
  widths.forEach((w, i) => {
    ctx.fillStyle = col(i <= step ? "blue" : "line");
    rrect(ctx, x, y - 3, w, 6, 3);
    ctx.fill();
    x += w + 6;
  });
}

/** Five-point star centred at (cx, cy), outer radius r. */
function star(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle = col(fill);
  ctx.lineJoin = "round";
  ctx.strokeStyle = col(fill);
  ctx.lineWidth = r * 0.18;
  ctx.fill();
  ctx.stroke();
}

/** A row of chips, wrapped to the content width. Returns the y below the last row. */
function chipFlow(ctx, sr, items, y, { size = 11, h = 34, gap = 8, alpha = 1 } = {}) {
  let x = sr.x + X0;
  for (const [label, on] of items) {
    const text = on ? "✓ " + label : label;
    const w = textWidth(ctx, text, size, 500) + 22;
    if (x + w > sr.x + X0 + CW + 0.5) { x = sr.x + X0; y += h + gap; }
    ctx.save();
    ctx.globalAlpha *= alpha;
    rrect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = col(on ? "blue" : "paper");
    ctx.fill();
    if (!on) { ctx.strokeStyle = col("edge"); ctx.lineWidth = 1; ctx.stroke(); }
    ctx.restore();
    txt(ctx, text, x + w / 2, y + h / 2 + size * 0.36, { size, weight: 500, fill: on ? "white" : "ink", alpha });
    x += w + gap;
  }
  return y + h;
}

/** Bottom bar with the blue full-width button ("Continue", "Send to owner" …). press 0–1 darkens it. */
function bottomButton(ctx, sr, label, press = 0) {
  const top = sr.y + sr.h - 66;
  ctx.fillStyle = "#FAFBF6";
  ctx.fillRect(sr.x, top, sr.w, 66);
  ctx.fillStyle = col("line");
  ctx.fillRect(sr.x, top, sr.w, 1);
  rrect(ctx, sr.x + X0, top + 12, CW, 42, 8);
  ctx.fillStyle = col("blue");
  ctx.fill();
  if (press > 0) { ctx.fillStyle = `rgba(0,0,0,${0.18 * press})`; ctx.fill(); }
  txt(ctx, label, sr.x + sr.w / 2, top + 12 + 21 + 5, { size: 14, weight: 600, fill: "white" });
}

export const MENTION = [["The food", false], ["How long it took", false], ["The price", false], ["How clean it was", false], ["The staff", false], ["The portions", false]];
export const HAD = [["Masala Dosa", false], ["Filter Coffee", false], ["Idli Vada", false]];
// As in ui/demo-1: the customer ticked two things; nothing was pre-ticked (F6).
export const TICKED = { "How long it took": true, "Filter Coffee": true };

/**
 * Screen 1 (ui/demo-1): rate (food, service) + "What should the review mention?" + "What did you have?".
 * pop: 0–1 stagger of the stars appearing; rated: null (unrated) or { food: n, service: n }; ticked: chip map;
 * scroll: units the page is scrolled up; press: Continue button press 0–1.
 */
export function ratingPage(ctx, sr, { pop = 1, rated = null, ticked = {}, scroll = 0, press = 0 } = {}) {
  ctx.fillStyle = col("paper");
  ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
  ctx.save();
  ctx.translate(0, -scroll);
  dots(ctx, sr, 0);
  const L = sr.x + X0;
  let y = sr.y + 72;
  for (const [q, key] of [["How was the food?", "food"], ["How was the service?", "service"]]) {
    txt(ctx, q, L, y, { size: 16, weight: 600, fill: "ink", align: "left" });
    for (let i = 0; i < 5; i++) {
      const p = clamp(pop * 5 - i * 0.8);
      const s = p <= 0 ? 0 : 1 + 0.25 * Math.sin(Math.PI * p) * (1 - p);
      if (s <= 0) continue;
      ctx.save();
      const cx = sr.x + sr.w / 2 + (i - 2) * 47, cy = y + 37;
      ctx.translate(cx, cy);
      ctx.scale(s, s);
      star(ctx, 0, 0, 14, rated && i < rated[key] ? "blue" : "starOff");
      ctx.restore();
    }
    // Only the 5-star label is known from the screenshots ("Excellent"); other ratings draw no label.
    if (rated && rated[key] === 5) txt(ctx, "Excellent", sr.x + sr.w / 2, y + 74, { size: 11.5, weight: 500, fill: "grey" });
    y += 118;
  }
  y += 4;
  txt(ctx, "What should the review mention?", L, y, { size: 16, weight: 600, fill: "ink", align: "left" });
  y += 22;
  for (const line of wrap(ctx, "Pick only what you want mentioned. Nothing is ticked for you.", CW, 11.5)) {
    txt(ctx, line, L, y, { size: 11.5, weight: 500, fill: "grey", align: "left" });
    y += 16;
  }
  y = chipFlow(ctx, sr, MENTION.map(([l]) => [l, !!ticked[l]]), y + 6);
  y += 34;
  txt(ctx, "What did you have?", L, y, { size: 16, weight: 600, fill: "ink", align: "left" });
  chipFlow(ctx, sr, HAD.map(([l]) => [l, !!ticked[l]]), y + 14);
  ctx.restore();
  bottomButton(ctx, sr, "Continue", press);
}

/** Card geometry of screen 2 (ui/demo-2), in screen units. Both cards are the same size. */
export const CHOICES = [
  { title: "Straight to the owner", sub: "Only Meera's Tiffin Room reads it. Not posted anywhere." },
  { title: "On Google", sub: "Anyone looking up Meera's Tiffin Room sees it." },
];
export function chooseLayout(sr) {
  const top = sr.y + 236;
  return { head: top, cards: [0, 1].map((i) => ({ x: sr.x + X0, y: top + 74 + i * 92, w: CW, h: 82, r: 11 })), link: top + 74 + 2 * 92 + 34 };
}

/** One choice card (screen-2 style) at rect r; `big` scales the type for the Beat 10 split. alpha for text only. */
export function choiceCard(ctx, r, i, { big = 1, textAlpha = 1, stroke = "edge", strokeW = 1 } = {}) {
  rrect(ctx, r.x, r.y, r.w, r.h, r.r);
  ctx.fillStyle = col("white");
  ctx.fill();
  ctx.strokeStyle = col(stroke);
  ctx.lineWidth = strokeW;
  ctx.stroke();
  if (textAlpha <= 0) return;
  const pad = 15 * big, ts = 14.5 * big, ss = 11 * big;
  const lines = wrap(ctx, CHOICES[i].sub, r.w - 2 * pad, ss);
  const blockH = ts + 8 * big + lines.length * ss * 1.45;
  let y = r.y + (r.h - blockH) / 2 + ts * 0.8;
  txt(ctx, CHOICES[i].title, r.x + pad, y, { size: ts, weight: 600, fill: "ink", align: "left", alpha: textAlpha });
  y += 8 * big + ss * 1.25;
  for (const l of lines) {
    txt(ctx, l, r.x + pad, y, { size: ss, weight: 500, fill: "grey", align: "left", alpha: textAlpha });
    y += ss * 1.45;
  }
}

/** Screen 2 (ui/demo-2): "Where should your words go?" — the customer's free choice (F7). */
export function choosePage(ctx, sr, { cardsAlpha = 1, textAlpha = 1 } = {}) {
  ctx.fillStyle = col("paper");
  ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
  dots(ctx, sr, 1);
  const Ly = chooseLayout(sr), L = sr.x + X0;
  let y = Ly.head;
  for (const l of wrap(ctx, "Where should your words go?", CW, 21, 700)) {
    txt(ctx, l, L, y, { size: 21, weight: 700, fill: "ink", align: "left", alpha: textAlpha });
    y += 26;
  }
  txt(ctx, "You can do both, if you like.", L, y + 2, { size: 12, weight: 500, fill: "grey", align: "left", alpha: textAlpha });
  if (cardsAlpha > 0) {
    ctx.save();
    ctx.globalAlpha *= cardsAlpha;
    Ly.cards.forEach((r, i) => choiceCard(ctx, r, i));
    ctx.restore();
  }
  txt(ctx, "No, I'm done", sr.x + sr.w / 2, Ly.link, { size: 12, weight: 500, fill: "grey", alpha: textAlpha });
  const w = textWidth(ctx, "No, I'm done", 12, 500);
  ctx.save();
  ctx.globalAlpha *= textAlpha;
  ctx.fillStyle = col("grey");
  ctx.fillRect(sr.x + sr.w / 2 - w / 2, Ly.link + 3, w, 1);
  // footer link, as on the product page
  const pw = textWidth(ctx, "Privacy", 11, 500);
  ctx.fillRect(sr.x + sr.w / 2 - pw / 2, sr.y + sr.h - 26 + 3, pw, 1);
  ctx.restore();
  txt(ctx, "Privacy", sr.x + sr.w / 2, sr.y + sr.h - 26, { size: 11, weight: 500, fill: "grey", alpha: textAlpha });
}

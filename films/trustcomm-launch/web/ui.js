// Vector UI parts for the Trustcomm film: film graphics built from the QR square's geometry (rounded squares, pills,
// circles) and the real /r/demo screens rebuilt from ui/demo-*.jpg. Nothing here copies Google's UI, logo, font or colours.
import { rrect } from "../../godevlevel-launch/engine/web/core/carry.js";
import { clamp } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col, FONT, rgba, UIFONT } from "./brand.js";

export { rrect };

/** Every string drawn on screen is recorded here so the checker can audit it against the fact ledger. */
export const DRAWN = new Set();

/** Text. font: "film" = Poppins (titles, big type) · "ui" = Inter + Noto (inside the phone screens). */
export function txt(ctx, s, x, y, { size, weight = 600, fill = "ink", align = "center", alpha = 1, baseline = "alphabetic", font = "film" }) {
  DRAWN.add(s);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${font === "ui" ? UIFONT : FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = col(fill);
  ctx.fillText(s, x, y);
  ctx.restore();
}

export function textWidth(ctx, s, size, weight = 600, font = "film") {
  ctx.save();
  ctx.font = `${weight} ${size}px ${font === "ui" ? UIFONT : FONT}`;
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
export function wrap(ctx, s, maxW, size, weight = 500, font = "film") {
  const words = s.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (cur && textWidth(ctx, t, size, weight, font) > maxW) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------------------------------------------------------
// The real /r/demo screens (ui/demo-*.jpg), rebuilt in vector inside the phone's screen (332 × 712 units).
// Type: Inter (OFL, closest match to the product's system sans) at the product's own CSS sizes, measured from the
// screenshots by fitting Inter widths to the rendered text (scale 1.256 px per CSS px): page title 32, headings 20,
// chips 18, body 16 — semibold headings, regular body. The product column is 480 CSS px; it maps to the phone's
// 300-unit content width (CSS → units ×0.625), so layout and wraps follow the screenshots: three chips per row.
// PENDING the user's phone screenshots (not received): mobile wrap points and the unrated-star colour.
// ---------------------------------------------------------------------------------------------------------------
export const CSS = 0.625; // units per CSS px
const X0 = 16, CW = 300; // content left edge and width in the screen
const SZ = { title: 32 * CSS, h3: 20 * CSS, chip: 18 * CSS, body: 16 * CSS, btn: 18 * CSS };
const ui = (o) => ({ font: "ui", ...o });

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
export function star(ctx, cx, cy, r, fill) {
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

/** Chips wrapped to the content width. Returns { bottom, rects } (rects keyed by label). */
export function chipFlow(ctx, sr, items, y, { alpha = 1, press = {} } = {}) {
  const h = 35, gap = 7.5, pad = 13.2;
  let x = sr.x + X0;
  const rects = {};
  for (const [label, on] of items) {
    const text = on ? "✓ " + label : label;
    const w = textWidth(ctx, text, SZ.chip, 400, "ui") + 2 * pad;
    if (x + w > sr.x + X0 + CW + 0.5) { x = sr.x + X0; y += h + gap; }
    const pr = press[label] ?? 0;
    ctx.save();
    ctx.globalAlpha *= alpha;
    const cx = x + w / 2, cy = y + h / 2, sc = 1 - 0.06 * pr;
    ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
    rrect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = col(on ? "blue" : "paper");
    ctx.fill();
    if (!on) { ctx.strokeStyle = col("edge"); ctx.lineWidth = 1; ctx.stroke(); }
    txt(ctx, text, cx, cy + SZ.chip * 0.36, ui({ size: SZ.chip, weight: 400, fill: on ? "white" : "ink" }));
    ctx.restore();
    rects[label] = { x, y, w, h };
    x += w + gap;
  }
  return { bottom: y + h, rects };
}

/** Bottom bar with the blue full-width button ("Continue", "Send to owner" …). press 0–1 darkens it. */
export function bottomButton(ctx, sr, label, press = 0) {
  const top = sr.y + sr.h - 66;
  ctx.fillStyle = "#FAFBF6";
  ctx.fillRect(sr.x, top, sr.w, 66);
  ctx.fillStyle = col("line");
  ctx.fillRect(sr.x, top, sr.w, 1);
  rrect(ctx, sr.x + X0, top + 12, CW, 41, 8);
  ctx.fillStyle = col("blue");
  ctx.fill();
  if (press > 0) { ctx.fillStyle = `rgba(0,0,0,${0.18 * press})`; ctx.fill(); }
  txt(ctx, label, sr.x + sr.w / 2, top + 12 + 20.5 + SZ.btn * 0.36, ui({ size: SZ.btn, weight: 600, fill: "white" }));
}

export const MENTION = ["The food", "How long it took", "The price", "How clean it was", "The staff", "The portions"];
export const HAD = ["Masala Dosa", "Filter Coffee", "Idli Vada"];
// As in ui/demo-1: the customer ticked two things; nothing was pre-ticked (F6).
export const TICKED = { "How long it took": true, "Filter Coffee": true };

/** Layout of screen 1 (y positions in screen units from the screen top, before scrolling). */
export const PAGE1 = { q1: 72, q2: 190, mention: 314, had: 0 };

/**
 * Screen 1 (ui/demo-1): rate (food, service) + "What should the review mention?" + "What did you have?".
 * pop: 0–1 stagger of the stars appearing; rated: { food: n, service: n } (n = 0 unrated); ticked: chip map;
 * scroll: units the page is scrolled up; press: Continue 0–1; question: replaces "How was the food?" (Beat 8 flips);
 * starPress: { food: i, service: i } index of a star being pressed (scale dip); chipPress: { label: 0–1 }.
 * Returns the chip rects (screen coords, unscrolled) for taps.
 */
export function ratingPage(ctx, sr, { pop = 1, rated = { food: 0, service: 0 }, ticked = {}, scroll = 0, press = 0, question = null, chipPress = {} } = {}) {
  ctx.fillStyle = col("paper");
  ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
  ctx.save();
  ctx.translate(0, -scroll);
  dots(ctx, sr, 0);
  const L = sr.x + X0;
  let y = sr.y + PAGE1.q1;
  for (const [q, key] of [[question ?? "How was the food?", "food"], ["How was the service?", "service"]]) {
    txt(ctx, q, L, y, ui({ size: SZ.h3, weight: 600, fill: "ink", align: "left" }));
    for (let i = 0; i < 5; i++) {
      const p = clamp(pop * 5 - i * 0.8);
      const s = p <= 0 ? 0 : 1 + 0.25 * Math.sin(Math.PI * p) * (1 - p);
      if (s <= 0) continue;
      ctx.save();
      const cx = sr.x + sr.w / 2 + (i - 2) * 47, cy = y + 37;
      ctx.translate(cx, cy);
      ctx.scale(s, s);
      star(ctx, 0, 0, 14, i < (rated[key] ?? 0) ? "blue" : "starOff");
      ctx.restore();
    }
    // Only the 5-star label is known from the screenshots ("Excellent"); other ratings draw no label.
    if (rated[key] === 5) txt(ctx, "Excellent", sr.x + sr.w / 2, y + 74, ui({ size: SZ.body, weight: 400, fill: "grey" }));
    y += 118;
  }
  y += 4;
  txt(ctx, "What should the review mention?", L, y, ui({ size: SZ.h3, weight: 600, fill: "ink", align: "left" }));
  y += 24;
  for (const line of wrap(ctx, "Pick only what you want mentioned. Nothing is ticked for you.", CW, SZ.body, 400, "ui")) {
    txt(ctx, line, L, y, ui({ size: SZ.body, weight: 400, fill: "grey", align: "left" }));
    y += 15;
  }
  const m = chipFlow(ctx, sr, MENTION.map((l) => [l, !!ticked[l]]), y + 4, { press: chipPress });
  y = m.bottom + 42;
  txt(ctx, "What did you have?", L, y, ui({ size: SZ.h3, weight: 600, fill: "ink", align: "left" }));
  const h = chipFlow(ctx, sr, HAD.map((l) => [l, !!ticked[l]]), y + 14, { press: chipPress });
  ctx.restore();
  bottomButton(ctx, sr, "Continue", press);
  const rects = { ...m.rects, ...h.rects };
  for (const r of Object.values(rects)) r.y -= scroll;
  return rects;
}

/** Card geometry of screen 2 (ui/demo-2), in screen units. Both cards are the same size. */
export const CHOICES = [
  { title: "Straight to the owner", sub: "Only Meera's Tiffin Room reads it. Not posted anywhere." },
  { title: "On Google", sub: "Anyone looking up Meera's Tiffin Room sees it." },
];
export function chooseLayout(sr) {
  const top = sr.y + 244;
  return { head: top, cards: [0, 1].map((i) => ({ x: sr.x + X0, y: top + 58 + i * 78, w: CW, h: 68, r: 11 })), link: top + 58 + 2 * 78 + 30 };
}

/** One choice card (screen-2 style) at rect r; `big` scales the type (the Beat 10 split). alpha for text only. */
export function choiceCard(ctx, r, i, { big = 1, textAlpha = 1, stroke = "edge", strokeW = 1 } = {}) {
  rrect(ctx, r.x, r.y, r.w, r.h, r.r);
  ctx.fillStyle = col("white");
  ctx.fill();
  ctx.strokeStyle = col(stroke);
  ctx.lineWidth = strokeW;
  ctx.stroke();
  if (textAlpha <= 0) return;
  const pad = 15.5 * big, ts = SZ.h3 * big, ss = SZ.body * big;
  const lines = wrap(ctx, CHOICES[i].sub, r.w - 2 * pad, ss, 400, "ui");
  const blockH = ts + 7 * big + lines.length * ss * 1.45;
  let y = r.y + (r.h - blockH) / 2 + ts * 0.8;
  txt(ctx, CHOICES[i].title, r.x + pad, y, ui({ size: ts, weight: 600, fill: "ink", align: "left", alpha: textAlpha }));
  y += 7 * big + ss * 1.25;
  for (const l of lines) {
    txt(ctx, l, r.x + pad, y, ui({ size: ss, weight: 400, fill: "grey", align: "left", alpha: textAlpha }));
    y += ss * 1.45;
  }
}

/** Screen 2 (ui/demo-2): "Where should your words go?" — the customer's free choice (F7). */
export function choosePage(ctx, sr, { cardsAlpha = 1, textAlpha = 1, pick = null, pickPress = 0 } = {}) {
  ctx.fillStyle = col("paper");
  ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
  dots(ctx, sr, 1);
  const Ly = chooseLayout(sr), L = sr.x + X0;
  let y = Ly.head;
  for (const l of wrap(ctx, "Where should your words go?", CW, SZ.title, 600, "ui")) {
    txt(ctx, l, L, y, ui({ size: SZ.title, weight: 600, fill: "ink", align: "left", alpha: textAlpha }));
    y += SZ.title * 1.2;
  }
  txt(ctx, "You can do both, if you like.", L, y + 2, ui({ size: SZ.body, weight: 400, fill: "grey", align: "left", alpha: textAlpha }));
  if (cardsAlpha > 0) {
    ctx.save();
    ctx.globalAlpha *= cardsAlpha;
    Ly.cards.forEach((r, i) => choiceCard(ctx, r, i, { stroke: pick === i ? "blue" : "edge", strokeW: pick === i ? 1 + pickPress : 1 }));
    ctx.restore();
  }
  txt(ctx, "No, I'm done", sr.x + sr.w / 2, Ly.link, ui({ size: SZ.body, weight: 400, fill: "grey", alpha: textAlpha }));
  const w = textWidth(ctx, "No, I'm done", SZ.body, 400, "ui");
  const pw = textWidth(ctx, "Privacy", SZ.body, 400, "ui");
  ctx.save();
  ctx.globalAlpha *= textAlpha;
  ctx.fillStyle = col("grey");
  ctx.fillRect(sr.x + sr.w / 2 - w / 2, Ly.link + 3, w, 1);
  ctx.fillRect(sr.x + sr.w / 2 - pw / 2, sr.y + sr.h - 26 + 3, pw, 1);
  ctx.restore();
  txt(ctx, "Privacy", sr.x + sr.w / 2, sr.y + sr.h - 26, ui({ size: SZ.body, weight: 400, fill: "grey", alpha: textAlpha }));
}

/** Screen 4 (ui/demo-4): "Here's a draft" — built from what they tapped; they edit it; it goes out in their name (F7). */
export const DRAFT = "Filter coffee at Meera's Tiffin Room was absolutely wonderful and served steaming hot. The food tasted brilliant, and the staff brought everything to the table amazingly fast. Wonderful service made the whole meal even better.";
export function draftPage(ctx, sr, { text = DRAFT, caret = -1, press = 0 } = {}) {
  ctx.fillStyle = col("paper");
  ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
  dots(ctx, sr, 2);
  const L = sr.x + X0;
  txt(ctx, "Here's a draft", L, sr.y + 78, ui({ size: SZ.title * 0.82, weight: 600, fill: "ink", align: "left" }));
  const box = { x: L, y: sr.y + 96, w: CW, h: 132 };
  rrect(ctx, box.x, box.y, box.w, box.h, 11);
  ctx.fillStyle = col("white"); ctx.fill();
  ctx.strokeStyle = col("edge"); ctx.lineWidth = 1; ctx.stroke();
  let y = box.y + 22;
  const lines = wrap(ctx, text, box.w - 26, SZ.body, 400, "ui");
  lines.forEach((l, i) => {
    txt(ctx, l, box.x + 13, y, ui({ size: SZ.body, weight: 400, fill: "ink", align: "left" }));
    if (caret >= 0 && i === lines.length - 1 && caret % 2 === 0) { ctx.fillStyle = col("ink"); ctx.fillRect(box.x + 13 + textWidth(ctx, l, SZ.body, 400, "ui") + 1, y - 9, 1, 11); }
    y += 17.5;
  });
  y = box.y + box.h + 18;
  for (const l of wrap(ctx, "Change anything that doesn't sound like you. It goes out in your name.", CW, SZ.body, 400, "ui")) {
    txt(ctx, l, L, y, ui({ size: SZ.body, weight: 400, fill: "grey", align: "left" }));
    y += 15;
  }
  rrect(ctx, L, y + 6, 88, 34, 9);
  ctx.fillStyle = col("paper"); ctx.fill();
  ctx.strokeStyle = col("edge"); ctx.stroke();
  txt(ctx, "Try another", L + 44, y + 6 + 17 + 4, ui({ size: SZ.body, weight: 600, fill: "ink" }));
  txt(ctx, "Took a photo? Add it on Google — photos say a lot.", L, y + 70, ui({ size: SZ.body * 0.92, weight: 400, fill: "grey", align: "left" }));
  bottomButton(ctx, sr, "Copy my words", press);
}

/** Screen 3 (ui/demo-3): the private message to the owner. typed: the text in the box. */
export function messagePage(ctx, sr, { typed = "", caret = -1, press = 0 } = {}) {
  ctx.fillStyle = col("paper");
  ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
  dots(ctx, sr, 2);
  const L = sr.x + X0;
  const head = { x: L, y: sr.y + 42, w: CW, h: 96 };
  rrect(ctx, head.x, head.y, head.w, head.h, 13);
  ctx.fillStyle = col("tint"); ctx.fill();
  let y = head.y + 30;
  for (const l of wrap(ctx, "Your message to Meera's Tiffin Room", CW - 30, SZ.title * 0.62, 600, "ui")) {
    txt(ctx, l, L + 15, y, ui({ size: SZ.title * 0.62, weight: 600, fill: "ink", align: "left" }));
    y += 23;
  }
  for (const l of wrap(ctx, "The owner reads this personally. It isn't posted publicly.", CW - 30, SZ.body * 0.92, 400, "ui")) {
    txt(ctx, l, L + 15, y + 2, ui({ size: SZ.body * 0.92, weight: 400, fill: "ink", align: "left" }));
    y += 14;
  }
  const box = { x: L - 2, y: head.y + head.h + 16, w: CW + 4, h: 122 };
  rrect(ctx, box.x, box.y, box.w, box.h, 11);
  ctx.fillStyle = col("white"); ctx.fill();
  ctx.strokeStyle = col("blue"); ctx.lineWidth = 1.5; ctx.stroke();
  let ty = box.y + 24;
  const lines = typed ? wrap(ctx, typed, box.w - 26, SZ.body, 400, "ui") : [""];
  lines.forEach((l, i) => {
    if (l) txt(ctx, l, box.x + 14, ty, ui({ size: SZ.body, weight: 400, fill: "ink", align: "left" }));
    if (caret >= 0 && i === lines.length - 1 && caret % 2 === 0) { ctx.fillStyle = col("ink"); ctx.fillRect(box.x + 14 + (l ? textWidth(ctx, l, SZ.body, 400, "ui") : 0) + 1, ty - 9, 1, 11); }
    ty += 17.5;
  });
  bottomButton(ctx, sr, "Send to owner", press);
}

// Shared film graphics and the boundary carries for the Trustcomm hero film (Stage 4 animatic, draft quality).
// Everything is built from the QR square's geometry: rounded squares, pills, circles (BRIEF §3).
import { clamp, lerp } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col, rgba } from "./brand.js";
import { qr, rrect, screenRect, star, txt } from "./ui.js";

export const B = 60 / 124; // one beat at 124 BPM (s)
export const F = 1 / 30;
export const q = (s) => Math.round(s * 30) / 30; // event times sit on frames, so picture and sound share a frame

// ---- phones (centre and scale) used across the UI beats ----
export const P_BIG = { x: 960, y: 540, s: 1.16 * 1.18 }; // Beat 6 ends pushed in to this; Beats 7–8 hold it
export const P_STD = { x: 960, y: 540, s: 1.16 }; // Beat 9 settles to this; Beat 10 opens on it

// ---- the counter stand (Beats 5–6) ----
export const STAND = { w: 460, h: 630, head: 132, y: 560 };
export const QS = 320;
export const qrRect = (sx) => ({ x: sx - QS / 2, y: STAND.y - STAND.h / 2 + STAND.head + 52, w: QS, h: QS });
/** The counter stand-up printed with the fictional shop's name and colours (F3). print: 0–1 reveal from the bottom. */
export function stand(ctx, sx, { print = 1, qrAlpha = 1 } = {}) {
  const x = sx - STAND.w / 2, y = STAND.y - STAND.h / 2;
  ctx.save();
  if (print < 1) {
    ctx.beginPath();
    ctx.rect(x - 40, y + STAND.h * (1 - print) - 10, STAND.w + 80, STAND.h * print + 60);
    ctx.clip();
  }
  ctx.fillStyle = rgba("ink", 0.1);
  rrect(ctx, x + 12, y + 20, STAND.w, STAND.h, 36);
  ctx.fill();
  ctx.fillStyle = col("white");
  rrect(ctx, x, y, STAND.w, STAND.h, 36);
  ctx.fill();
  ctx.save();
  rrect(ctx, x, y, STAND.w, STAND.h, 36);
  ctx.clip();
  ctx.fillStyle = col("shop");
  ctx.fillRect(x, y, STAND.w, STAND.head);
  ctx.restore();
  txt(ctx, "Meera's Tiffin Room", sx, y + 82, { size: 36, weight: 700, fill: "ink" });
  ctx.fillStyle = col("sand");
  rrect(ctx, sx - STAND.w * 0.42, y + STAND.h - 6, STAND.w * 0.84, 34, 17);
  ctx.fill();
  ctx.restore();
  const r = qrRect(sx);
  if (qrAlpha > 0) qr(ctx, r.x, r.y, QS, { alpha: qrAlpha });
}

// ---- customers: rounded shapes with a face (Beats 1, 2, 14) ----
/** mood: 1 smile, -1 shout (open mouth). */
export function blob(ctx, x, y, r, fill, { mood = 1, alpha = 1, squash = 0 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(1 + squash, 1 - squash);
  ctx.fillStyle = col(fill);
  rrect(ctx, -r, -r * 1.15, 2 * r, 2.3 * r, r * 0.9);
  ctx.fill();
  ctx.fillStyle = col("ink");
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(sx * r * 0.32, -r * 0.35, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = col("ink");
  ctx.lineWidth = r * 0.08;
  ctx.lineCap = "round";
  if (mood > 0) {
    ctx.beginPath();
    ctx.arc(0, -r * 0.05, r * 0.3, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.ellipse(0, r * 0.1, r * 0.22, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The loud one's sound-wave spikes: vertical bars beside (x, y). amp 0–1. Returns the tallest bar's rect. */
export const SPIKE = { x: 1236, y: 250, w: 36, h: 330 }; // the tallest bar at full shout (Beat 1 → 2 carry)
export function spikes(ctx, x, y, amp, { alpha = 1 } = {}) {
  const hs = [0.35, 0.6, 1, 0.7, 0.45];
  let tallest = null;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = col("red");
  hs.forEach((h, i) => {
    const bh = Math.max(8, h * amp * SPIKE.h), bx = x + i * 52;
    rrect(ctx, bx, y - bh / 2, SPIKE.w, bh, SPIKE.w / 2);
    ctx.fill();
    if (h === 1) tallest = { x: bx, y: y - bh / 2, w: SPIKE.w, h: bh };
  });
  ctx.restore();
  return tallest;
}

// ---- the shop interior (Beats 1–2) ----
export const DOOR = { x: 1440, y: 300, w: 230, h: 470 }; // the doorway rectangle (Beat 2 → 3 carry)
export function shopRoom(ctx, { doorSwing = 0, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = col("sand");
  ctx.fillRect(-200, 770, 2400, 600); // floor
  // counter with the till
  ctx.fillStyle = col("shop");
  rrect(ctx, 180, 560, 560, 230, 28);
  ctx.fill();
  ctx.fillStyle = col("white");
  rrect(ctx, 520, 470, 150, 100, 18);
  ctx.fill();
  ctx.fillStyle = col("ink");
  rrect(ctx, 545, 492, 100, 34, 8);
  ctx.fill();
  // doorway and door
  ctx.fillStyle = col("white");
  rrect(ctx, DOOR.x, DOOR.y, DOOR.w, DOOR.h, 22);
  ctx.fill();
  ctx.strokeStyle = col("ink");
  ctx.lineWidth = 10;
  rrect(ctx, DOOR.x, DOOR.y, DOOR.w, DOOR.h, 22);
  ctx.stroke();
  const open = clamp(doorSwing);
  if (open < 0.98) {
    ctx.fillStyle = col("blue");
    const w = DOOR.w * (1 - open);
    rrect(ctx, DOOR.x + 8, DOOR.y + 8, Math.max(6, w - 16), DOOR.h - 16, 16);
    ctx.fill();
  }
  ctx.restore();
}

// ---- review / note cards (Beats 3, 11–13) ----
/** A generic review card (no Google UI, logo or colours). stars: n filled of 5; lines: placeholder grey lines;
 *  text: optional real copy (the product's own demo draft). avatar: colour of the reviewer's round avatar. */
export function reviewCard(ctx, r, { stars = 5, starFill = "ink", lines = 3, text = null, avatar = "green", alpha = 1, scale = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = rgba("ink", 0.08);
  rrect(ctx, r.x + 6, r.y + 10, r.w, r.h, 22 * scale);
  ctx.fill();
  ctx.fillStyle = col("white");
  rrect(ctx, r.x, r.y, r.w, r.h, 22 * scale);
  ctx.fill();
  ctx.strokeStyle = col("edge");
  ctx.lineWidth = 2;
  ctx.stroke();
  const p = 26 * scale;
  ctx.fillStyle = col(avatar);
  ctx.beginPath();
  ctx.arc(r.x + p + 22 * scale, r.y + p + 22 * scale, 22 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = col("line");
  rrect(ctx, r.x + p + 58 * scale, r.y + p + 8 * scale, 140 * scale, 14 * scale, 7 * scale); // name placeholder
  ctx.fill();
  for (let i = 0; i < 5; i++) star(ctx, r.x + p + 66 * scale + i * 28 * scale, r.y + p + 40 * scale, 10 * scale, i < stars ? starFill : "starOff");
  let y = r.y + p + 84 * scale;
  if (text) {
    for (const l of text) {
      txt(ctx, l, r.x + p, y, { size: 20 * scale, weight: 400, fill: "ink", align: "left", font: "ui" });
      y += 28 * scale;
    }
  } else {
    for (let i = 0; i < lines; i++) {
      ctx.fillStyle = col("line");
      rrect(ctx, r.x + p, y - 12 * scale, (r.w - 2 * p) * (i === lines - 1 ? 0.6 : 1), 14 * scale, 7 * scale);
      ctx.fill();
      y += 28 * scale;
    }
  }
  ctx.restore();
}

/** The private note (Beat 12–13): the site's own example sentence on a tinted card. */
export const NOTE = "The table by the door gets cold in the evening";
export function noteCard(ctx, r, { alpha = 1, scale = 1, fold = 0 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  const cx = r.x + r.w / 2;
  ctx.translate(cx, r.y);
  ctx.scale(1 - 0.6 * fold, 1 - 0.3 * fold);
  ctx.translate(-cx, -r.y);
  ctx.fillStyle = rgba("ink", 0.08);
  rrect(ctx, r.x + 6, r.y + 10, r.w, r.h, 18 * scale);
  ctx.fill();
  ctx.fillStyle = col("tint");
  rrect(ctx, r.x, r.y, r.w, r.h, 18 * scale);
  ctx.fill();
  txt(ctx, "The table by the door gets", r.x + 24 * scale, r.y + 44 * scale, { size: 22 * scale, weight: 500, fill: "ink", align: "left", font: "ui" });
  txt(ctx, "cold in the evening", r.x + 24 * scale, r.y + 74 * scale, { size: 22 * scale, weight: 500, fill: "ink", align: "left", font: "ui" });
  ctx.restore();
}

/** A finger touch: a soft ink ring that shrinks onto the point, then a ripple. lt relative to the tap. */
export function touch(ctx, x, y, dt) {
  if (dt < -0.12 || dt > 0.35) return;
  ctx.save();
  if (dt < 0) {
    const k = 1 + dt / 0.12;
    ctx.fillStyle = rgba("ink", 0.18 * k);
    ctx.beginPath();
    ctx.arc(x, y, 34 - 12 * k, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const k = dt / 0.35;
    ctx.strokeStyle = rgba("blue", 0.5 * (1 - k));
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 22 + 40 * k, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = rgba("ink", 0.18 * (1 - k));
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Language chip (Beats 7–8): a pill above the phone. */
export function langChip(ctx, label, x, y, fill, { s = 1, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.font = `600 34px "Poppins", "Noto Sans Devanagari", "Noto Sans Kannada", "Noto Sans Tamil", "Noto Sans Telugu"`;
  const w = ctx.measureText(label).width + 64;
  ctx.fillStyle = col(fill);
  rrect(ctx, -w / 2, -34, w, 68, 34);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  txt(ctx, label, 0, 12, { size: 34, weight: 600, fill: "white" });
  ctx.restore();
}

// ---- the shops of Beat 14 (illustrated fallback for the optional Canva clips, BRIEF §7) ----
export const SHOPS = ["Tiffin room", "Salon", "Mobile shop", "Café", "Clinic", "Sweet shop"];
export function shopIcon(ctx, kind, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.strokeStyle = col("ink");
  ctx.fillStyle = col("ink");
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (kind === 0) { // plate with a dosa
    ctx.beginPath(); ctx.ellipse(0, 18, 70, 22, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = col("shop"); ctx.beginPath(); ctx.moveTo(-50, 12); ctx.lineTo(55, -2); ctx.lineTo(50, 22); ctx.closePath(); ctx.fill();
  } else if (kind === 1) { // scissors
    for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.arc(-38, s2 * 22, 16, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-24, s2 * 14); ctx.lineTo(54, -s2 * 26); ctx.stroke(); }
  } else if (kind === 2) { // a phone
    rrect(ctx, -26, -48, 52, 96, 12); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 34, 5, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 3) { // a cup
    rrect(ctx, -40, -20, 70, 60, 14); ctx.stroke(); ctx.beginPath(); ctx.arc(36, 8, 14, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    for (const x of [-20, 0]) { ctx.beginPath(); ctx.moveTo(x, -34); ctx.quadraticCurveTo(x + 8, -46, x, -58); ctx.stroke(); }
  } else if (kind === 4) { // a cross
    ctx.fillStyle = col("red"); rrect(ctx, -14, -46, 28, 92, 8); ctx.fill(); rrect(ctx, -46, -14, 92, 28, 8); ctx.fill();
  } else { // laddoos
    ctx.fillStyle = col("shop");
    for (const [x, y] of [[-32, 16], [0, 16], [32, 16], [-16, -14], [16, -14], [0, -42]]) { ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}

/** One shop square: a rounded square with the shop's icon, its name and two quiet customers who now have a voice. */
export function shopSquare(ctx, r, i, { alpha = 1, voice = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = col("white");
  rrect(ctx, r.x, r.y, r.w, r.h, r.w * 0.12);
  ctx.fill();
  ctx.strokeStyle = col("blue");
  ctx.lineWidth = 4;
  ctx.stroke();
  const s = r.w / 300;
  shopIcon(ctx, i, r.x + r.w / 2, r.y + r.h * 0.34, s);
  txt(ctx, SHOPS[i], r.x + r.w / 2, r.y + r.h * 0.62, { size: 30 * s, weight: 600, fill: "ink" });
  blob(ctx, r.x + r.w * 0.3, r.y + r.h * 0.84, 22 * s, "green");
  blob(ctx, r.x + r.w * 0.52, r.y + r.h * 0.84, 22 * s, "green");
  if (voice > 0) { // speech bubble: the quiet ones have voices now
    const bx = r.x + r.w * 0.66, by = r.y + r.h * 0.76;
    ctx.globalAlpha *= clamp(voice);
    ctx.fillStyle = col("blue");
    rrect(ctx, bx, by - 22 * s, 70 * s, 40 * s, 20 * s);
    ctx.fill();
    ctx.fillStyle = col("white");
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(bx + (20 + k * 15) * s, by - 2 * s, 4.5 * s, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}

/** Gentle breathing drift for holds (draft animatic): a slow push of `amp` about (cx, cy) that is exactly zero at the
 *  beat's first and last frame, so the boundary carries still match. Call at the start of render(). */
export function breathe(ctx, lt, dur, amp = 0.02, cx = 960, cy = 540) {
  const z = 1 + amp * Math.sin(Math.PI * clamp(lt / dur)) ** 2;
  ctx.translate(cx, cy);
  ctx.scale(z, z);
  ctx.translate(-cx, -cy);
}

/** Linear interpolation of two rects. */
export const lerpRect = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t), r: lerp(a.r ?? 0, b.r ?? 0, t) });

// ---- the boundary carries (BRIEF §4 "carries out as"), shared so both sides use the same numbers ----
const sq = (cx, cy, s, colour) => ({ x: cx - s / 2, y: cy - s / 2, w: s, h: s, r: s * 0.18, colour });
export const CARRY = {
  b01_02: { kind: "spike", ...SPIKE, y: 415 - SPIKE.h / 2, colour: "red" }, // the red sound-wave spike
  b02_03: { kind: "doorway", ...DOOR, colour: "ink" }, // the empty doorway
  b03_04: { kind: "pixel", ...sq(960, 300, 28, "blue") }, // one square pixel lifts off the screen
  b04_05: { kind: "square", ...sq(960, 540, 120, "blue") }, // the logo's square
  // b05_06 / b06_07 / b09_10 / b10_11 are declared by Beats 5, 6, 9 and 10 themselves
  b07_08: { kind: "screen", ...screenRect(P_BIG.x, P_BIG.y, P_BIG.s), colour: "paper" }, // the phone screen (+ language chip)
  b08_09: { kind: "screen", ...screenRect(P_BIG.x, P_BIG.y, P_BIG.s), colour: "paper" }, // the chips row on the screen
  b11_12: { kind: "card", x: 1130, y: 330, w: 620, h: 340, r: 22, colour: "white" }, // the posted review card
  b12_13: { kind: "screen", ...screenRect(1450, 540, 0.92), colour: "paper" }, // the owner's phone
  b13_14: { kind: "stack", x: 760, y: 300, w: 400, h: 480, colour: "white" }, // the stack of cards
  b14_15: { kind: "square", ...sq(960, 540, 300, "blue") }, // all squares converge
  b15_16: { kind: "square", ...sq(960, 540, 120, "blue") }, // the card collapses to one square
};

import { tokens as T } from "../tokens.js";

// The grid every scene reuses: the safe box, and its centre.
export const grid = { l: T.safe.x, r: T.W - T.safe.x, t: T.safe.y, b: T.H - T.safe.y, w: T.W - 2 * T.safe.x, h: T.H - 2 * T.safe.y, cx: T.W / 2, cy: T.H / 2 };

const FACE = { hero: ["700", T.font.display], h1: ["700", T.font.display], h2: ["700", T.font.display], label: ["500", T.font.mono] };

// The CSS font string for a type role at `px` (default: the role's token size).
export const fontFor = (role, px = T.size[role]) => `${FACE[role][0]} ${px}px ${FACE[role][1]}`;

// Font and tracking for a type role (tracking is in em, as in the tokens). Set both before measuring.
export function setType(ctx, role, px = T.size[role]) {
  ctx.font = fontFor(role, px);
  ctx.letterSpacing = `${(T.track[role] ?? 0) * px}px`;
  return px;
}

// The largest size, up to the role's token size, at which `text` fits in maxW (width is linear in size).
export function fitPx(ctx, role, text, maxW) {
  setType(ctx, role);
  return Math.floor(T.size[role] * Math.min(1, maxW / ctx.measureText(text).width));
}

// The small mono label in the top-left safe corner, e.g. "01 / INTRO".
export function drawLabel(ctx, text, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha; ctx.fillStyle = T.color.dim; ctx.textBaseline = "alphabetic";
  setType(ctx, "label");
  ctx.fillText(text, grid.l, grid.t + T.size.label * 0.75);
  ctx.restore();
}

// The drifting radial light behind every card. Pass time that continues across scenes (scene t + its start)
// so the light does not jump at a cut.
export function drawBackground(ctx, t) {
  const gx = T.W * (0.3 + 0.08 * Math.sin(t * 0.4)), gy = T.H * 0.35;
  const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, T.W * 0.8);
  g.addColorStop(0, T.color.glow); g.addColorStop(1, T.color.bg);
  ctx.fillStyle = g; ctx.fillRect(0, 0, T.W, T.H);
}

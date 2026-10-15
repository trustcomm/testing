import { tokens as T } from "../tokens.js";

// The grid every scene reuses: the safe box, and its centre.
export const grid = { l: T.safe.x, r: T.W - T.safe.x, t: T.safe.y, b: T.H - T.safe.y, w: T.W - 2 * T.safe.x, h: T.H - 2 * T.safe.y, cx: T.W / 2, cy: T.H / 2 };

const FACE = { hero: ["700", T.font.display], h1: ["700", T.font.display], h2: ["700", T.font.display], label: ["500", T.font.mono] };

// Font and tracking for a type role (tracking is in em, as in the tokens). Set both before measuring.
export function setType(ctx, role, px = T.size[role]) {
  ctx.font = `${FACE[role][0]} ${px}px ${FACE[role][1]}`;
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

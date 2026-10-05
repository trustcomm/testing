// Flat placeholder for footage/stills that are not on disk yet. Clearly labelled; never a fake photo.
import { alpha, mix } from "./brand.js";
import { FONT } from "./brand.js";

export function placeholder(ctx, x, y, w, h, label, { a = 1, zoom = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = mix("charcoal", "ink", 0.07);
  ctx.fillRect(x, y, w, h);
  const size = Math.max(14, Math.min(40, w * 0.09));
  ctx.font = `500 ${size}px ${FONT.mono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = alpha("ink", 0.55);
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.font = `500 ${size * 0.45}px ${FONT.mono}`;
  ctx.fillStyle = alpha("ink", 0.35);
  ctx.fillText("PLACEHOLDER", x + w / 2, y + h / 2 + size * 0.9);
  ctx.restore();
}

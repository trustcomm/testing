// Text helpers. Every text draw goes through here so the orange-size rule is enforced.
import { C, colour, ORANGE_TEXT_MIN_PX } from "./brand.js";

export const font = (family, weight, size) => `${weight} ${size}px ${family}`;

/** ctx is already in world space; `zoom` converts world px to screen px for the size rule. */
export function text(ctx, str, x, y, { family, weight = 800, size, fill = "ink", align = "left", zoom = 1, alpha = 1 }) {
  const c = colour(fill);
  if (c.toLowerCase() === C.orange.toLowerCase() && size * zoom < ORANGE_TEXT_MIN_PX - 1e-9)
    throw new Error(`orange text "${str}" at ${(size * zoom).toFixed(1)} px on screen (minimum ${ORANGE_TEXT_MIN_PX})`);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = font(family, weight, size);
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = c;
  ctx.fillText(str, x, y);
  ctx.restore();
}

/** x offsets of each word when the words are set as one line with single spaces. */
export function wordOffsets(ctx, words, family, weight, size) {
  ctx.save();
  ctx.font = font(family, weight, size);
  const x = words.map((_, i) => (i === 0 ? 0 : ctx.measureText(words.slice(0, i).join(" ") + " ").width));
  const width = ctx.measureText(words.join(" ")).width;
  ctx.restore();
  return { x, width };
}

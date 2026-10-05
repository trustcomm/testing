// The sample launch-film frame shared by Beats 6, 7 and 8, so its content stays continuous.
// SAMPLE CONTENT (illustrative, fictional unbranded phone; replace with a real client example later):
//   headline "New phone / in store." (from V1); Beat 7 changes the price BEFORE → AFTER; Beat 8 shows AFTER.
import { alpha, FONT, mix } from "../../core/brand.js";
import { rrect } from "../../core/carry.js";
import { lerp } from "../../core/ease.js";
import { placeholder } from "../../core/placeholder.js";
import { text } from "../../core/text.js";

export const SAMPLE = {
  headline: ["New phone", "in store."],
  headlineBefore: ["New product", "in store."], // Beat 6 swaps "product" → "phone" on "Your words."
  priceBefore: "₹21,999",
  priceAfter: "₹19,999",
};

const LAND = {
  img: { x: 0, y: 0, w: 0.56, h: 1 },
  head: { x: 0.61, y: 0.36, s: 0.085, by: "h" },
  price: { x: 0.61, y: 0.74, s: 0.13, by: "h" },
};
const PORT = {
  img: { x: 0, y: 0, w: 1, h: 0.56 },
  head: { x: 0.08, y: 0.7, s: 0.1, by: "w" },
  price: { x: 0.08, y: 0.9, s: 0.15, by: "w" },
};

/**
 * Draw the frame's content into rect r.
 * o.mix      0 = 16:9 layout, 1 = 9:16 layout (elements interpolate between the two)
 * o.alpha    overall opacity
 * o.bump     0–1 headline pop
 * o.swap     0–1 headline word swap (headlineBefore → headline), rolling up
 * o.price    price string to show
 * o.drop     0–1 product image (I1) dropping into its area (1 = in place); undefined = in place
 * o.neutral  0–1 how un-branded the frame still is (1 = ink-only before "Your colours.")
 * o.zoom     camera zoom (for the orange-text rule)
 */
export function adFrame(ctx, r, o = {}) {
  const k = o.mix ?? 0;
  const at = (key) => {
    const l = LAND[key], p = PORT[key];
    const unit = (u) => (u === "h" ? r.h : r.w);
    return { x: r.x + r.w * lerp(l.x, p.x, k), y: r.y + r.h * lerp(l.y, p.y, k), s: lerp(l.s * unit(l.by), p.s * unit(p.by), k) };
  };
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  rrect(ctx, r.x, r.y, r.w, r.h, 20);
  ctx.clip();
  ctx.fillStyle = mix("charcoal", "ink", 0.035);
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Product image area: I1 (PLACEHOLDER until canva/stills/I1.png is on disk).
  const im = { x: r.x + r.w * lerp(LAND.img.x, PORT.img.x, k), y: r.y + r.h * lerp(LAND.img.y, PORT.img.y, k), w: r.w * lerp(LAND.img.w, PORT.img.w, k), h: r.h * lerp(LAND.img.h, PORT.img.h, k) };
  ctx.save();
  ctx.beginPath();
  ctx.rect(im.x, im.y, im.w, im.h);
  ctx.clip();
  ctx.fillStyle = mix("charcoal", "ink", 0.02);
  ctx.fillRect(im.x, im.y, im.w, im.h);
  const drop = o.drop ?? 1;
  if (drop > 0) placeholder(ctx, im.x, im.y - (1 - drop) * im.h * 1.1, im.w, im.h, "I1 · still");
  ctx.restore();

  const inkA = 1 - 0.45 * (o.neutral ?? 0);
  const h = at("head");
  const sc = 1 + 0.06 * (o.bump ?? 0);
  const line = (str, y, a) => text(ctx, str, h.x, y, { family: FONT.display, size: h.s * sc, fill: "ink", zoom: o.zoom ?? 1, alpha: a * inkA });
  const sw = o.swap ?? 1;
  const y1 = h.y - h.s * 1.05;
  if (sw >= 1) line(SAMPLE.headline[0], y1, 1);
  else {
    // Word swap: old line rolls up and out, new one rolls up into place, clipped to the line box.
    ctx.save();
    ctx.beginPath();
    ctx.rect(h.x - 10, y1 - h.s * 1.0, r.w, h.s * 1.25);
    ctx.clip();
    line(SAMPLE.headlineBefore[0], y1 - sw * h.s * 1.1, 1 - sw);
    line(SAMPLE.headline[0], y1 + (1 - sw) * h.s * 1.1, sw);
    ctx.restore();
  }
  line(SAMPLE.headline[1], h.y, 1);
  const p = at("price");
  text(ctx, o.price ?? SAMPLE.priceAfter, p.x, p.y, { family: FONT.display, size: p.s, fill: "ink", zoom: o.zoom ?? 1, alpha: inkA });
  ctx.restore();
  return { price: p, head: h, img: im };
}

/** Where the price sits for rect r (16:9 layout), for Beat 7's close-up and sync flash. */
export function priceBox(r) {
  return { x: r.x + r.w * LAND.price.x, y: r.y + r.h * LAND.price.y, s: LAND.price.s * r.h };
}
export const inkDim = (a) => alpha("ink", a);

// Beat 8: "Wide for YouTube. Tall for Reels. Same film."
// The product frame splits in two. Copy A stays 16:9 ("YouTube" stamps); copy B morphs to 9:16
// and re-composes its layout ("Reels" stamps). On "Same film." A clears and B centres.
// In: product frame (Beat 7). Out: the 9:16 frame (exactly handoffOut).
// Frame content is SAMPLE UI: headline from V1, a sample price, I1 as PLACEHOLDER until the still lands.
import { alpha, FONT, mix } from "../core/brand.js";
import { corners, drawCarry, lerpCarry, rrect } from "../core/carry.js";
import { easeInOutCubic, easeOutCubic, lerp, prog, snap, spring } from "../core/ease.js";
import { placeholder } from "../core/placeholder.js";
import { text } from "../core/text.js";

const BOTTOM = 900;
const A1 = { x: 150, y: BOTTOM - 562.5, w: 1000, h: 562.5 };
const B0 = { x: 1300, y: BOTTOM - 292.5, w: 520, h: 292.5 }; // B leaves as a small 16:9 copy…
const B1 = { x: 1560 - 427.5 / 2, y: BOTTOM - 760, w: 427.5, h: 760 }; // …and becomes 9:16
const LABEL_BASE = 970;
const LABEL_SIZE = 56;

/** Hits snap to the beat grid (local seconds). */
const times = (e) => {
  const b = e.beat;
  return {
    split: [0, b], // "Wide for…"
    youtube: b, // stamp on "YouTube"
    morph: [2 * b, 4 * b], // "Tall for…"
    reels: 4 * b, // stamp on "Reels"
    same: [5 * b, 6 * b], // "Same film."
  };
};

const R = (s, frame) => ({ ...frame, x: s.x, y: s.y, w: s.w, h: s.h });
const lerpRect = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });

function rects(lt, e) {
  const T = times(e);
  const s = snap(prog(lt, ...T.split));
  let A = lerpRect(e.hin, A1, s);
  let B = lerpRect(e.hin, B0, s);
  const m = easeInOutCubic(prog(lt, ...T.morph));
  B = lerpRect(B, B1, m);
  const q = easeInOutCubic(prog(lt, ...T.same));
  B = lerpRect(B, e.hout, q);
  A = { ...A, x: A.x - 260 * q };
  return { A, B, m, q };
}

/** Sample launch-film frame, laid out for landscape (mix 0) or portrait (mix 1). */
function adFrame(ctx, r, mix01, a, zoom, bump) {
  const L = {
    img: { x: 0, y: 0, w: 0.56, h: 1 },
    head: { x: 0.61, y: 0.34, s: 0.085, by: "h" },
    price: { x: 0.61, y: 0.7, s: 0.115, by: "h" },
    note: { x: 0.61, y: 0.8, s: 0.034, by: "h" },
  };
  const P = {
    img: { x: 0, y: 0, w: 1, h: 0.56 },
    head: { x: 0.08, y: 0.67, s: 0.1, by: "w" },
    price: { x: 0.08, y: 0.86, s: 0.135, by: "w" },
    note: { x: 0.08, y: 0.925, s: 0.04, by: "w" },
  };
  const k = mix01;
  const at = (key) => {
    const l = L[key], p = P[key];
    const unit = (u) => (u === "h" ? r.h : r.w);
    return { x: r.x + r.w * lerp(l.x, p.x, k), y: r.y + r.h * lerp(l.y, p.y, k), s: lerp(l.s * unit(l.by), p.s * unit(p.by), k) };
  };
  ctx.save();
  ctx.globalAlpha *= a;
  rrect(ctx, r.x, r.y, r.w, r.h, 20);
  ctx.clip();
  ctx.fillStyle = mix("charcoal", "ink", 0.035);
  ctx.fillRect(r.x, r.y, r.w, r.h);
  const im = { x: lerp(L.img.x, P.img.x, k), y: lerp(L.img.y, P.img.y, k), w: lerp(L.img.w, P.img.w, k), h: lerp(L.img.h, P.img.h, k) };
  placeholder(ctx, r.x + r.w * im.x, r.y + r.h * im.y, r.w * im.w, r.h * im.h, "I1 · still");
  const h = at("head");
  const sc = 1 + 0.06 * bump;
  text(ctx, "New phone", h.x, h.y - h.s * 1.05, { family: FONT.display, size: h.s * sc, fill: "ink", zoom });
  text(ctx, "in store.", h.x, h.y, { family: FONT.display, size: h.s * sc, fill: "ink", zoom });
  const p = at("price");
  text(ctx, "₹19,999", p.x, p.y, { family: FONT.display, size: p.s, fill: "ink", zoom });
  const n = at("note");
  text(ctx, "SAMPLE PRICE", n.x, n.y, { family: FONT.mono, weight: 500, size: n.s, fill: alpha("ink", 0.55), zoom });
  ctx.restore();
}

function stamp(ctx, str, cx, t, at, fade, zoom) {
  if (t < at) return;
  const s = spring(t - at, 3.4, 0.45);
  const scale = lerp(1.6, 1, s);
  const a = Math.min(1, (t - at) / 0.08) * (1 - fade);
  if (a <= 0) return;
  ctx.save();
  ctx.translate(cx, LABEL_BASE - LABEL_SIZE * 0.35);
  ctx.scale(scale, scale);
  text(ctx, str, 0, LABEL_SIZE * 0.35, { family: FONT.display, size: LABEL_SIZE, fill: "ink", align: "center", alpha: a, zoom: zoom * scale });
  ctx.restore();
}

export default {
  id: "b08",
  carry(lt, e) {
    const { B } = rects(lt, e);
    if (lt <= 0) return { ...e.hin };
    if (lt >= times(e).same[1]) return { ...e.hout };
    return R(B, e.hin);
  },
  track(lt, e) {
    const { A, B } = rects(lt, e);
    return [...corners(A), ...corners(B)];
  },
  render(ctx, lt, e) {
    const T = times(e);
    const { A, B, m, q } = rects(lt, e);
    const bump = lt >= T.same[0] ? Math.max(0, 1 - spring(lt - T.same[0], 3, 0.35)) : 0;
    const split = lt > 0;
    // A (16:9) clears on "Same film."
    if (split && q < 1) {
      adFrame(ctx, A, 0, 1 - q, e.zoom, bump);
      drawCarry(ctx, R(A, e.hin), { alpha: 1 - q });
    }
    adFrame(ctx, B, m, 1, e.zoom, bump);
    drawCarry(ctx, lt >= T.same[1] ? e.hout : R(B, e.hin));
    stamp(ctx, "YouTube", A.x + A.w / 2, lt, T.youtube, q, e.zoom);
    stamp(ctx, "Reels", B.x + B.w / 2, lt, T.reels, q, e.zoom);
  },
};

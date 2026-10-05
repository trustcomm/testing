// Beat 7: "Change the price? One line. Re-render."
// Camera closes in on one line of code under the frame. On "One line." the sample price scrambles
// and lands on the new one; the frame's price scrambles and lands in the same frame. On "Re-render."
// the caret sweeps down the frame. The code strip leaves; the camera pulls back.
// In/Out: the product frame (unchanged geometry). Content: BEFORE price → AFTER price (SAMPLE).
import { alpha, FONT } from "../core/brand.js";
import { corners, drawCarry, rrect } from "../core/carry.js";
import { easeInOutCubic, easeOutCubic, lerp, prog } from "../core/ease.js";
import { text } from "../core/text.js";
import { adFrame, SAMPLE } from "./shared/adframe.js";

const SIZE = 52; // ≥ 48 px on screen at every zoom this beat uses (orange string literal)
const KEY = "price: ";
const STRIP = { y: 905, h: 84, r: 14 };

const T = (b) => ({
  strip: [0, 0.5 * b],
  scramble: [2 * b, 3 * b], // "One line." → lands on beat 3
  render: [4 * b, 4 * b + 0.3], // "Re-render."
  stripOut: [4.6 * b, 5.4 * b],
});

/** Deterministic scramble: each digit cycles by frame until it locks, left to right. */
function scramble(from, to, p, frame) {
  if (p <= 0) return from;
  if (p >= 1) return to;
  let out = "";
  for (let i = 0; i < to.length; i++) {
    const ch = to[i];
    if (!/[0-9]/.test(ch)) { out += ch; continue; }
    const lockAt = 0.35 + 0.6 * (i / to.length);
    if (p >= lockAt) out += ch;
    else out += String((frame * 7 + i * 13 + ((frame * i) % 5)) % 10);
  }
  return out;
}

export default {
  id: "b07",
  carry: (lt, e) => ({ ...e.hin }),
  track(lt, e) {
    const P = T(e.beat);
    const o = e.hin;
    // Re-render sweep line (the only travelling element).
    const y = lerp(o.y, o.y + o.h, easeInOutCubic(prog(lt, ...P.render)));
    return [[o.x, y], [o.x + o.w, y]];
  },
  render(ctx, lt, e) {
    const P = T(e.beat);
    const o = e.hin;
    const frame = Math.round((e.t0 + lt) * e.fps);
    const sp = prog(lt, ...P.scramble);
    const price = scramble(SAMPLE.priceBefore, SAMPLE.priceAfter, sp, frame);
    adFrame(ctx, o, { mix: 0, zoom: e.zoom, price });
    drawCarry(ctx, o);

    // Re-render sweep: an orange caret line runs down the frame.
    const rp = prog(lt, ...P.render);
    if (rp > 0 && rp < 1) {
      const y = lerp(o.y, o.y + o.h, easeInOutCubic(rp));
      ctx.save();
      rrect(ctx, o.x, o.y, o.w, o.h, o.r);
      ctx.clip();
      ctx.fillStyle = alpha("orange", 1);
      ctx.fillRect(o.x, y - 5, o.w, 10);
      ctx.restore();
    }

    // The code strip: one line, centred under the frame.
    const inP = easeOutCubic(prog(lt, ...P.strip));
    const outP = easeInOutCubic(prog(lt, ...P.stripOut));
    const a = inP * (1 - outP);
    if (a <= 0) return;
    ctx.save();
    ctx.font = `500 ${SIZE}px ${FONT.mono}`;
    const cw = ctx.measureText(KEY + `"${SAMPLE.priceAfter}"`).width;
    ctx.restore();
    const x0 = 960 - cw / 2;
    const dy = (1 - inP) * 30 + outP * 30;
    ctx.save();
    ctx.globalAlpha *= a;
    rrect(ctx, x0 - 36, STRIP.y + dy, cw + 72 + 24, STRIP.h, STRIP.r);
    ctx.fillStyle = alpha("ink", 0.05);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = alpha("ink", 0.35);
    ctx.stroke();
    ctx.restore();
    const base = STRIP.y + dy + STRIP.h / 2 + SIZE * 0.36;
    text(ctx, KEY, x0, base, { family: FONT.mono, weight: 500, size: SIZE, fill: "ink", alpha: a, zoom: e.zoom });
    ctx.save();
    ctx.font = `500 ${SIZE}px ${FONT.mono}`;
    const kx = x0 + ctx.measureText(KEY).width;
    ctx.restore();
    text(ctx, `"${price}"`, kx, base, { family: FONT.mono, weight: 500, size: SIZE, fill: "orange", alpha: a, zoom: e.zoom });
    // Caret after the literal while editing.
    if (lt < P.scramble[1] + 0.3) {
      ctx.save();
      ctx.font = `500 ${SIZE}px ${FONT.mono}`;
      const ex = kx + ctx.measureText(`"${price}"`).width + 6;
      ctx.restore();
      drawCarry(ctx, { kind: "caret", x: ex, y: STRIP.y + dy + 14, w: 10, h: STRIP.h - 28, r: 2, colour: "orange" }, { alpha: a });
    }
  },
};

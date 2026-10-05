// Beat 10: stillness pocket. "GoDevLevel."
// The dot holds dead still for two beats (0.94 s). Then it springs out into the caret, which writes
// the wordmark (the reversed logo, revealed left to right behind it) and settles as the bar under "Level".
// In: orange dot. Out: the wordmark (exactly handoffOut); the bar travels with it.
import { ASSETS } from "../core/assets.js";
import { drawCarry, lerpCarry } from "../core/carry.js";
import { easeInOutCubic, lerp, prog, snap, spring } from "../core/ease.js";

const T = (b) => ({ hold: [0, 2 * b], spring: [2 * b, 2 * b + 0.3], write: [2 * b + 0.2, 2 * b + 0.88], settle: [2 * b + 0.88, 2 * b + 1.2] });

/** The bar under "Level", from the logo's measured letter columns. */
export function barOf(w) {
  const m = ASSETS.logoMeta ?? { w: 1565, level: [914, 1565] };
  const x0 = w.x + (w.w * m.level[0]) / m.w, x1 = w.x + (w.w * m.level[1]) / m.w;
  return { kind: "line", x: x0, y: w.y + w.h + 18, w: x1 - x0, h: 12, r: 0, colour: "orange" };
}

function caret(lt, e) {
  const P = T(e.beat);
  const w = e.hout;
  const start = { kind: "caret", x: w.x - 22, y: w.y, w: 12, h: w.h, r: 2, colour: "orange" };
  if (lt < P.spring[0]) return { ...e.hin };
  if (lt < P.write[0]) {
    const s = spring(lt - P.spring[0], 3.4, 0.5);
    const c = lerpCarry(e.hin, start, Math.min(1.08, s));
    c.kind = "caret";
    return c;
  }
  if (lt < P.write[1]) {
    const p = easeInOutCubic(prog(lt, ...P.write));
    return { ...start, x: lerp(start.x, w.x + w.w + 10, p) };
  }
  if (lt < P.settle[1]) {
    const end = { ...start, x: w.x + w.w + 10 };
    const c = lerpCarry(end, barOf(w), snap(prog(lt, ...P.settle)));
    c.kind = "caret";
    return c;
  }
  return barOf(w);
}

export default {
  id: "b10",
  carry(lt, e) {
    const P = T(e.beat);
    if (lt < P.spring[0]) return { ...e.hin };
    if (lt >= P.settle[1]) return { ...e.hout };
    const c = caret(lt, e);
    delete c.fill;
    return c;
  },
  track(lt, e) {
    const c = caret(lt, e);
    return [[c.x, c.y], [c.x + c.w, c.y + c.h]];
  },
  render(ctx, lt, e) {
    const P = T(e.beat);
    const w = e.hout;
    if (lt >= P.write[0]) {
      // Reveal the wordmark up to the caret's leading edge.
      const c = caret(lt, e);
      const edge = lt >= P.write[1] ? w.x + w.w + 40 : c.x; // finite: an infinite clip rect clips everything
      ctx.save();
      ctx.beginPath();
      ctx.rect(w.x - 40, w.y - 40, Math.max(0, edge - (w.x - 40)), w.h + 80);
      ctx.clip();
      drawCarry(ctx, w);
      ctx.restore();
    }
    drawCarry(ctx, caret(lt, e));
  },
};

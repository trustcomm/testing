// Beat 4: stillness pocket. "Your launches move fast. Your videos should too."
// The tag's bottom edge snaps out into a long underline; huge type rises in above it, word by word.
// In: tag bottom edge (from Beat 3). Out: the underline (exactly handoffOut).
import { corners, drawCarry, lerpCarry } from "../core/carry.js";
import { prog, snap } from "../core/ease.js";
import { drawHeadline, layout, movingWords, wordTimes } from "./shared/headline.js";

const EXTEND = (b) => [0, 0.5 * b]; // half a beat: edge → underline

const line = (lt, e) => {
  const p = snap(prog(lt, ...EXTEND(e.beat)));
  if (p >= 1) return { ...e.hout };
  if (p <= 0) return { ...e.hin };
  return lerpCarry(e.hin, e.hout, p);
};

import { FONT } from "../core/brand.js";

let cached = null;
let cachedFont = null;
const getLayout = (ctx, e) => {
  if (!cached || cachedFont !== FONT.display) {
    cached = layout(ctx, e.hout);
    cachedFont = FONT.display;
  }
  return cached;
};

export default {
  id: "b04",
  carry: (lt, e) => {
    const s = line(lt, e);
    delete s.fill;
    return s;
  },
  track(lt, e) {
    const pts = corners(line(lt, e));
    if (cached) pts.push(...movingWords(cached, wordTimes(e.vo), e.t0 + lt));
    return pts;
  },
  render(ctx, lt, e) {
    const L = getLayout(ctx, e);
    drawHeadline(ctx, L, wordTimes(e.vo), e.t0 + lt, e.hout.y, e.zoom);
    drawCarry(ctx, line(lt, e));
  },
};
export { getLayout };

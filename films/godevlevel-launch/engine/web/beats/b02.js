// Beat 2: "New tower on sale." Whip: the phone outline stretches tall into the tower outline.
// Inside, H1 whips up and out while H2 (tower aerial) whips in from below. Both are PLACEHOLDERS.
// In: phone outline. Out: tower outline (exactly handoffOut).
import { corners, drawCarry, lerpCarry, rrect } from "../core/carry.js";
import { prog, snap } from "../core/ease.js";
import { placeholder } from "../core/placeholder.js";

const WHIP = (b) => [0, 0.6 * b];

const shape = (lt, e) => {
  const p = snap(prog(lt, ...WHIP(e.beat)));
  if (p <= 0) return { ...e.hin };
  if (p >= 1) return { ...e.hout };
  const s = lerpCarry(e.hin, e.hout, p);
  delete s.fill;
  return s;
};

export default {
  id: "b02",
  carry: shape,
  track: (lt, e) => corners(shape(lt, e)),
  render(ctx, lt, e) {
    const s = shape(lt, e);
    const p = snap(prog(lt, ...WHIP(e.beat)));
    const k = s.stroke;
    const ix = s.x + k, iy = s.y + k, iw = s.w - 2 * k, ih = s.h - 2 * k;
    ctx.save();
    rrect(ctx, ix, iy, iw, ih, Math.max(0, s.r - k));
    ctx.clip();
    // Content whips vertically: H1 leaves upward, H2 arrives from below.
    if (p < 1) placeholder(ctx, ix, iy - p * ih, iw, ih, "H1 · footage");
    placeholder(ctx, ix, iy + (1 - p) * ih, iw, ih, "H2 · footage");
    ctx.restore();
    drawCarry(ctx, s);
  },
};

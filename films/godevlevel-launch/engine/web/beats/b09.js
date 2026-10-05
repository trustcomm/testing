// Beat 9: energy peak. "Mobile shops. Real estate. Brands. Anyone launching."
// The 9:16 frame flips through four examples, one per beat pair: H3 shop shutter, H2 tower,
// H4 unboxing, H5 launch-day crowd (all PLACEHOLDERS; fallback stills S3, S2, S4, S5).
// Every flip is motion-blurred. Then the frame shrinks into an orange dot.
// In: the 9:16 frame. Out: the orange dot (exactly handoffOut).
import { drawCarry, lerpCarry, rrect } from "../core/carry.js";
import { lerp, prog, snap } from "../core/ease.js";
import { placeholder } from "../core/placeholder.js";
import { adFrame, SAMPLE } from "./shared/adframe.js";

const FLIP = 0.22; // seconds per flip
const CLIPS = ["H3 · footage", "H2 · footage", "H4 · footage", "H5 · footage"];
const T = (b) => ({
  flips: [0, 2 * b - FLIP / 2, 4 * b - FLIP / 2, 6 * b - FLIP / 2], // first flip starts at the cut
  shrink: [7 * b, 8 * b - 0.12],
});

/** Horizontal squash of a flip at time lt (1 = flat to camera), and which content shows. */
function flipState(lt, b) {
  const P = T(b);
  let content = -1, sx = 1;
  P.flips.forEach((t0, i) => {
    if (lt >= t0 + FLIP / 2) content = i;
    const u = prog(lt, t0, t0 + FLIP);
    if (u > 0 && u < 1) sx = Math.abs(Math.cos(Math.PI * u));
  });
  return { content, sx };
}

function rect(lt, e) {
  const P = T(e.beat);
  const { sx } = flipState(lt, e.beat);
  const o = e.hin;
  const base = { ...o, x: o.x + (o.w * (1 - sx)) / 2, w: o.w * sx };
  const p = snap(prog(lt, ...P.shrink));
  if (p <= 0) return base;
  if (p >= 1) return { ...e.hout };
  const s = lerpCarry(base, { ...e.hout, kind: "frame", stroke: o.stroke }, p);
  s.r = lerp(o.r, e.hout.w / 2, p);
  s.kind = "frame";
  s.fillDot = p;
  delete s.fill;
  return s;
}

const corners4 = (s) => [[s.x, s.y], [s.x + s.w, s.y], [s.x, s.y + s.h], [s.x + s.w, s.y + s.h]];

export default {
  id: "b09",
  carry(lt, e) {
    const s = rect(lt, e);
    delete s.fillDot;
    return s;
  },
  track: (lt, e) => corners4(rect(lt, e)),
  render(ctx, lt, e) {
    const s = rect(lt, e);
    if (s.kind === "dot") {
      drawCarry(ctx, s);
      return;
    }
    const { content } = flipState(lt, e.beat);
    const fade = 1 - (s.fillDot ?? 0);
    ctx.save();
    ctx.globalAlpha *= fade;
    if (content < 0) adFrame(ctx, e.hin, { mix: 1, zoom: e.zoom, price: SAMPLE.priceAfter }); // the frame as Beat 8 left it
    else {
      // Content lives in the unsquashed frame and is squashed with it.
      const o = e.hin, sx = s.w / o.w;
      ctx.save();
      rrect(ctx, s.x, s.y, s.w, s.h, s.r);
      ctx.clip();
      ctx.translate(s.x + s.w / 2, 0);
      ctx.scale(Math.max(sx, 1e-3), 1);
      ctx.translate(-(o.x + o.w / 2), 0);
      placeholder(ctx, o.x, o.y, o.w, o.h, CLIPS[content]);
      ctx.restore();
    }
    ctx.restore();
    if (s.fillDot) {
      ctx.save();
      ctx.globalAlpha *= s.fillDot;
      rrect(ctx, s.x, s.y, s.w, s.h, s.r);
      ctx.fillStyle = "#FD4B25";
      ctx.fill();
      ctx.restore();
    }
    drawCarry(ctx, s);
  },
};

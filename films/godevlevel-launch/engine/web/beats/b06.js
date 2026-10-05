// Beat 6: "Your colours. Your words. Your product. Exactly."
// The editor window opens out into the product frame (neutral, ink-only). Three hits on three beats:
//  (1) brand swatches pop and the caret sweeps across the frame, recolouring it (ink → brand);
//  (2) the headline word swaps ("product" → "phone");
//  (3) the product image (I1, PLACEHOLDER) drops into its slot.
// In: code editor window. Out: the product frame (exactly handoffOut), showing the BEFORE price.
import { alpha, C } from "../core/brand.js";
import { corners, drawCarry, lerpCarry, rrect } from "../core/carry.js";
import { easeInOutCubic, easeOutCubic, lerp, prog, snap, spring } from "../core/ease.js";
import { drawCodeLine } from "./b05.js";
import { adFrame, SAMPLE } from "./shared/adframe.js";

/** Snap a local time to the nearest beat. */
const onBeat = (t, b) => Math.round(t / b) * b;

function T(e) {
  const b = e.beat;
  const w = (name) => e.vo.words.find((x) => x.w.toLowerCase().startsWith(name)).t - e.t0;
  const h1 = Math.max(b, onBeat(w("colours"), b));
  const h2 = Math.max(h1 + b, onBeat(w("words"), b));
  const h3 = Math.max(h2 + b, onBeat(w("product"), b));
  return { open: [0, 0.75 * b], h1, sweep: [h1, h1 + 0.28], h2, h3, swatchesOut: [7 * b, 7.6 * b] };
}

// Frame-shaped window (still ink, thin) that the editor opens into before it recolours.
const neutralFrame = (e) => ({ kind: "window", x: e.hout.x, y: e.hout.y, w: e.hout.w, h: e.hout.h, r: e.hout.r, stroke: 2, colour: "ink" });

function shape(lt, e) {
  const P = T(e);
  if (lt <= 0) return { ...e.hin };
  if (lt < P.open[1]) {
    const s = lerpCarry(e.hin, neutralFrame(e), snap(prog(lt, ...P.open)));
    s.kind = "window";
    delete s.fill;
    return s;
  }
  if (lt < P.sweep[1]) return neutralFrame(e);
  return { ...e.hout };
}

// The caret: from the end of the code line to a full-height bar at the frame's left edge, then the sweep.
function caretState(lt, e, codeCaret) {
  const P = T(e);
  const o = e.hout, k = o.stroke;
  const bar = { kind: "caret", x: o.x + k, y: o.y + k, w: 10, h: o.h - 2 * k, r: 0, colour: "orange" };
  if (lt < P.open[1]) return lerpCarry(codeCaret, bar, snap(prog(lt, ...P.open)));
  if (lt < P.sweep[0]) return bar;
  if (lt < P.sweep[1]) return { ...bar, x: lerp(bar.x, o.x + o.w - k - 10, easeInOutCubic(prog(lt, ...P.sweep))) };
  return null;
}

export default {
  id: "b06",
  carry: (lt, e) => shape(lt, e),
  track(lt, e) {
    const pts = corners(shape(lt, e));
    const P = T(e);
    if (lt < P.sweep[1]) pts.push(...corners(caretState(lt, e, { kind: "caret", x: 1559, y: 338, w: 14, h: 80, r: 2, colour: "orange" })));
    else {
      // Caret has merged into the stroke: keep its last position so nothing reads as a jump.
      const o = e.hout, k = o.stroke;
      pts.push(...corners({ x: o.x + o.w - k - 10, y: o.y + k, w: 10, h: o.h - 2 * k }));
    }
    return pts;
  },
  render(ctx, lt, e) {
    const P = T(e);
    const o = e.hout;
    const s = shape(lt, e);
    // Code line lifts out as the window opens.
    let codeCaret = null;
    if (lt < P.open[1] + 0.05) {
      const p = easeOutCubic(prog(lt, 0, P.open[1]));
      ({ caret: codeCaret } = drawCodeLine(ctx, e.zoom, 1 - p, -90 * p));
    }
    codeCaret ??= { kind: "caret", x: 1559, y: 338, w: 14, h: 80, r: 2, colour: "orange" };

    // Frame content: neutral until the sweep passes, then brand.
    const open = prog(lt, 0.3 * e.beat, P.open[1]);
    if (open > 0) {
      // Finite bounds only: a clip rect with an infinite size clips everything away.
      const sweepX = lt < P.sweep[0] ? -1e4 : lt < P.sweep[1] ? caretState(lt, e, codeCaret).x : 1e4;
      const opts = (neutral) => ({
        mix: 0,
        zoom: e.zoom,
        alpha: open,
        neutral,
        swap: easeOutCubic(prog(lt, P.h2, P.h2 + 0.3)),
        drop: lt < P.h3 ? 0 : Math.min(1, spring(lt - P.h3, 3.2, 0.5)),
        price: SAMPLE.priceBefore,
      });
      const frameRect = { x: s.x, y: s.y, w: s.w, h: s.h };
      // Branded part (left of the sweep) and neutral part (right of it).
      ctx.save();
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, sweepX + 1e4, 2e4);
      ctx.clip();
      adFrame(ctx, frameRect, opts(0));
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(sweepX, -1e4, 2e4, 2e4);
      ctx.clip();
      adFrame(ctx, frameRect, opts(1));
      ctx.restore();
    }

    // Swatches: the three approved brand colours pop in on hit 1, leave before the end.
    if (lt >= P.h1) {
      const out = easeOutCubic(prog(lt, ...P.swatchesOut));
      ["orange", "charcoal", "ink"].forEach((c, i) => {
        const sp = spring(lt - P.h1 - i * 0.05, 3.6, 0.45);
        const r = 16 * Math.max(0, sp) * (1 - out);
        if (r <= 0.2) return;
        const cx = o.x + o.w - 44 - i * 46, cy = o.y + 44;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = C[c];
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = alpha("ink", 0.5);
        ctx.stroke();
      });
    }

    // Outline: neutral ink window until the sweep; then the orange frame draws on behind the caret.
    if (lt < P.sweep[0]) drawCarry(ctx, s);
    else if (lt < P.sweep[1]) {
      const cx = caretState(lt, e, codeCaret).x;
      drawCarry(ctx, neutralFrame(e));
      ctx.save();
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, cx + 1e4, 2e4);
      ctx.clip();
      drawCarry(ctx, o);
      ctx.restore();
    } else drawCarry(ctx, o);
    const c = caretState(lt, e, codeCaret);
    if (c) drawCarry(ctx, c);
  },
};

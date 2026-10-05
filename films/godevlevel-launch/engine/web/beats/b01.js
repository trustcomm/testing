// Beat 1: "New phone in store." The caret blinks twice on the beat, shoots up, and draws
// the phone outline in one stroke. H1 fills the phone (PLACEHOLDER until footage arrives).
// In: film-start caret. Out: phone outline (exactly handoffOut).
import { drawCarry, pointAt, rrect, rrectPoints, corners } from "../core/carry.js";
import { easeInCubic, easeInOutCubic, easeOutCubic, lerp, prog } from "../core/ease.js";
import { placeholder } from "../core/placeholder.js";

const phases = (b) => ({
  blinks: [[0, 0.5 * b], [b, 1.5 * b]], // caret on for the first half of beats 0 and 1
  shoot: [2 * b, 2.5 * b], // beat 2: caret shoots up to the phone's top edge
  trace: [2.5 * b, 3.5 * b], // one stroke around the phone, clockwise from top-centre
  fill: [3 * b, 4 * b], // H1 opens inside the outline
});

// Centreline of the outline stroke (outer rect inset by half the stroke).
const centreline = (o) => {
  const k = o.stroke;
  return rrectPoints(o.x + k / 2, o.y + k / 2, o.w - k, o.h - k, o.r - k / 2);
};

/** Caret rect while it shoots: top races up, bottom follows, ending as a square pen tip at top-centre. */
function shootRect(hin, hout, p) {
  const k = hout.stroke;
  const top = lerp(hin.y, hout.y, easeOutCubic(p));
  const bottom = lerp(hin.y + hin.h, hout.y + k, easeInCubic(p));
  const w = lerp(hin.w, k, p);
  const cx = hout.x + hout.w / 2;
  return { kind: "caret", x: cx - w / 2, y: top, w, h: Math.max(k, bottom - top), r: lerp(hin.r, 0, p), colour: hin.colour };
}

function penAt(hout, p) {
  const poly = centreline(hout);
  const [x, y] = pointAt(poly, easeInOutCubic(p) * poly.total);
  const k = hout.stroke;
  return { kind: "caret", x: x - k / 2, y: y - k / 2, w: k, h: k, r: 0, colour: hout.colour };
}

export default {
  id: "b01",
  carry(lt, e) {
    const P = phases(e.beat);
    if (lt < P.shoot[0]) return { ...e.hin };
    if (lt < P.shoot[1]) return shootRect(e.hin, e.hout, prog(lt, ...P.shoot));
    if (lt < P.trace[1]) return { ...e.hout, trim: easeInOutCubic(prog(lt, ...P.trace)) };
    return { ...e.hout };
  },
  track(lt, e) {
    const P = phases(e.beat);
    if (lt < P.shoot[0]) return corners(e.hin);
    if (lt < P.shoot[1]) return corners(shootRect(e.hin, e.hout, prog(lt, ...P.shoot)));
    if (lt < P.trace[1]) return corners(penAt(e.hout, prog(lt, ...P.trace)));
    return corners(e.hout);
  },
  render(ctx, lt, e) {
    const P = phases(e.beat);
    const o = e.hout;
    // H1 inside the phone: an iris opening from the centre, clipped to the outline's inner edge.
    if (lt >= P.fill[0]) {
      const p = easeOutCubic(prog(lt, ...P.fill));
      const k = o.stroke;
      const ix = o.x + k, iy = o.y + k, iw = o.w - 2 * k, ih = o.h - 2 * k;
      ctx.save();
      rrect(ctx, ix, iy, iw, ih, o.r - k);
      ctx.clip();
      const cx = ix + iw / 2, cy = iy + ih / 2;
      const w = iw * p, h = ih * p;
      ctx.beginPath();
      rrect(ctx, cx - w / 2, cy - h / 2, w, h, (o.r - k) * p);
      ctx.clip();
      placeholder(ctx, ix, iy, iw, ih, "H1 · footage", { a: Math.min(1, p * 1.4) });
      ctx.restore();
    }
    if (lt < P.shoot[0]) {
      const on = P.blinks.some(([a, b]) => lt >= a && lt < b);
      if (on) drawCarry(ctx, e.hin);
      return;
    }
    if (lt < P.shoot[1]) {
      drawCarry(ctx, shootRect(e.hin, o, prog(lt, ...P.shoot)));
      return;
    }
    if (lt < P.trace[1]) {
      const p = prog(lt, ...P.trace);
      drawCarry(ctx, o, { trim: easeInOutCubic(p) });
      drawCarry(ctx, penAt(o, p));
      return;
    }
    drawCarry(ctx, o);
  },
};

// Beat 3: "New offer every week." The tower snaps down into a price tag; "OFFER" stamps three
// times on three beats, each bigger. The tag then sheds everything but its bottom edge.
// In: tower outline. Out: the tag's bottom edge (exactly handoffOut).
import { FONT } from "../core/brand.js";
import { corners, drawCarry, lerpCarry, rrect } from "../core/carry.js";
import { placeholder } from "../core/placeholder.js";
import { easeInCubic, easeOutCubic, lerp, prog, snap, spring } from "../core/ease.js";
import { text } from "../core/text.js";

// The tag's outer box: its bottom stroke is exactly the handoff line (y + h = line.y + line.h).
const tagFrom = (line) => ({ kind: "tag", x: line.x, y: line.y + line.h - 310, w: line.w, h: 310, r: 18, stroke: line.h, point: 1, colour: "orange" });
const SIZES = [84, 104, 124]; // each bigger; capped to fit inside the tag below

const T = (b) => ({
  snap: [0, 0.6 * b],
  stamps: [b, 2 * b, 3 * b],
  shed: [3.45 * b, 3.9 * b], // done before the last frame so the cut shows only the edge
});

function tagState(lt, e) {
  const tag = tagFrom(e.hout);
  const p = snap(prog(lt, ...T(e.beat).snap));
  if (p <= 0) return { ...e.hin };
  const from = { ...e.hin, kind: "tag", point: 0 };
  const s = p >= 1 ? tag : lerpCarry(from, tag, p);
  s.kind = "tag";
  delete s.fill;
  return s;
}

export default {
  id: "b03",
  carry(lt, e) {
    const P = T(e.beat);
    if (lt >= P.shed[1]) return { ...e.hout };
    if (lt >= P.shed[0]) return { ...tagFrom(e.hout), shed: prog(lt, ...P.shed) };
    return tagState(lt, e);
  },
  track(lt, e) {
    const P = T(e.beat);
    if (lt >= P.shed[0]) return corners(e.hout);
    return corners(tagState(lt, e));
  },
  render(ctx, lt, e) {
    const P = T(e.beat);
    const line = e.hout;
    const tag = tagFrom(line);
    const shed = lt >= P.shed[0] ? easeInCubic(prog(lt, ...P.shed)) : 0;

    // OFFER: the latest stamp only, each bigger than the last; it drops away as the tag sheds.
    const n = P.stamps.filter((t) => lt >= t).length;
    if (n > 0) {
      const at = P.stamps[n - 1];
      const s = spring(lt - at, 3.6, 0.45);
      ctx.save();
      ctx.font = `800 100px ${FONT.display}`;
      const fit = (100 * (tag.w - 120)) / ctx.measureText("OFFER").width;
      ctx.restore();
      const final = Math.min(SIZES[n - 1], fit);
      const size = final * lerp(1.45, 1, s);
      const a = Math.min(1, (lt - at) / 0.06) * (1 - shed);
      const cx = tag.x + tag.w / 2, cy = tag.y + tag.h / 2 + final * 0.36 + shed * 140;
      text(ctx, "OFFER", cx, cy, { family: FONT.display, size, fill: "ink", align: "center", alpha: a, zoom: e.zoom });
    }
    if (lt >= P.shed[1]) {
      drawCarry(ctx, line);
      return;
    }
    if (shed > 0) {
      // Everything but the bottom edge fades; the bottom edge is drawn solid as the line it becomes.
      drawCarry(ctx, tag, { alpha: 1 - shed });
      drawCarry(ctx, line);
      return;
    }
    // The tower's contents (H2) ride the snap down and fade, so the cut from Beat 2 carries them.
    const st = tagState(lt, e);
    const p = snap(prog(lt, ...P.snap));
    if (p < 1) {
      const k = st.stroke ?? 10;
      ctx.save();
      ctx.globalAlpha *= 1 - p;
      rrect(ctx, st.x + k, st.y + k, st.w - 2 * k, st.h - 2 * k, Math.max(0, (st.r ?? 0) - k));
      ctx.clip();
      placeholder(ctx, st.x + k, st.y + k, st.w - 2 * k, st.h - 2 * k, "H2 · footage");
      ctx.restore();
    }
    drawCarry(ctx, st);
  },
};

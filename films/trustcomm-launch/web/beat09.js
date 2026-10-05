// Beat 9 — "They pick what to mention. Nothing is ticked for them." (F6) The real screen scrolls to "What should the
// review mention?"; the customer taps two chips; the rest stay empty; the product's own line "Nothing is ticked for
// you." is underlined. The phone settles to the standard size. Carry out: the ticked chips (the phone screen).
import { lerp, prog, snap } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col } from "./brand.js";
import { B, CARRY, P_BIG, P_STD, q, touch, breathe } from "./kit.js";
import { CSS, phone, ratingPage, screenRect, textWidth } from "./ui.js";

export const T = { scroll: q(0.1), scrollEnd: q(0.75), tap1: q(2 * B), tap2: q(3 * B), line: q(1.9), settle: q(2.5), settleEnd: q(3.75) };
const SCROLL = 238;
const at = (lt) => {
  const k = snap(prog(lt, T.settle, T.settleEnd));
  return { x: lerp(P_BIG.x, P_STD.x, k), y: lerp(P_BIG.y, P_STD.y, k), s: lerp(P_BIG.s, P_STD.s, k) };
};
const ticked = (lt) => ({ ...(lt >= T.tap1 ? { "How long it took": true } : {}), ...(lt >= T.tap2 ? { "Filter Coffee": true } : {}) });

export default {
  T,
  render(ctx, lt, e) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    breathe(ctx, lt, e.dur, 0.02); // no dead holds: a slow drift that is zero at both boundaries
    const P = at(lt);
    let rects = null;
    const scroll = SCROLL * snap(prog(lt, T.scroll, T.scrollEnd));
    phone(ctx, P.x, P.y, (c, sr) => {
      const press = { "How long it took": Math.max(0, 1 - Math.abs(lt - T.tap1) / 0.12), "Filter Coffee": Math.max(0, 1 - Math.abs(lt - T.tap2) / 0.12) };
      rects = ratingPage(c, sr, { rated: { food: 5, service: 5 }, ticked: ticked(lt), scroll, chipPress: press });
      // underline the product's own reassurance: "Nothing is ticked for you." (its line sits at y 336 in the page)
      const u = snap(prog(lt, T.line, T.line + 0.4));
      if (u > 0) {
        const x0 = textWidth(c, "Pick only what you want mentioned. ", 16 * CSS, 400, "ui");
        const w = textWidth(c, "Nothing is ticked for you.", 16 * CSS, 400, "ui");
        c.fillStyle = col("blue");
        c.fillRect(sr.x + 16 + x0, sr.y + 339 - scroll, w * u, 1.5);
      }
    }, { s: P.s });
    // chip rects are in phone-local units (phone centre = origin); world = centre + local × scale
    if (rects) for (const [label, t] of [["How long it took", T.tap1], ["Filter Coffee", T.tap2]]) {
      const r = rects[label];
      touch(ctx, P.x + (r.x + r.w / 2) * P.s, P.y + (r.y + r.h / 2) * P.s, lt - t);
    }
  },
  carry(lt, e) {
    if (lt <= 0) return CARRY.b08_09;
    if (lt >= e.dur - 1e-9) return { kind: "screen", ...screenRect(P_STD.x, P_STD.y, P_STD.s), colour: "paper" };
    return { kind: "screen" };
  },
  track(lt) {
    const P = at(lt);
    return [[P.x - 180 * P.s, P.y - 370 * P.s], [P.x + 180 * P.s, P.y + 370 * P.s]];
  },
  events() {
    return [
      { t: T.scroll, sfx: "SFX04", gain: -22, what: "page scrolls to the chips" },
      { t: T.tap1, sfx: "SFX01", gain: -8, what: "tap: How long it took" },
      { t: T.tap2, sfx: "SFX01", gain: -8, what: "tap: Filter Coffee" },
      { t: T.line, sfx: "SFX07", gain: -18, what: "soft check: 'Nothing is ticked for you.'", rate: 0.8 },
    ];
  },
};

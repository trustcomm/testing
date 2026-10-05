// Beat 3 — "The loudest one writes the review." Stillness pocket. The doorway rectangle becomes a single phone
// screen showing one harsh one-star review (fictional: placeholder lines, no invented words). It sits, still.
// Carry out: one square pixel lifts off the screen.
import { lerp, prog, snap } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col } from "./brand.js";
import { CARRY, DOOR, lerpRect, q, reviewCard } from "./kit.js";
import { phone, PHONE, rrect } from "./ui.js";

export const T = { land: q(0.55), lift: q(2.25) };
const PS = 1.0;
const BODY = { x: 960 - PHONE.w / 2, y: 540 - PHONE.h / 2, w: PHONE.w, h: PHONE.h, r: PHONE.r };
const morph = (lt) => snap(prog(lt, 0, T.land));

export default {
  T,
  render(ctx, lt) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    const p = morph(lt);
    if (p < 1) {
      const r = lerpRect({ ...DOOR, r: 22 }, BODY, p);
      ctx.strokeStyle = col("ink");
      ctx.lineWidth = lerp(10, 30, p);
      rrect(ctx, r.x, r.y, r.w, r.h, r.r);
      ctx.stroke();
      return;
    }
    phone(ctx, 960, 540, (c, sr) => {
      c.fillStyle = col("paper");
      c.fillRect(sr.x, sr.y, sr.w, sr.h);
      reviewCard(c, { x: sr.x + 16, y: sr.y + 170, w: sr.w - 32, h: 200 }, { stars: 1, starFill: "red", lines: 4, avatar: "red", scale: 0.62 });
    }, { s: PS });
    // the pixel: sits in the review's star, then lifts off
    const k = snap(prog(lt, T.lift, 2.9));
    const c = CARRY.b03_04;
    ctx.fillStyle = col("blue");
    rrect(ctx, lerp(c.x, c.x, k), lerp(c.y + 160, c.y, k), c.w, c.h, c.r);
    if (lt >= T.lift - 0.15) ctx.fill();
  },
  carry(lt, e) {
    if (lt <= 0) return CARRY.b02_03;
    if (lt >= e.dur - 1e-9) return CARRY.b03_04;
    return { kind: "phone" };
  },
  track(lt) {
    const r = lerpRect({ ...DOOR, r: 22 }, BODY, morph(lt));
    return [[r.x, r.y], [r.x + r.w, r.y + r.h], [960, lerp(CARRY.b03_04.y + 160, CARRY.b03_04.y, snap(prog(lt, T.lift, 2.9)))]];
  },
  stills: [[q(0.8), q(2.2)]], // the stillness pocket (for the rhythm report)
  events() {
    return [
      { t: T.land, sfx: "SFX03", gain: -8, what: "single thud as the review lands", rate: 0.7 },
      { t: T.lift, sfx: "SFX07", gain: -16, what: "the pixel lifts off", rate: 0.9 },
    ];
  },
};

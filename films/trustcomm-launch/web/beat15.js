// Beat 15 — "Fourteen days free. No card needed." (F8, F9) The squares converge into one big card:
// "14-day free trial · No card needed · ₹699/month after", three stamp hits on the beats. Carry out: the card
// collapses to one square. Price and trial terms exactly as the site, to be confirmed by the client (BRIEF §2.5).
import { clamp, prog, snap, spring } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col } from "./brand.js";
import { B, CARRY, lerpRect, q, breathe } from "./kit.js";
import { rrect, txt } from "./ui.js";

export const LINES = ["14-day free trial", "No card needed", "₹699/month after"];
export const T = { open: q(0.1), openEnd: q(0.6), stamps: [1, 3, 5].map((k) => q(k * B + 0.2)), close: q(3.25), end: q(3.85) };
const CARD = { x: 460, y: 230, w: 1000, h: 620, r: 60 };

export default {
  render(ctx, lt, e) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    breathe(ctx, lt, e.dur, 0.025); // no dead holds: a slow drift that is zero at both boundaries
    const o = snap(prog(lt, T.open, T.openEnd)), c = snap(prog(lt, T.close, T.end));
    const r = lerpRect(lerpRect(CARRY.b14_15, CARD, o), CARRY.b15_16, c);
    rrect(ctx, r.x, r.y, r.w, r.h, r.r);
    ctx.fillStyle = col(o < 0.5 || c > 0.5 ? "blue" : "white");
    ctx.fill();
    if (o >= 0.5 && c <= 0.5) { ctx.strokeStyle = col("blue"); ctx.lineWidth = 8; ctx.stroke(); }
    LINES.forEach((l, k) => {
      const t = T.stamps[k];
      if (lt < t || c > 0.3) return;
      const d = lt - t, s = 1.5 - 0.5 * spring(d, 4.2, 0.5);
      ctx.save();
      ctx.translate(960, 400 + k * 150);
      ctx.scale(s, s);
      txt(ctx, l, 0, 0, { size: 84, weight: 700, fill: k === 2 ? "blue" : "ink", alpha: clamp((d + 1 / 30) / (2 / 30)) * (1 - c / 0.3) });
      ctx.restore();
    });
  },
  carry(lt, e) {
    if (lt <= 0) return CARRY.b14_15;
    if (lt >= e.dur - 1e-9) return CARRY.b15_16;
    return { kind: "offer-card" };
  },
  track(lt) {
    const o = snap(prog(lt, T.open, T.openEnd)), c = snap(prog(lt, T.close, T.end));
    const r = lerpRect(lerpRect(CARRY.b14_15, CARD, o), CARRY.b15_16, c);
    return [[r.x, r.y], [r.x + r.w, r.y + r.h]];
  },
  events() {
    return [
      { t: T.open, sfx: "SFX04", gain: -16, what: "the squares become one card" },
      ...T.stamps.map((t, k) => ({ t, sfx: "SFX03", gain: -8, what: `stamp ${k + 1}/3 on the beat: ${LINES[k]}` })),
      { t: T.close, sfx: "SFX04", gain: -18, what: "the card collapses to one square" },
    ];
  },
};

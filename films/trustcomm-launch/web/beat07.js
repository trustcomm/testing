// Beat 7 — "They rate their visit…" The real rating screen (ui/demo-1): "How was the food?" tap, "How was the
// service?" tap; the stars fill on the beats. Carry out: the language chip (+ the phone screen).
// NOTE: the product's language switcher is not in the screenshots; the chip is a film element (F5).
import { prog, snap, spring } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col } from "./brand.js";
import { B, CARRY, langChip, P_BIG, q, touch, breathe } from "./kit.js";
import { phone, ratingPage, screenRect } from "./ui.js";

// four taps on the beats: food ★4, food ★5, service ★4, service ★5
export const TAPS = [[1, "food", 4], [2, "food", 5], [3, "service", 4], [4, "service", 5]].map(([k, key, n]) => ({ t: q(k * B), key, n }));
export const T = { chip: q(6 * B) };
const SR = screenRect(P_BIG.x, P_BIG.y, P_BIG.s);
// star centre on screen (page units → world)
const starAt = (key, n) => {
  const u = { x: 332 / 2 + (n - 1 - 2) * 47, y: (key === "food" ? 72 : 190) + 37 };
  return [SR.x + u.x * P_BIG.s, SR.y + u.y * P_BIG.s];
};
export const rated = (lt) => {
  const r = { food: 0, service: 0 };
  for (const tp of TAPS) if (lt >= tp.t) r[tp.key] = tp.n;
  return r;
};
export const CHIP = { x: 960, y: 70 };

export default {
  TAPS,
  render(ctx, lt, e) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    breathe(ctx, lt, e.dur, 0.03); // no dead holds: a slow drift that is zero at both boundaries
    phone(ctx, P_BIG.x, P_BIG.y, (c, sr) => ratingPage(c, sr, { rated: rated(lt) }), { s: P_BIG.s });
    for (const tp of TAPS) touch(ctx, ...starAt(tp.key, tp.n), lt - tp.t);
    if (lt >= T.chip) langChip(ctx, "English", CHIP.x, CHIP.y, "blue", { s: 0.6 + 0.4 * spring(lt - T.chip, 4, 0.5) });
  },
  carry(lt, e) {
    if (lt <= 0) return { kind: "screen", ...SR, colour: "paper" };
    return CARRY.b07_08;
  },
  track() {
    return [];
  },
  events() {
    return [
      ...TAPS.map((tp, i) => ({ t: tp.t, sfx: "SFX01", gain: -8, what: `tap ${i + 1}/4 on the beat (${tp.key} ★${tp.n})` })),
      { t: T.chip, sfx: "SFX07", gain: -12, what: "language chip pops in" },
    ];
  },
};

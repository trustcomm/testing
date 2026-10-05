// Beat 14 — "Hear from more of your customers. Not just the loudest ones." (F2) Accelerating montage: the stack fans
// into shops across India — tiffin room, salon, mobile shop, café, clinic, sweet shop — each inside a rounded square,
// faster and faster; the quiet green customers now have voices. Illustrated fallback (no Canva clips yet, BRIEF §7).
// Carry in: the stack of cards. Carry out: all squares converge.
import { clamp, lerp, prog, snap } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col } from "./brand.js";
import { CARRY, lerpRect, noteCard, q, reviewCard, shopSquare, breathe } from "./kit.js";
import { rrect } from "./ui.js";

// the montage accelerates from ~0.97 s to ~0.24 s between squares (BRIEF §3)
export const AT = [0, 0.97, 1.69, 2.18, 2.54, 2.78].map(q);
export const T = { converge: q(3.05), end: q(3.75) };
const SIZE = 400;
const SLOTS = [[460, 300], [960, 300], [1460, 300], [460, 780], [960, 780], [1460, 780]].map(([x, y]) => ({ x: x - SIZE / 2, y: y - SIZE / 2, w: SIZE, h: SIZE, r: 48 }));
const S = CARRY.b13_14;
const C = CARRY.b14_15;

function rectOf(i, lt) {
  const from = { x: S.x + S.w / 2 - 60, y: S.y + S.h / 2 - 60, w: 120, h: 120, r: 20 };
  const a = snap(prog(lt, AT[i], AT[i] + 0.22));
  const r = lerpRect(from, SLOTS[i], a);
  const c = snap(prog(lt, T.converge, T.end));
  return lerpRect(r, C, c);
}

export default {
  render(ctx, lt, e) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    breathe(ctx, lt, e.dur, 0.015); // no dead holds: a slow drift that is zero at both boundaries
    // the stack fans out first (it shrinks away as the first square opens)
    const st = 1 - snap(prog(lt, 0, 0.35));
    if (st > 0) {
      ctx.save(); ctx.globalAlpha = st;
      reviewCard(ctx, { x: S.x, y: S.y + 300, w: S.w, h: 180 }, { stars: 5, lines: 2, scale: 0.8 });
      reviewCard(ctx, { x: S.x, y: S.y + 150, w: S.w, h: 180 }, { stars: 4, lines: 2, scale: 0.8, avatar: "blue" });
      noteCard(ctx, { x: S.x, y: S.y, w: S.w, h: 180 }, { scale: 1.1 });
      ctx.restore();
    }
    const c = snap(prog(lt, T.converge, T.end));
    for (let i = 0; i < 6; i++) {
      if (lt < AT[i]) continue;
      const r = rectOf(i, lt);
      shopSquare(ctx, r, i, { alpha: 1 - c, voice: prog(lt, AT[i] + 0.15, AT[i] + 0.35) });
    }
    if (c > 0) { // they converge into one blue square
      ctx.fillStyle = col("blue");
      ctx.globalAlpha = c;
      const r = lerpRect({ x: 960 - 200, y: 540 - 200, w: 400, h: 400, r: 48 }, C, c);
      rrect(ctx, r.x, r.y, r.w, r.h, r.r);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  },
  carry(lt, e) {
    if (lt <= 0) return CARRY.b13_14;
    if (lt >= e.dur - 1e-9) return CARRY.b14_15;
    return { kind: "montage" };
  },
  track(lt) {
    const pts = [];
    for (let i = 0; i < 6; i++) if (lt >= AT[i]) { const r = rectOf(i, lt); pts.push([r.x, r.y], [r.x + r.w, r.y + r.h]); }
    return pts;
  },
  cuts() {
    return AT.slice(1);
  },
  events() {
    return [
      ...AT.map((t, i) => ({ t, sfx: i % 2 ? "SFX07" : "SFX03", gain: -10 + i, what: `accelerating hit ${i + 1}/6: ${["Tiffin room", "Salon", "Mobile shop", "Café", "Clinic", "Sweet shop"][i]}`, rate: 1 + 0.06 * i })),
      { t: T.converge, sfx: "SFX04", gain: -14, what: "all squares converge" },
    ];
  },
};

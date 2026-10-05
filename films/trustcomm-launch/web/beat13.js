// Beat 13 — "Real reviews, from real customers." Stillness pocket. The owner reads, nods, smiles. One card at a time
// stacks gently: two reviews (placeholder lines — every on-screen review text needs client approval, BRIEF §10) and
// the private note. Carry in: the owner's phone. Carry out: the stack of cards.
import { lerp, prog, snap } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col } from "./brand.js";
import { blob, CARRY, lerpRect, noteCard, q, reviewCard } from "./kit.js";
import { phone, screenRect } from "./ui.js";

export const T = { open: q(0.15), openEnd: q(0.7), c1: q(0.8), c2: q(1.6), c3: q(2.4), nod: q(2.9) };
const S = CARRY.b13_14;
const slot = (k) => ({ x: S.x, y: S.y + 300 - k * 150, w: S.w, h: 180, r: 22 });

export default {
  T,
  render(ctx, lt) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    // the owner's phone opens out into the stack of what customers sent
    const o = snap(prog(lt, T.open, T.openEnd));
    if (o < 1) {
      const osr = screenRect(1450, 540, 0.92);
      const r = lerpRect(osr, { x: S.x, y: S.y, w: S.w, h: S.h, r: 22 }, o);
      ctx.save(); ctx.globalAlpha = 1 - o; phone(ctx, r.x + r.w / 2, r.y + r.h / 2, (c, sr) => { c.fillStyle = col("paper"); c.fillRect(sr.x, sr.y, sr.w, sr.h); noteCard(c, { x: sr.x + 16, y: sr.y + 60, w: sr.w - 32, h: 104 }, { scale: 0.62 }); }, { s: lerp(0.92, 1.3, o) }); ctx.restore();
    }
    // the owner: reads, nods, smiles
    const nod = Math.sin(Math.PI * prog(lt, T.nod, T.nod + 0.5)) * 12;
    blob(ctx, 1380, 640 + nod, 90, "shop", { mood: 1, alpha: snap(prog(lt, T.open, T.openEnd)) });
    // one card at a time, gently
    const cards = [[T.c1, (c, r) => reviewCard(c, r, { stars: 5, lines: 2, scale: 0.8, avatar: "green" })], [T.c2, (c, r) => reviewCard(c, r, { stars: 4, lines: 2, scale: 0.8, avatar: "blue" })], [T.c3, (c, r) => noteCard(c, r, { scale: 1.1 })]];
    cards.forEach(([t, draw], k) => {
      const a = snap(prog(lt, t, t + 0.45));
      if (a <= 0) return;
      const r = slot(k);
      draw(ctx, { ...r, y: r.y + 40 * (1 - a) });
    });
  },
  carry(lt, e) {
    if (lt <= 0) return CARRY.b12_13;
    if (lt >= e.dur - 1e-9) return CARRY.b13_14;
    return { kind: "owner-reads" };
  },
  track(lt) {
    const r = lerpRect(screenRect(1450, 540, 0.92), S, snap(prog(lt, T.open, T.openEnd)));
    return [[r.x, r.y], [r.x + r.w, r.y + r.h]];
  },
  stills: [[q(1.1), q(1.55)], [q(2.0), q(2.35)], [q(3.4), q(3.9)]],
  events() {
    return [{ t: T.c1, sfx: "SFX08", gain: -14, what: "single warm chime", rate: 0.8 }];
  },
};

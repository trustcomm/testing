// Beat 12 — "…or tell you privately." (F7) Path 2. On the real message screen (ui/demo-3) the customer writes the
// site's own example — "The table by the door gets cold in the evening" — sends it, and the private note flies to
// the owner's phone. Carry in: the posted review card. Carry out: the owner's phone.
import { clamp, lerp, prog, snap } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col } from "./brand.js";
import { CARRY, lerpRect, NOTE, noteCard, q, reviewCard, touch, breathe } from "./kit.js";
import { messagePage, phone, rrect, screenRect, txt } from "./ui.js";

export const T = { park: q(0.45), in: q(0.15), type: q(0.6), typeEnd: q(1.7), send: q(1.95), fly: q(2.05), flyEnd: q(2.65), ping: q(2.7), exit: q(3.0) };
const CUST = { x: 760, y: 540, s: 1.0 };
const OWNER = { x: 1450, y: 540, s: 0.92 };
const PARK = { x: 90, y: 120, w: 372, h: 204, r: 14 };

export default {
  T,
  render(ctx, lt, e) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    breathe(ctx, lt, e.dur, 0.02); // no dead holds: a slow drift that is zero at both boundaries
    // path 1's review card parks top-left (it stays: both paths are real)
    const pk = snap(prog(lt, 0, T.park));
    const rc = lerpRect(CARRY.b11_12, PARK, pk);
    reviewCard(ctx, rc, { stars: 5, text: ["Filter coffee at Meera's Tiffin Room was", "wonderful and served steaming hot."], scale: rc.w / CARRY.b11_12.w, alpha: 1 - prog(lt, T.exit, 3.6) });
    // the customer's phone with the real message screen
    const ci = snap(prog(lt, T.in, T.park + 0.2)), co = snap(prog(lt, T.exit, 3.7));
    const n = Math.round(NOTE.length * prog(lt, T.type, T.typeEnd));
    const cx = lerp(-400, CUST.x, ci) - 1500 * co;
    phone(ctx, cx, CUST.y, (c, sr) => messagePage(c, sr, { typed: NOTE.slice(0, n), caret: lt < T.send ? Math.floor(lt * 4) : -1, press: Math.max(0, 1 - Math.abs(lt - T.send) / 0.1) }), { s: CUST.s });
    const csr = screenRect(cx, CUST.y, CUST.s);
    touch(ctx, cx, csr.y + csr.h - 33 * CUST.s, lt - T.send);
    // the owner's phone slides in; the note flies to it
    const oi = snap(prog(lt, 1.4, 1.95));
    const ox = lerp(2300, OWNER.x, oi);
    phone(ctx, ox, OWNER.y, (c, sr) => {
      c.fillStyle = col("paper");
      c.fillRect(sr.x, sr.y, sr.w, sr.h);
      if (lt >= T.ping) { // a notification: the private note has arrived
        const k = snap(prog(lt, T.ping, T.ping + 0.3));
        noteCard(c, { x: sr.x + 16, y: sr.y + 60 - 40 * (1 - k), w: sr.w - 32, h: 104 }, { scale: 0.62, alpha: k });
      }
    }, { s: OWNER.s });
    if (lt >= T.fly && lt < T.ping + 0.05) {
      const f = snap(prog(lt, T.fly, T.flyEnd));
      const osr = screenRect(OWNER.x, OWNER.y, OWNER.s);
      const r = lerpRect({ x: csr.x + 20, y: csr.y + 260, w: csr.w - 40, h: 104 }, { x: osr.x + 16, y: osr.y + 60, w: osr.w - 32, h: 96 }, f);
      noteCard(ctx, r, { scale: r.w / 330, fold: Math.sin(Math.PI * f) * 0.5 });
    }
  },
  carry(lt, e) {
    if (lt <= 0) return CARRY.b11_12;
    if (lt >= e.dur - 1e-9) return CARRY.b12_13;
    return { kind: "owner-path" };
  },
  track(lt) {
    const pk = snap(prog(lt, 0, T.park)), rc = lerpRect(CARRY.b11_12, PARK, pk);
    const ci = snap(prog(lt, T.in, T.park + 0.2)), co = snap(prog(lt, T.exit, 3.7)), cx = lerp(-400, CUST.x, ci) - 1500 * co;
    return [[rc.x, rc.y], [rc.x + rc.w, rc.y + rc.h], [cx, CUST.y], [lerp(2300, OWNER.x, snap(prog(lt, 1.4, 1.95))), OWNER.y]];
  },
  events() {
    return [
      { t: T.in, sfx: "SFX04", gain: -20, what: "the customer's phone slides in" },
      ...[0, 1, 2, 3].map((k) => ({ t: q(T.type + k * 0.27), sfx: "SFX01", gain: -20, what: `typing tick ${k + 1}/4`, rate: 1.3 })),
      { t: T.send, sfx: "SFX01", gain: -8, what: "tap: Send to owner" },
      { t: T.fly, sfx: "SFX12", gain: -8, what: "paper fold as the note flies" },
      { t: T.ping, sfx: "SFX08", gain: -10, what: "soft notification on the owner's phone" },
    ];
  },
};

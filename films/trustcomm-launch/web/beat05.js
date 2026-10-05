// Beat 5 — "One QR code on your counter." The square multiplies into a full QR code, which prints onto a counter
// stand-up with the fictional shop's name and colours (F3). The camera swings round the stand.
// Carry out: the QR code on the stand (= Beat 6's carry in).
import { clamp, lerp, prog, snap } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col } from "./brand.js";
import { B, CARRY, lerpRect, q, QS, qrRect, stand, breathe } from "./kit.js";
import { qr, rrect } from "./ui.js";

export const T = { grow: q(0.97), print: q(2 * B + 0.2), stamp: q(4 * B), swing: q(5 * B) };
const R = qrRect(960);

export default {
  T,
  render(ctx, lt, e) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    breathe(ctx, lt, e.dur, 0.02); // no dead holds: a slow drift that is zero at both boundaries
    // camera swing round the stand: a horizontal squeeze and back (draft stand-in for a 3D orbit)
    const sw = prog(lt, T.swing, e.dur - 0.1);
    const kx = 1 - 0.28 * Math.sin(Math.PI * sw);
    ctx.save();
    ctx.translate(960, 560);
    ctx.scale(kx, 1);
    ctx.translate(-960, -560);
    const pr = snap(prog(lt, T.print, T.print + 0.6));
    if (pr > 0) stand(ctx, 960, { print: pr, qrAlpha: 0 });
    // the square multiplies into the QR: grows to the QR's place, modules appear from the centre
    const g = snap(prog(lt, 0, T.grow));
    const r = lerpRect(CARRY.b04_05, { ...R, r: 0 }, g);
    if (g < 1) {
      ctx.fillStyle = col("blue");
      rrect(ctx, r.x, r.y, r.w, r.h, r.r * (1 - g));
      ctx.globalAlpha = 1 - g;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.beginPath();
    const cr = (QS / 2) * 1.5 * clamp(g * 1.15);
    ctx.arc(R.x + QS / 2, R.y + QS / 2, Math.max(0.1, cr), 0, Math.PI * 2);
    ctx.clip();
    qr(ctx, R.x, R.y, QS);
    ctx.restore();
    ctx.restore();
  },
  carry(lt, e) {
    if (lt <= 0) return CARRY.b04_05;
    if (lt >= e.dur - 1e-9) return { kind: "qr", ...qrRect(960), colour: "ink" };
    return { kind: "qr-growing" };
  },
  track(lt) {
    const r = lerpRect(CARRY.b04_05, R, snap(prog(lt, 0, T.grow)));
    return [[r.x, r.y], [r.x + r.w, r.y + r.h]];
  },
  events() {
    return [
      { t: q(0.1), sfx: "SFX07", gain: -16, what: "the square multiplies" },
      { t: T.print, sfx: "SFX05", gain: -10, what: "printer zip as the stand prints" },
      { t: T.stamp, sfx: "SFX03", gain: -10, what: "stamp hit: the shop's name lands" },
      { t: T.swing, sfx: "SFX04", gain: -18, what: "camera swings round the stand" },
    ];
  },
};

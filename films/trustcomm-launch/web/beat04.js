// Beat 4 — "Meet Trustcomm." The pixel spins, grows, and snaps into the brand square; colour floods the frame and
// the Trustcomm logo appears; the music kicks in. Carry out: the logo's square.
// LOGO: client/logo-from-chat.jpg is a PLACEHOLDER until the SVG arrives.
import { lerp, prog, snap, spring } from "../../godevlevel-launch/engine/web/core/ease.js";
import { ASSETS } from "../../godevlevel-launch/engine/web/core/assets.js";
import { col } from "./brand.js";
import { CARRY, lerpRect, q } from "./kit.js";
import { rrect } from "./ui.js";

export const T = { snap: q(0.6), flood: q(0.62), logo: q(0.75), back: q(1.35) };
const sqAt = (lt) => {
  const a = CARRY.b03_04, b = CARRY.b04_05;
  const p = snap(prog(lt, 0, T.snap));
  return { ...lerpRect(a, b, p), rot: (1 - p) * Math.PI * 1.5 };
};

export default {
  T,
  render(ctx, lt, e) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    // flood: a blue circle from the square that fills the frame, then recedes back into it
    const f = lt < T.back ? snap(prog(lt, T.flood, T.flood + 0.3)) : 1 - snap(prog(lt, T.back, e.dur - 0.05));
    if (f > 0) {
      ctx.fillStyle = col("blue");
      ctx.beginPath();
      ctx.arc(960, 540, 60 + f * 1150, 0, Math.PI * 2);
      ctx.fill();
    }
    const s = sqAt(lt);
    ctx.save();
    ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
    ctx.rotate(s.rot);
    ctx.fillStyle = col(f > 0.5 ? "white" : "blue");
    rrect(ctx, -s.w / 2, -s.h / 2, s.w, s.h, s.r);
    ctx.fill();
    ctx.restore();
    // the logo (placeholder raster) on a white card while the frame is blue
    const la = Math.min(prog(lt, T.logo, T.logo + 0.15), 1 - prog(lt, T.back - 0.1, T.back + 0.15));
    if (la > 0 && ASSETS.logo) {
      const w = 760, h = (w * ASSETS.logo.height) / ASSETS.logo.width, sc = 0.9 + 0.1 * spring(lt - T.logo, 3, 0.5);
      ctx.save();
      ctx.globalAlpha = la;
      ctx.translate(960, 540);
      ctx.scale(sc, sc);
      ctx.fillStyle = col("white");
      rrect(ctx, -w / 2 - 40, -h / 2 - 30, w + 80, h + 60, 40);
      ctx.fill();
      ctx.drawImage(ASSETS.logo, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  },
  carry(lt, e) {
    if (lt <= 0) return CARRY.b03_04;
    if (lt >= e.dur - 1e-9) return CARRY.b04_05;
    return { kind: "logo" };
  },
  track(lt) {
    const s = sqAt(lt);
    return [[s.x, s.y], [s.x + s.w, s.y + s.h]];
  },
  events() {
    return [
      { t: T.snap, sfx: "SFX09", gain: -6, what: "riser → big downbeat hit (impact on the snap)", align: "peak" },
    ];
  },
};

// Beat 16 — "Trustcomm. Now across India. trustcomm dot app." The square becomes the logo; tiny QR squares light
// up across the frame; the URL types on. Final hit on the downbeat, hold, silence. (End.)
// PENDING: the brief's map of India needs an accurate, licensed outline — the animatic shows the squares on a plain
// field instead of guessing a shape. LOGO: client/logo-from-chat.jpg is a placeholder until the SVG arrives.
import { clamp, prog, snap, spring } from "../../godevlevel-launch/engine/web/core/ease.js";
import { ASSETS } from "../../godevlevel-launch/engine/web/core/assets.js";
import { col, rgba } from "./brand.js";
import { B, CARRY, lerpRect, q, breathe } from "./kit.js";
import { rrect, txt } from "./ui.js";

export const T = { logo: q(0.2), logoEnd: q(0.75), lights: q(0.9), lightsEnd: q(3.4), url: q(2.3), urlEnd: q(3.0), hit: q(8 * B) };
const URL = "trustcomm.app";
// deterministic grid of tiny squares, each with its own light-up time
const DOTS = (() => {
  let s = 0x51ab;
  const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 2 ** 32);
  const out = [];
  for (let y = 80; y < 1020; y += 44) for (let x = 60; x < 1880; x += 44) {
    if (Math.abs(x - 960) < 470 && Math.abs(y - 500) < 260) continue; // keep the logo area clear
    out.push({ x, y, t: T.lights + rnd() * (T.lightsEnd - T.lights) });
  }
  return out;
})();

export default {
  render(ctx, lt, e) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    breathe(ctx, lt, e.dur, 0.03); // no dead holds: a slow drift that is zero at both boundaries
    const hit = lt >= T.hit ? 1 - prog(lt, T.hit, T.hit + 0.6) : 0;
    for (const d of DOTS) {
      if (lt < d.t) continue;
      const a = snap(prog(lt, d.t, d.t + 0.2));
      ctx.fillStyle = rgba("blue", 0.18 + 0.5 * a * (0.6 + 0.4 * hit));
      rrect(ctx, d.x - 9, d.y - 9, 18, 18, 4);
      ctx.fill();
    }
    // the square becomes the logo
    const g = snap(prog(lt, T.logo, T.logoEnd));
    if (g < 1) {
      const r = lerpRect(CARRY.b15_16, { x: 960 - 30, y: 470 - 30, w: 60, h: 60, r: 10 }, g);
      ctx.fillStyle = col("blue"); ctx.globalAlpha = 1 - g; rrect(ctx, r.x, r.y, r.w, r.h, r.r); ctx.fill(); ctx.globalAlpha = 1;
    }
    if (g > 0 && ASSETS.logo) {
      const w = 820, h = (w * ASSETS.logo.height) / ASSETS.logo.width, sc = (0.85 + 0.15 * spring(lt - T.logo, 3, 0.55)) * (1 + 0.02 * hit);
      ctx.save(); ctx.globalAlpha = g; ctx.translate(960, 470); ctx.scale(sc, sc);
      ctx.fillStyle = col("white"); rrect(ctx, -w / 2 - 40, -h / 2 - 26, w + 80, h + 52, 36); ctx.fill();
      ctx.drawImage(ASSETS.logo, -w / 2, -h / 2, w, h); ctx.restore();
    }
    const n = Math.round(URL.length * prog(lt, T.url, T.urlEnd));
    if (n > 0) txt(ctx, URL.slice(0, n), 960, 720, { size: 64, weight: 600, fill: "ink" });
  },
  carry(lt, e) {
    if (lt <= 0) return CARRY.b15_16;
    return { kind: "end" };
  },
  track(lt) {
    const g = snap(prog(lt, T.logo, T.logoEnd)), r = lerpRect(CARRY.b15_16, { x: 930, y: 440, w: 60, h: 60 }, g);
    return [[r.x, r.y], [r.x + r.w, r.y + r.h]];
  },
  stills: [[q(4.4), q(5.8)]],
  events() {
    return [
      { t: T.logo, sfx: "SFX07", gain: -14, what: "the square becomes the logo" },
      ...[0, 1, 2, 3].map((k) => ({ t: q(T.url + k * 0.17), sfx: "SFX01", gain: -20, what: `URL types on ${k + 1}/4`, rate: 1.3 })),
      { t: T.hit, sfx: "SFX10", gain: -4, what: "big final hit with shimmer tail on the downbeat (then silence)" },
    ];
  },
};

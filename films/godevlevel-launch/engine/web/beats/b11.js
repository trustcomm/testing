// Beat 11: "Build your launch." Tagline and URL type on under the lockup. Final hit on the downbeat:
// the bar runs the full width of the wordmark with a small pop. Hold. Fade to charcoal.
// In: the wordmark (+ bar). Out: end of film.
import { C, FONT } from "../core/brand.js";
import { drawCarry } from "../core/carry.js";
import { easeInOutCubic, lerp, prog, snap, spring } from "../core/ease.js";
import { text, wordOffsets } from "../core/text.js";
import { barOf } from "./b10.js";

const LIFT = 70;
const URL = "godevlevel.com";
const T = (e) => {
  const b = e.beat;
  // Final hit: the first bar downbeat (multiple of 4 beats from the film's first downbeat) inside this beat.
  const film = e.film.tl;
  const k = Math.ceil((e.t0 + 0.6 * b - film.downbeat) / (4 * b));
  const hit = film.downbeat + 4 * b * k - e.t0;
  return { lift: [0, 0.5 * b], url: [0.9, 1.3], hit, fade: [e.dur - 0.45, e.dur] };
};

function lockup(lt, e) {
  const P = T(e);
  const dy = -LIFT * snap(prog(lt, ...P.lift));
  return { ...e.hin, y: e.hin.y + dy };
}

export default {
  id: "b11",
  carry: lockup,
  track(lt, e) {
    const w = lockup(lt, e);
    return [[w.x, w.y], [w.x + w.w, w.y + w.h]];
  },
  render(ctx, lt, e) {
    const P = T(e);
    const w = lockup(lt, e);
    const pop = lt >= P.hit ? 1 + 0.03 * (1 - spring(lt - P.hit, 3, 0.4)) : 1;
    ctx.save();
    ctx.translate(960, w.y + w.h / 2);
    ctx.scale(pop, pop);
    ctx.translate(-960, -(w.y + w.h / 2));
    drawCarry(ctx, w);
    // Bar: under "Level", then the full width of the wordmark on the downbeat.
    const bar = barOf(w);
    const full = snap(prog(lt, P.hit, P.hit + 0.18));
    drawCarry(ctx, { ...bar, x: lerp(bar.x, w.x, full), w: lerp(bar.w, w.w, full) });
    ctx.restore();

    // Tagline, per word on the VO's (estimated) word onsets.
    const words = ["Build", "your", "launch."];
    const size = 76;
    const L = wordOffsets(ctx, words, FONT.display, 800, size);
    const x0 = 960 - L.width / 2;
    const base = w.y + w.h + 150;
    words.forEach((wd, i) => {
      const t = e.vo.words[i].t - e.t0;
      const p = snap(prog(lt, t - 0.04, t + 0.16));
      if (p > 0) text(ctx, wd, x0 + L.x[i], base + (1 - p) * 30, { family: FONT.display, size, fill: "ink", alpha: p, zoom: e.zoom });
    });
    // URL types on.
    const n = Math.floor(URL.length * prog(lt, ...P.url));
    if (n > 0) text(ctx, URL.slice(0, n), 960, base + 80, { family: FONT.mono, weight: 500, size: 36, fill: "rgba(245,243,239,0.7)", align: "center", zoom: e.zoom });

    // Fade to charcoal.
    const f = easeInOutCubic(prog(lt, ...P.fade));
    if (f > 0) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = f;
      ctx.fillStyle = C.charcoal;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
  },
};

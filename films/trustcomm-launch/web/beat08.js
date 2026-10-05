// Beat 8 — "…in their own language. English. Hinglish. Hindi. Kannada. Tamil. Telugu." (F5) Accelerating montage:
// the same question flips through six languages, each flip landing on its spoken name (audio-first, beats.json),
// each transition faster, the chip changing colour every time. Carry out: the chips row (the phone screen).
// TRANSLATIONS of "How was the food?" are DRAFTS — replace with the product's own strings or have them confirmed.
import { clamp, prog, snap, spring } from "../../godevlevel-launch/engine/web/core/ease.js";
import { col } from "./brand.js";
import { CARRY, langChip, P_BIG, breathe } from "./kit.js";
import { phone, ratingPage, screenRect } from "./ui.js";
import { CHIP } from "./beat07.js";

export const LANGS = [
  { chip: "English", q: "How was the food?", fill: "blue" },
  { chip: "Hinglish", q: "Khana kaisa tha?", fill: "ink" },
  { chip: "हिंदी", q: "खाना कैसा था?", fill: "green" },
  { chip: "ಕನ್ನಡ", q: "ಊಟ ಹೇಗಿತ್ತು?", fill: "shop" },
  { chip: "தமிழ்", q: "சாப்பாடு எப்படி இருந்தது?", fill: "red" },
  { chip: "తెలుగు", q: "భోజనం ఎలా ఉంది?", fill: "blue" },
];
const SR = screenRect(P_BIG.x, P_BIG.y, P_BIG.s);

// flips come from beats.json (Beat 8 entry): times in the beat, and each transition's length (shrinking)
const flips = (e) => e.entry.flips.map((f) => ({ t: f.frameInBeat / e.fps, d: f.transition, st: f.tickPopSemitones }));
function state(lt, e) {
  const fl = flips(e);
  let i = 0;
  // the first flip (English) re-asserts the opening language; later flips switch to the next language
  for (let k = 1; k < fl.length; k++) if (lt >= fl[k].t) i = k;
  const cur = fl[i];
  const p = i === 0 ? 1 : snap(prog(lt, cur.t, cur.t + cur.d));
  return { i, p, fl };
}

export default {
  render(ctx, lt, e) {
    ctx.fillStyle = col("paper");
    ctx.fillRect(-2000, -2000, 6000, 6000);
    breathe(ctx, lt, e.dur, 0.025); // no dead holds: a slow drift that is zero at both boundaries
    const { i, p, fl } = state(lt, e);
    const L = LANGS[i], P = LANGS[Math.max(0, i - 1)];
    phone(ctx, P_BIG.x, P_BIG.y, (c, sr) => {
      // the page stays; only the question line flips: the old one slides up and out, the new one slides up into place
      ratingPage(c, sr, { rated: { food: 5, service: 5 }, question: L.q });
      if (p < 1) {
        c.save();
        c.beginPath(); c.rect(sr.x, sr.y + 52, sr.w, 28); c.clip();
        c.fillStyle = col("paper"); c.fillRect(sr.x, sr.y + 52, sr.w, 28);
        c.save(); c.translate(0, -24 * p); c.globalAlpha = 1 - p; ratingPage(c, sr, { rated: { food: 5, service: 5 }, question: P.q }); c.restore();
        c.save(); c.translate(0, 24 * (1 - p)); c.globalAlpha = p; ratingPage(c, sr, { rated: { food: 5, service: 5 }, question: L.q }); c.restore();
        c.restore();
      }
    }, { s: P_BIG.s });
    const pop = i === 0 ? 1 : 0.8 + 0.2 * spring(lt - fl[i].t, 6, 0.45);
    langChip(ctx, L.chip, CHIP.x, CHIP.y, L.fill, { s: pop });
  },
  carry(lt, e) {
    if (lt <= 0) return CARRY.b07_08;
    return CARRY.b08_09;
  },
  track() {
    return [];
  },
  /** internal cuts (for the rhythm report): each language flip */
  cuts(e) {
    return flips(e).slice(1).map((f) => f.t);
  },
  events(e) {
    return flips(e).map((f, k) => ({ t: f.t, sfx: "SFX07", gain: -12, what: `tick-pop ${k + 1}/6: ${LANGS[k].chip}`, rate: 2 ** (f.st / 12) }));
  },
};

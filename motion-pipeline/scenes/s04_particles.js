import { tokens as T } from "../tokens.js";
import { win, inOutQuint } from "../engine/ease.js";
import { grid, setType, drawBackground, fontFor } from "../engine/layout.js";
import { riseIn, riseInDur, scramble, scrambleLock, odometer, layoutGlyphs } from "../engine/type.js";
import { motes, sparks, confetti } from "../engine/particles.js";

// Four beats of two seconds, one statement each (entrance 0.45-0.55 s, hold 1.25-1.35 s, exit 0.2 s), and particles that
// serve them: dust that follows a drifting camera, sparks that fly from each letter as it locks, confetti behind a number
// as it lands, and a GPU field whose density spikes on the reveal and thins while the type is read.
const START = 19, DUR = 8, X = grid.l, Y = 640, BEAT = 2, EXIT = 0.2;
const LOCKED = { text: "LOCKED", size: 120, t0: 2, dur: 0.5 };
const BEATS = [
  { id: "motes", tag: "01 / MOTES", size: 168, e: riseInDur("SLOW AIR"), play: (c, t, o) => riseIn(c, t, { ...o, text: "SLOW AIR" }) },
  { id: "sparks", tag: "02 / SPARKS", size: LOCKED.size, e: LOCKED.dur, play: (c, t, o) => scramble(c, t, { ...o, role: "label", text: LOCKED.text, dur: LOCKED.dur }) },
  { id: "confetti", tag: "03 / CONFETTI", size: 168, e: 0.55, play: (c, t, o) => odometer(c, t, { ...o, role: "hero", from: 0, to: 1500, dur: 0.55 }) },
  { id: "gpu", tag: "04 / 50,000 ON THE GPU", size: 168, e: riseInDur("50,000"), play: (c, t, o) => riseIn(c, t, { ...o, text: "50,000" }) },
].map((b, i) => ({ ...b, inStart: i * BEAT, inDone: i * BEAT + b.e, outStart: (i + 1) * BEAT - EXIT, outEnd: (i + 1) * BEAT }));
const LAND = 2 * BEAT + 0.55;                                              // the number lands: confetti goes off
const REVEAL = 3 * BEAT;                                                   // the GPU field's reveal
// density is a dial: a quick rise to a peak on a hit, then a slow fall back to the base
const bump = (t, hit, amp) => amp * win(t, hit, hit + 0.12) * (1 - win(t, hit + 0.32, hit + 1.12));
const density = (t) => 0.3 + bump(t, LAND, 0.35) + bump(t, REVEAL, 0.7);

export default {
  start: START, dur: DUR,
  // checked by npm test: hold >= tokens.hold, entrance 0.3-0.6 s, exit 0.15-0.3 s
  statements: BEATS.map(({ id, inStart, inDone, outStart, outEnd }) => ({ id, inStart, inDone, outStart, outEnd })),
  draw(ctx, t) {
    drawBackground(ctx, t + START);
    const cam = [t * 18, t * 8];                                           // a slow drift: the field follows it, scaled by depth
    window.PARTICLES.count = 50000; window.PARTICLES.density = density(t); window.PARTICLES.cam = cam;
    motes(ctx, t, { cam });

    for (const b of BEATS) {
      if (t < b.inStart || t > b.outEnd) continue;
      ctx.save();
      setType(ctx, "label");
      ctx.fillStyle = T.color.dim;
      ctx.globalAlpha = win(t, b.inStart, b.inStart + 0.25) * (1 - inOutQuint(win(t, b.outStart, b.outEnd)));
      ctx.fillText(b.tag, X, Y - b.size * 0.74 - 28);
      ctx.restore();
      b.play(ctx, t, { x: X, y: Y, t0: b.inStart, size: b.size, out: [b.outStart, b.outEnd] });
    }

    // sparks from each glyph at the moment it locks
    const { glyphs } = layoutGlyphs(ctx, LOCKED.text, X, Y, fontFor("label", LOCKED.size), T.track.label * LOCKED.size);
    glyphs.forEach((g, i) => sparks(ctx, t, { x: g.x + g.w / 2, y: Y - LOCKED.size * 0.35, t0: scrambleLock(i, glyphs.length, LOCKED), count: 18, seed: 100 + i, speed: [220, 720], life: [0.45, 0.95], spread: 2.6 }));
    // confetti from behind the number as it lands
    confetti(ctx, t, { x: X + 195, y: Y - 80, t0: LAND, count: 150, seed: 5, speed: [600, 1500], spread: 2.4 });
  },
};

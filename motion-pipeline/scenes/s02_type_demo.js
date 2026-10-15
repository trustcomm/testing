import { tokens as T } from "../tokens.js";
import { win, inOutQuint } from "../engine/ease.js";
import { grid, setType, drawBackground } from "../engine/layout.js";
import { riseIn, riseInDur, scramble, typeOn, odometer, markerWipe, splitExit } from "../engine/type.js";

// Six moves in sequence. One statement at a time cannot hold 1.2 s and still fit six into 8 s (6 x (0.3 + 1.2 + 0.15)
// = 9.9 s), so statements overlap: they alternate between two rows, and a row is always free again before its next use.
const START = 5, DUR = 8, ROWS = [400, 760], X = grid.l, HOLD = 1.3, EXIT = 0.2;
const MAKE = "MAKE IT MOVE";
// `e` is the entrance length; every move below is built to finish its entrance in e seconds.
const MOVES = [
  { id: "riseIn", tag: "01 / RISE IN", size: 112, t0: 0.05, e: riseInDur(MAKE), play: (c, t, o) => riseIn(c, t, { ...o, text: MAKE }) },
  { id: "scramble", tag: "02 / SCRAMBLE", size: 96, t0: 1.25, e: 0.5, play: (c, t, o) => scramble(c, t, { ...o, role: "label", text: "SIGNAL / NOISE", dur: 0.5 }) },
  { id: "typeOn", tag: "03 / TYPE ON", size: 84, t0: 2.45, e: 0.55, play: (c, t, o) => typeOn(c, t, { ...o, role: "label", text: "npm run render", dur: 0.55 }) },
  { id: "odometer", tag: "04 / ODOMETER", size: 168, t0: 3.65, e: 0.55, play: (c, t, o) => odometer(c, t, { ...o, role: "hero", from: 0, to: 240, prefix: "$", suffix: "K+", affixColor: T.color.accent, dur: 0.55 }) },
  { id: "markerWipe", tag: "05 / MARKER WIPE", size: 112, t0: 4.85, e: 0.55, play: (c, t, o) => markerWipe(c, t, { ...o, text: "MARK WHAT MATTERS", dur: 0.45, delay: 0.1 }) },
  { id: "splitExit", tag: "06 / SPLIT EXIT", size: 112, t0: 6.05, e: 0.4, play: (c, t, o) => splitExit(c, t, { ...o, text: "SPLIT THE LINE APART", in: [o.t0, o.t0 + 0.4] }) },
].map((m, i, all) => {
  const last = i === all.length - 1, inDone = m.t0 + m.e, outStart = last ? 7.7 : inDone + HOLD;
  return { ...m, row: i % 2, inStart: m.t0, inDone, outStart, outEnd: outStart + (last ? 0.25 : EXIT) };
});

export default {
  start: START, dur: DUR,
  // checked by npm test: hold >= tokens.hold, entrance 0.3-0.6 s, exit 0.15-0.3 s
  statements: MOVES.map(({ id, inStart, inDone, outStart, outEnd }) => ({ id, inStart, inDone, outStart, outEnd })),
  draw(ctx, t) {
    drawBackground(ctx, t + START);                    // the light keeps drifting from the title card
    for (const m of MOVES) {
      if (t < m.inStart || t > m.outEnd) continue;
      const y = ROWS[m.row];
      ctx.save();
      setType(ctx, "label");
      ctx.fillStyle = T.color.dim;
      ctx.globalAlpha = win(t, m.inStart, m.inStart + 0.25) * (1 - inOutQuint(win(t, m.outStart, m.outEnd)));
      ctx.fillText(m.tag, X, y - m.size * 0.74 - 28);
      ctx.restore();
      m.play(ctx, t, { x: X, y, t0: m.t0, size: m.size, out: [m.outStart, m.outEnd] });
    }
  },
};

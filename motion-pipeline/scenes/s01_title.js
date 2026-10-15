import { tokens as T } from "../tokens.js";
import { win, outExpo, inOutQuint } from "../engine/ease.js";
import { grid, setType, fitPx, drawLabel, drawBackground } from "../engine/layout.js";

const DUR = 5, WORDS = ["CODE", "IS", "THE", "CAMERA"], ACCENT = 3;   // one accent word per card
const IN0 = 0.3, STAGGER = 0.09, IN_DUR = 0.6, EXIT = 0.5, PUSH = 0.03;
const IN_DONE = IN0 + (WORDS.length - 1) * STAGGER + IN_DUR;

export default {
  start: 0, dur: DUR,
  // the hold rule, checked by npm test: fully legible for at least T.hold seconds
  statements: [{ id: "headline", inDone: IN_DONE, outStart: DUR - EXIT }],
  draw(ctx, t, dur) {
    const exit = inOutQuint(win(t, dur - EXIT, dur));
    ctx.save();
    // a constant slow push, 1.00 -> 1.03 over the scene, so the card never looks frozen
    const push = 1 + PUSH * (t / dur);
    ctx.translate(grid.cx, grid.cy); ctx.scale(push, push); ctx.translate(-grid.cx, -grid.cy);

    // 1. background: a slow drifting radial light
    drawBackground(ctx, t);

    // 2. headline: words rise in on a stagger, the blur resolves; sized to stay inside the safe box through the push
    const line = WORDS.join(" ");
    const px = setType(ctx, "hero", fitPx(ctx, "hero", line, grid.w / (1 + PUSH)));
    ctx.textBaseline = "alphabetic";
    const m = ctx.measureText(line);                           // measured whole, so there is no trailing space to throw the centring off
    const x0 = grid.cx - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;   // centred on the ink, not the advance
    WORDS.forEach((w, i) => {
      const p = outExpo(win(t, IN0 + i * STAGGER, IN0 + i * STAGGER + IN_DUR));
      const a = p * (1 - exit);
      if (a <= 0.001) return;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.filter = p < 0.995 ? `blur(${(1 - p) * 12}px)` : "none";
      ctx.fillStyle = i === ACCENT ? T.color.accent : T.color.ink;
      ctx.fillText(w, x0 + ctx.measureText(WORDS.slice(0, i).join(" ") + (i ? " " : "")).width, grid.cy + px * 0.33 + (1 - p) * 60 - exit * 40);
      ctx.restore();
    });
    ctx.restore();

    // 3. the label stays on the safe corner: it is not pushed
    drawLabel(ctx, "01 / INTRO", win(t, 0.1, 0.5) * (1 - exit));
  },
};

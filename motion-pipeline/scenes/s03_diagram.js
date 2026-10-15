import { tokens as T } from "../tokens.js";
import { win, lerp, outBack, outExpo, inOutQuint } from "../engine/ease.js";
import { drawBackground, setType } from "../engine/layout.js";
import { measure, drawOn, pulseAlong, pool } from "../engine/draw.js";
import { chatBubble, laptop, chartCard } from "../engine/props.js";
import { riseIn, riseInDur } from "../engine/type.js";

// Three props, two lines that draw on between them, a pulse that travels the route, labels 0.2 s after each prop.
const START = 13, DUR = 6, S = 1.1, EXIT = [5.55, 5.8], LABEL_Y = 850, LABEL_DELAY = 0.2;
const NODES = [
  { id: "chat", draw: chatBubble, x: 400, y: 590, t0: 0.3, rot: -0.03, hue: T.color.ice, seed: 1, text: "BRIEF", tag: "01" },
  { id: "laptop", draw: laptop, x: 960, y: 500, t0: 1.5, rot: 0, hue: T.color.accent, seed: 2, text: "CODE", tag: "02" },
  { id: "chart", draw: chartCard, x: 1520, y: 590, t0: 2.7, rot: 0.025, hue: T.color.coral, seed: 3, text: "RESULT", tag: "03" },
];
const bez = (a, b, c, d, n = 36) => Array.from({ length: n + 1 }, (_, i) => {
  const u = i / n, v = 1 - u, f = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u];
  return [f[0] * a[0] + f[1] * b[0] + f[2] * c[0] + f[3] * d[0], f[0] * a[1] + f[1] * b[1] + f[2] * c[1] + f[3] * d[1]];
});
// each line leaves one prop's edge and meets the next one's; it draws on just before that prop arrives
const LINES = [
  { pts: bez([558, 584], [648, 584], [685, 500], [775, 500]), t0: 1.0 },
  { pts: bez([1145, 500], [1235, 500], [1267, 590], [1357, 590]), t0: 2.2 },
];
LINES.forEach((l) => measure(l.pts));                                      // lengths cached at load
const PULSES = [[3.0, 3.6, 0], [3.7, 4.3, 1], [4.4, 5.0, 0], [5.1, 5.5, 1]];   // [start, end, line]

export default {
  start: START, dur: DUR,
  // the labels: entrance on riseIn, hold to the exit; `cue` says which prop each follows (npm test: 0.2 s after it)
  statements: NODES.map((n) => ({ id: `label-${n.id}`, cue: { prop: n.id, propStart: n.t0 }, inStart: n.t0 + LABEL_DELAY, inDone: n.t0 + LABEL_DELAY + riseInDur(n.text), outStart: EXIT[0], outEnd: EXIT[1] })),
  draw(ctx, t) {
    drawBackground(ctx, t + START);
    const exit = inOutQuint(win(t, EXIT[0], EXIT[1]));

    // the lines, with a dot where each one starts and ends
    ctx.save();
    ctx.globalAlpha = 1 - exit; ctx.strokeStyle = T.color.dim; ctx.fillStyle = T.color.dim; ctx.lineWidth = T.stroke.detail;
    for (const l of LINES) {
      const p = inOutQuint(win(t, l.t0, l.t0 + 0.6)), a = l.pts[0], b = l.pts[l.pts.length - 1];
      drawOn(ctx, l.pts, p);
      for (const [pt, k] of [[a, win(p, 0, 0.1)], [b, win(p, 0.9, 1)]]) { ctx.globalAlpha = k * (1 - exit); ctx.beginPath(); ctx.arc(pt[0], pt[1], T.stroke.outline, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();

    // the props: pop in with a little overshoot, on a pool of their own colour
    for (const n of NODES) {
      const p = win(t, n.t0, n.t0 + 0.5);
      if (p <= 0) continue;
      const drop = (1 - outExpo(p)) * 24;
      ctx.save();
      ctx.globalAlpha = outExpo(p) * (1 - exit);
      pool(ctx, n.x, n.y + n.draw.foot * S + drop, n.draw.w * S * 1.5, n.hue);
      n.draw(ctx, t, { x: n.x, y: n.y + drop, s: S * lerp(0.86, 1, outBack(p)) * (1 - 0.05 * exit), rot: n.rot, seed: n.seed });
      ctx.restore();
    }

    // labels: a mono step number over the word, centred under each prop
    for (const n of NODES) {
      const t0 = n.t0 + LABEL_DELAY;
      ctx.save();
      setType(ctx, "h2");
      const m = ctx.measureText(n.text);
      riseIn(ctx, t, { text: n.text, x: n.x - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2, y: LABEL_Y, role: "h2", t0, out: EXIT });
      setType(ctx, "label");
      ctx.fillStyle = T.color.dim; ctx.globalAlpha = win(t, t0, t0 + 0.25) * (1 - exit);
      ctx.fillText(n.tag, n.x - ctx.measureText(n.tag).width / 2, LABEL_Y - T.size.h2 * 0.74 - 24);
      ctx.restore();
    }

    // the pulse, on top
    ctx.save(); ctx.globalAlpha = 1 - exit;
    for (const [a, b, i] of PULSES) pulseAlong(ctx, LINES[i].pts, win(t, a, b));
    ctx.restore();

  },
};

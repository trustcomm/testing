import { tokens as T } from "../tokens.js";
import { win, spring } from "../engine/ease.js";
import { replay } from "../engine/sim.js";

const G = 2600, FLOOR = 800, R = 46;
// a bouncing ball is state, not a formula: step it at 1/120 s from zero and cache by step index
const ball = replay({ y: 220, v: 0 }, (s, dt) => {
  const v = s.v + G * dt, y = s.y + v * dt;
  return y > FLOOR ? { y: FLOOR, v: -v * 0.74 } : { y, v };
});

export const s02 = {
  start: 3, dur: 3,
  draw(g, t, dur) {
    const fade = win(t, 0, 0.3) * (1 - win(t, dur - 0.4, dur));
    const x = 560 + 800 * win(t, 0, dur), y = ball(t).y, h = (FLOOR - y) / 600;
    g.globalAlpha = fade * 0.5; g.strokeStyle = T.color.dim; g.lineWidth = 2;
    g.beginPath(); g.moveTo(300, FLOOR + R); g.lineTo(1620, FLOOR + R); g.stroke();
    g.fillStyle = T.color.fg; g.globalAlpha = fade * 0.35 * (1 - h * 0.8);
    g.beginPath(); g.ellipse(x, FLOOR + R, R * (1.4 - 0.6 * h), 9, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = fade; g.fillStyle = T.color.ice;
    g.beginPath(); g.arc(x, y, R * spring(win(t, 0, 0.9), 10, 0.5), 0, Math.PI * 2); g.fill();
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = T.color.fg;
    g.font = T.font(72); g.fillText(`scene t = ${t.toFixed(2)} s`, 960, 950);
    g.fillStyle = T.color.dim; g.font = T.font(34);
    g.fillText("simulated at 1/120 s, replayed from zero", 960, 1015);
  },
};

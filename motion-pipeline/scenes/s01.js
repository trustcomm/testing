import { tokens as T } from "../tokens.js";
import { win, outCubic, outExpo, inOutQuint } from "../engine/ease.js";
import { hash } from "../engine/rng.js";

export const s01 = {
  start: 0, dur: 3,
  draw(g, t, dur) {
    const fade = win(t, 0, 0.3) * (1 - win(t, dur - 0.4, dur));
    // dust: each dot's path comes from hash(i), so frame 90 never depends on frame 89
    g.fillStyle = T.color.fg;
    for (let i = 0; i < 70; i++) {
      const speed = 30 + hash(i, 2) * 90;
      const y = (((hash(i, 4) * T.H - speed * t) % T.H) + T.H) % T.H;
      g.globalAlpha = fade * (0.15 + hash(i, 5) * 0.35);
      g.beginPath(); g.arc(hash(i, 1) * T.W, y, 1 + hash(i, 3) * 2.5, 0, Math.PI * 2); g.fill();
    }
    g.textAlign = "center"; g.textBaseline = "middle";
    const a = outCubic(win(t, 0.2, 0.9));
    g.globalAlpha = fade * a; g.fillStyle = T.color.fg; g.font = T.font(150);
    g.fillText("renderFrame(t)", 960, 500 + (1 - a) * 60);
    const b = outExpo(win(t, 0.7, 1.4));
    g.globalAlpha = fade * b; g.fillStyle = T.color.dim; g.font = T.font(48);
    g.fillText("every pixel is a function of time", 960, 640 + (1 - b) * 30);
    const w = 560 * inOutQuint(win(t, 1.1, 1.9));
    g.globalAlpha = fade; g.fillStyle = T.color.accent;
    g.fillRect(960 - w / 2, 720, w, 6);
  },
};

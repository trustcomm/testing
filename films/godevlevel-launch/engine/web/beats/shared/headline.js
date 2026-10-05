// Beat 4's two-line headline, shared with Beat 5 (which wipes it away with the lifting underline).
import { FONT } from "../../core/brand.js";
import { prog, snap } from "../../core/ease.js";
import { text, wordOffsets } from "../../core/text.js";

export const LINES = [
  ["Your", "launches", "move", "fast."],
  ["Your", "videos", "should", "too."],
];
const MAX_SIZE = 140;
const WEIGHT = 800;

/** Size and baselines, fitted so the wider line spans the underline exactly. */
export function layout(ctx, underline) {
  const probe = LINES.map((l) => wordOffsets(ctx, l, FONT.display, WEIGHT, 100));
  const widest = Math.max(...probe.map((p) => p.width));
  const size = Math.min(MAX_SIZE, (100 * underline.w) / widest);
  const lines = LINES.map((l) => wordOffsets(ctx, l, FONT.display, WEIGHT, size));
  const base2 = underline.y - 0.3 * size;
  const base1 = base2 - 1.06 * size;
  return { size, lines, baselines: [base1, base2], top: base1 - 0.78 * size, x: underline.x };
}

/** Word i of line j appears at the VO word's estimated onset (film time) minus a short lead. */
export function wordTimes(vo) {
  const ws = vo.words;
  return [ws.slice(0, 4).map((w) => w.t), ws.slice(4, 8).map((w) => w.t)];
}

/**
 * Draw the headline. t = film time. Words rise in from below their baseline;
 * everything is clipped above `clipY` (the underline's top edge).
 */
export function drawHeadline(ctx, L, times, t, clipY, zoom) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(-10000, -10000, 20000, clipY + 10000);
  ctx.clip();
  LINES.forEach((words, j) => {
    words.forEach((w, i) => {
      const p = snap(prog(t, times[j][i] - 0.04, times[j][i] + 0.16));
      if (p <= 0) return;
      const rise = (1 - p) * 0.55 * L.size;
      text(ctx, w, L.x + L.lines[j].x[i], L.baselines[j] + rise, { family: FONT.display, weight: WEIGHT, size: L.size, fill: "ink", alpha: p, zoom });
    });
  });
  ctx.restore();
}

/** Every word's current position (static words contribute zero speed), in a fixed order for blur tracking. */
export function movingWords(L, times, t) {
  const pts = [];
  LINES.forEach((words, j) =>
    words.forEach((w, i) => {
      const p = prog(t, times[j][i] - 0.04, times[j][i] + 0.16);
      pts.push([L.x + L.lines[j].x[i], L.baselines[j] + (1 - snap(p)) * 0.55 * L.size]);
    }),
  );
  return pts;
}

// On-screen type, drawn in the page on a 2D canvas over the WebGL frame.
import { T } from '../tokens.js';
import { win, outExpo, outCubic } from './ease.js';

const F = (w, px) => `${w} ${px}px "${T.font.mono}"`;
const M = T.motion;

function setFont(ctx, weight, px, trackEm = 0) {
  ctx.font = F(weight, px);
  ctx.letterSpacing = `${trackEm * px}px`;
}

// Dark soft panel behind copy so it keeps ≥ 7:1 contrast over bright dots.
function scrim(ctx, cx, cy, rx, ry, a) {
  if (a <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(rx, ry);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, `rgba(3,4,5,${0.9 * a})`);
  g.addColorStop(0.65, `rgba(3,4,5,${0.78 * a})`);
  g.addColorStop(1, 'rgba(3,4,5,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

// Statement: on screen at t=0 (loop start), exits at 3.4 s, re-enters word by word at 10.9 s.
function statement(ctx, copy, t) {
  const { W, H } = T;
  const OUT = 3.4, IN = 10.9;
  const exitA = 1 - outCubic(win(t, OUT, OUT + M.exit));
  const lines = copy.statement;
  const px = T.size.h1, lh = px * 1.45;
  const y0 = H * 0.47 - lh / 2;
  const scrA = t < IN ? exitA : outCubic(win(t, IN, IN + M.entrance));
  scrim(ctx, W / 2, y0 + lh / 2, W * 0.46, lh * 1.7, scrA);
  setFont(ctx, 400, px);
  ctx.textBaseline = 'middle';
  let wi = 0;
  lines.forEach((line, li) => {
    const words = line.split(' ');
    const sp = ctx.measureText(' ').width;
    const widths = words.map((w) => ctx.measureText(w).width);
    let x = W / 2 - (widths.reduce((a, b) => a + b, 0) + sp * (words.length - 1)) / 2;
    words.forEach((w, k) => {
      let a = 1, dy = 0;
      if (t >= IN) {
        const e = outExpo(win(t, IN + wi * M.wordStagger, IN + wi * M.wordStagger + M.entrance));
        a = e; dy = (1 - e) * 16;
      } else a = exitA;
      ctx.globalAlpha = a;
      ctx.fillStyle = w === 'cosine' ? T.color.accent : T.color.ink;
      ctx.fillText(w, x, y0 + li * lh + dy);
      x += widths[k] + sp;
      wi++;
    });
  });
  ctx.globalAlpha = 1;
}

// Formulas: typed on glyph by glyph from 3.9 s, out at 10.3 s.
function formulas(ctx, copy, t) {
  const { W, H } = T;
  const IN = 3.9, OUT = 10.3;
  if (t < IN || t > OUT + M.exit) return;
  const exitA = 1 - outCubic(win(t, OUT, OUT + M.exit));
  const px = T.size.body, lh = px * 1.5;
  const x0 = W * T.safe.x, y0 = H * T.safe.bottom - lh * 2.6;
  scrim(ctx, W * 0.47, y0 + lh, W * 0.56, lh * 3.0, exitA * outCubic(win(t, IN, IN + M.entrance)));
  setFont(ctx, 400, px);
  ctx.textBaseline = 'middle';
  const cw = ctx.measureText('0').width;    // monospaced: one advance per glyph
  const labelX = x0 + cw * 30.5;
  let g = 0;
  copy.formulas.forEach(([f, label], li) => {
    const y = y0 + li * lh;
    const glyph = (str, x, colour) => {
      for (let i = 0; i < str.length; i++, g++) {
        const s = IN + li * 0.1 + g * 0.012;
        ctx.globalAlpha = outExpo(win(t, s, s + 0.15)) * exitA;
        ctx.fillStyle = colour(i);
        ctx.fillText(str[i], x + i * cw, y);
      }
    };
    const redEnd = f.startsWith('red') ? 3 : 0;
    glyph(f, x0, (i) => (i < redEnd ? T.color.accent : T.color.ink));
    glyph(label, labelX, () => T.color.dim);
  });
  ctx.globalAlpha = 1;
}

export function drawType(ctx, copy, t, count) {
  const { W, H } = T;
  const y = H * T.safe.top;
  ctx.textBaseline = 'middle';
  setFont(ctx, 600, T.size.label, T.track.title);
  ctx.fillStyle = T.color.ink;
  ctx.textAlign = 'left';
  ctx.fillText(copy.title, W * T.safe.x, y);
  setFont(ctx, 400, T.size.label, T.track.label);
  ctx.fillStyle = T.color.dim;
  ctx.textAlign = 'right';
  ctx.fillText(`${count.toLocaleString('en-US')} ${copy.count_label}`, W * (1 - T.safe.x), y);
  ctx.textAlign = 'left';
  ctx.letterSpacing = '0px';
  statement(ctx, copy, t);
  formulas(ctx, copy, t);
}

export function drawGuides(ctx) {
  const { W, H } = T;
  ctx.strokeStyle = 'rgba(0,255,120,0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(W * T.safe.x, H * T.safe.top, W * (1 - 2 * T.safe.x), H * (T.safe.bottom - T.safe.top));
}

// counter-data: ring stroke draws to ~72% while the centre number counts up; label follows; bars rise with a counter.
// counterRing(ctx, t, { cx, cy, r, t0, from = 0, to, frac = 0.72, color, track, width = 0.12*r, font, textColor, suffix = '',
//   label, labelFont, labelColor }) -> value
// bars(ctx, t, { x, y (baseline), w, h, values (0..1), t0, color, gap = 0.3, stagger = 0.06 })
// Numbers: ring ~500 ms ease-out to 70-75%; label +120 ms, 120 ms fade (r04); counter roll 800 ms
// cubic-bezier(0.21,0.65,0.24,0.90) (r09); bars 800 ms same curve. Use a tick BED for the sound, not one tick per digit.
// Source: techniques/counter-data.md
import { seg } from '../core.js';
import { rrect } from '../draw.js';
import { ez } from './tokens.js';

const ROLL = [0.21, 0.65, 0.24, 0.9];   // r09 counter/bars curve

export function counterRing(ctx, t, o) {
  const { cx, cy, r, t0, from = 0, to, frac = 0.72, color, track, font, textColor, suffix = '', label, labelFont, labelColor } = o;
  const width = o.width ?? r * 0.12, pr = seg(t, t0, 0.5, ez('out_settle')), pc = seg(t, t0, 0.8, ROLL);
  const A = ctx.globalAlpha; ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = width;
  if (track) { ctx.strokeStyle = track; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
  if (pr > 0.001) { ctx.strokeStyle = color; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac * pr); ctx.stroke(); }
  const value = Math.round(from + (to - from) * pc);
  ctx.font = font; ctx.fillStyle = textColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.globalAlpha = A * Math.min(1, pc * 4); ctx.fillText(value + suffix, cx, cy);
  if (label) { ctx.globalAlpha = A * seg(t, t0 + 0.5 + 0.12, 0.12, 'linear'); ctx.font = labelFont; ctx.fillStyle = labelColor; ctx.fillText(label, cx, cy + r + width + parseFloat(labelFont.match(/(\d+)px/)[1]) * 0.9); }
  ctx.restore();
  return value;
}

export function bars(ctx, t, { x, y, w, h, values, t0, color, gap = 0.3, stagger = 0.06 }) {
  const bw = w / (values.length + (values.length - 1) * gap);
  values.forEach((v, i) => {
    const p = seg(t, t0 + i * stagger, 0.8, ROLL), bh = h * v * p;
    if (bh > 0.5) { ctx.fillStyle = color; rrect(ctx, x + i * bw * (1 + gap), y - bh, bw, bh, Math.min(bw * 0.2, bh / 2)); ctx.fill(); }
  });
}

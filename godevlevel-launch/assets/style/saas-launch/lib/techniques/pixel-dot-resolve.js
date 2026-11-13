// pixel-dot-resolve: the "AI is generating" beat without a spinner. UI collapses to one accent dot, holds (the breath),
// the dot multiplies into a grid that fills the result area, and the grid resolves into the result.
// dotTimes(t0) -> { tHold, tGrid, tResolve, tDone }   (pure, for cue sheets)
// pixelDotResolve(ctx, t, { t0, from: {x,y,w,h,r,color}, target: {x,y,w,h}, drawTarget(ctx, w, h), key, color, cols = 44 })
//   from = the UI box that collapses (e.g. the prompt bar); drawTarget draws the result at (0,0,w,h) and is sampled once
//   per `key`. After tDone draw the live result yourself (the crisp target is drawn here until then).
// Numbers: collapse 433 ms cubic-bezier(0.74,0.24,0.57,1.03), hold 400, grid fill 600 ease-in cubic-bezier(1,-0.01,0.91,0.9),
// resolve 433 near-linear (r10); 40-55 columns (r06). Use once per video. Source: techniques/pixel-dot-resolve.md
import { seg, clamp, hash, lerp } from '../core.js';
import { rrect, morphBox } from '../draw.js';
import { mixColor } from './tokens.js';

const COLLAPSE = [0.74, 0.24, 0.57, 1.03], FILL = [1, -0.01, 0.91, 0.9];
export const dotTimes = t0 => ({ tHold: t0 + 0.433, tGrid: t0 + 0.833, tResolve: t0 + 1.433, tDone: t0 + 1.866 });

const cache = new Map();
function sample(key, target, drawTarget, cols) {
  if (cache.has(key)) return cache.get(key);
  const full = new OffscreenCanvas(Math.round(target.w), Math.round(target.h)); drawTarget(full.getContext('2d'), full.width, full.height);
  const rows = Math.max(1, Math.round(cols * target.h / target.w)), small = new OffscreenCanvas(cols, rows), s = small.getContext('2d');
  s.drawImage(full, 0, 0, cols, rows); const d = s.getImageData(0, 0, cols, rows).data;
  const v = { full, rows, px: Array.from({ length: cols * rows }, (_, i) => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]) };
  cache.set(key, v); return v;
}

export function pixelDotResolve(ctx, t, { t0, from, target, drawTarget, key = 'target', color, cols = 44 }) {
  const T = dotTimes(t0), cx = target.x + target.w / 2, cy = target.y + target.h / 2, cs = target.w / cols, dotR = cs * 0.9;
  if (t < t0 || t >= T.tDone) return T;
  if (t < T.tGrid) {   // collapse to one dot, then breathe
    const p = seg(t, t0, 0.433, COLLAPSE), b = morphBox(from, { x: cx - dotR, y: cy - dotR, w: 2 * dotR, h: 2 * dotR, r: dotR }, p);
    const k = t > T.tHold ? 1 + 0.12 * Math.sin((t - T.tHold) / 0.4 * Math.PI) : 1;
    ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(k, k);
    ctx.fillStyle = mixColor(from.color, color, clamp(p)); rrect(ctx, -b.w / 2, -b.h / 2, b.w, b.h, b.r); ctx.fill(); ctx.restore();
    return T;
  }
  const S = sample(key, target, drawTarget, cols), fill = seg(t, T.tGrid, 0.6, FILL), ru = (t - T.tResolve) / 0.433;
  const maxD = Math.hypot(target.w, target.h) / 2;
  for (let j = 0; j < S.rows; j++) for (let i = 0; i < cols; i++) {
    const x = target.x + (i + 0.5) * cs, y = target.y + (j + 0.5) * cs, d = Math.hypot(x - cx, y - cy) / maxD;
    const app = clamp((fill * 1.15 - d) / 0.15);   // ring of dots spreads out from the centre dot
    if (app <= 0) continue;
    const n = j * cols + i, q = clamp((ru - 0.55 * Math.pow(hash(n), 0.5)) / 0.45);   // per-cell resolve, back-loaded
    const sz = lerp(cs * 0.55 * app, cs * 1.02, q), r = lerp(sz / 2, 0, q);
    ctx.fillStyle = mixColor(color, S.px[n], q); rrect(ctx, x - sz / 2, y - sz / 2, sz, sz, r); ctx.fill();
  }
  if (ru > 0.75) { ctx.save(); ctx.globalAlpha *= clamp((ru - 0.75) / 0.25); ctx.drawImage(S.full, target.x, target.y, target.w, target.h); ctx.restore(); }
  return T;
}

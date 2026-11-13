// accent-flood: the accent colour takes the whole frame almost instantly, then settles (chapter change / world switch).
// accentFlood(ctx, t, { W, H, t0, color, bg, dur = 0.4, mode = 'radial' | 'alpha', cx, cy, tint = true, tintDur = 0.1 }) -> p
//   'radial' grows a disc from (cx, cy); 'alpha' is the doc's plain fill. With tint, a 50% bg/accent mix shows first for
//   tintDur (bright looks: 40-250 ms, r16). Draw the new scene on top once p >= 1.
// Numbers: r13 400 ms, 67% in the first 40 ms ('flood' easing). Max ~1 flood per 6-8 s. Source: techniques/accent-flood.md
import { seg, clamp } from '../core.js';
import { ez, mixColor } from './tokens.js';

export function accentFlood(ctx, t, { W, H, t0, color, bg, dur = 0.4, mode = 'radial', cx = W / 2, cy = H / 2, tint = true, tintDur = 0.1 }) {
  if (t < t0) return 0;
  const tStart = tint ? t0 + tintDur : t0;
  if (t < tStart) { ctx.fillStyle = mixColor(bg, color, 0.5); ctx.fillRect(0, 0, W, H); return 0; }
  const p = seg(t, tStart, dur, ez('flood'));
  ctx.save(); ctx.fillStyle = color;
  if (mode === 'alpha') { ctx.globalAlpha = clamp(p); ctx.fillRect(0, 0, W, H); }
  else { const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)); ctx.beginPath(); ctx.arc(cx, cy, Math.max(0, R * p), 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  return p;
}

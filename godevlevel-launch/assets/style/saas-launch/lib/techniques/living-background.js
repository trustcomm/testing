// living-background: slow drifting blurred blobs + faint grain behind everything, so no frame is ever fully still.
// livingBackground(ctx, t, { W, H, bg, blobs: [colours], cover = 0.32, drift = 6 px/s, opacity = 0.5, grain = 0.03, fps = 30 })
// Numbers: blob drift ~6 px/s (r02), blobs cover 25-40% of frame (r13). Source: techniques/living-background.md
import { noise1 } from '../core.js';
import { radialGrad, grain as grainFx } from '../draw.js';
import { alpha } from './tokens.js';

export function livingBackground(ctx, t, { W, H, bg, blobs = [], cover = 0.32, drift = 6, opacity = 0.5, grain = 0.03, fps = 30 }) {
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const R = Math.sqrt(cover * W * H / Math.PI);   // radius so one blob covers `cover` of the frame
  blobs.forEach((c, i) => {
    // home positions spread on a diagonal; noise drift with amplitude so speed stays ~drift px/s
    const hx = W * (0.2 + 0.6 * ((i * 0.618) % 1)), hy = H * (0.25 + 0.5 * ((i * 0.382 + 0.3) % 1));
    const x = hx + noise1(t * drift / 120 + i * 7.1) * 120, y = hy + noise1(t * drift / 120 + i * 3.3 + 50) * 120;
    ctx.fillStyle = radialGrad(ctx, x, y, R, [[0, alpha(c, opacity)], [0.55, alpha(c, opacity * 0.35)], [1, alpha(c, 0)]]);
    ctx.fillRect(0, 0, W, H);
  });
  if (grain > 0) grainFx(ctx, W, H, Math.round(t * fps), grain, 3);
}

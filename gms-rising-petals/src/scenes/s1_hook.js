// 0–4.6 s · "Every big dream… begins as a tiny seed." Focus pull onto the sprout, crane up, dew glints;
// a glowing petal is born at the sprout tip (overlay) and the camera whips up into the garden.
import {W, H, C, B, P, IMG, initKit, cover, sticker, sparkle, finish, clamp, lerp} from '../kit.js';
export const init = initKit;
export function draw(ctx, _t, {t: T}) {
  const crane = P(T, 0, 3.2, 'soft'), whip = P(T, 3.62, 0.55, 'whip');
  ctx.save(); ctx.translate(0, whip * 1500);
  cover(ctx, IMG.sprout, {s: lerp(1.32, 1.08, crane) + 0.02 * P(T, 2.6, 1.0, 'out'), fy: 760, py: lerp(-300, 0, crane), blur: lerp(9, 0, P(T, 0.05, 1.1, 'soft')) + whip * 24});
  // morning light leak sweeping across the top right
  const lx = lerp(1100, 760, crane), lg = ctx.createRadialGradient(lx, 160, 0, lx, 160, 900);
  lg.addColorStop(0, 'rgba(255,236,170,0.55)'); lg.addColorStop(0.4, 'rgba(255,200,120,0.18)'); lg.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H); ctx.restore();
  // dew glints on the leaves
  [[300, 690, 1.45], [770, 640, 1.95], [560, 760, 2.5], [860, 720, 3.0], [230, 640, 3.3]].forEach(([x, y, t0]) => {
    const g = clamp(1 - Math.abs(T - t0 - 0.18) / 0.22); sparkle(ctx, x, y + lerp(300, 0, crane) * 0.2, 30 * g, g);
  });
  // seed glow at the soil on "tiny seed"
  const sg = P(T, B.tiny, 0.5, 'out') * (1 - P(T, 3.5, 0.3, 'in'));
  if (sg > 0) { const g = ctx.createRadialGradient(540, 1180, 0, 540, 1180, 220); g.addColorStop(0, `rgba(255,220,120,${0.55 * sg})`); g.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = g; ctx.fillRect(300, 950, 480, 460); }
  sticker(ctx, T, ['Every big dream…'], {y: 360, size: 104, times: [B.every + 0.04, B.every + 0.4, B.dream]});
  sticker(ctx, T, ['begins as a', 'tiny seed.'], {y: 1300, size: 108, lh: 1.1, times: [B.begins, 1.94, 2.42, B.tiny, B.seed], accent: {3: C.yellow, 4: C.yellow}});
  finish(ctx, T, {grain: 0.025, vignette: 0.3});
  ctx.restore();
}

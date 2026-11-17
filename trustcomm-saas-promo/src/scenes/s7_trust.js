// 30.5–34.6 s · "Na fake reviews. Sirf aapke asli customers." Clean type, then the real customers rise and smile.
import {W, H, C, F, B, P, IMG, initKit, stage, words, sprite, tick, finish, clamp, lerp} from '../kit.js';
export const init = initKit;
export function draw(ctx, _t, {t: T}) {
  const enter = P(T, 30.55, 0.55, 'camera'), out = P(T, 34.05, 0.5, 'camera');
  ctx.save(); ctx.translate(0, (1 - enter) * 1920 - out * 1920);
  stage(ctx, T);
  words(ctx, T, ['Na fake reviews.'], {y: 470, size: 104, times: [B.fake - 0.05, 31.02, 31.38]});
  words(ctx, T, ['Sirf aapke', 'asli customers.'], {y: 650, size: 104, times: [B.sirf, 32.5, B.asli, 33.4], accent: {2: C.blue}});
  const k = P(T, B.asli - 0.1, 0.7, 'pop');
  sprite(ctx, IMG.customers_smiling, 540, lerp(1900, 1180, k), 1000, {a: clamp(k * 2)});
  finish(ctx, T);
  ctx.restore();
}

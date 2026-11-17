// 10.9–13.4 s · "Isliye — Trustcomm." The 1-star card collapses into a blue dot; the dot opens into the wordmark;
// the "m" trails the blue line down, and the camera follows it.
import {W, H, C, F, B, P, IMG, initKit, stage, rr, dot, wordmark, finish, clamp, lerp, mixHex} from '../kit.js';
import {STAR_CARD} from './s2_pain.js';
export const init = initKit;
export function draw(ctx, _t, {t: T}) {
  const bg = P(T, 10.95, 0.4, 'out'), down = P(T, 12.95, 0.6, 'camera');
  ctx.save(); ctx.globalAlpha *= bg; ctx.translate(0, -down * 1920);
  stage(ctx, T);
  const c = P(T, 10.95, 0.5, 'morph'), r = STAR_CARD(T), mark = P(T, B.trustcomm - 0.05, 0.6, 'out');
  if (mark < 0.6) { // card → dot
    const w = lerp(r.w, 44, c), h = lerp(r.h, 44, c), cx = lerp(r.x, 540, c), cy = lerp(r.y, 900, c), pulse = 1 + 0.12 * Math.sin(Math.max(0, T - 11.4) * 9) * (T < B.trustcomm ? 1 : 0);
    ctx.save(); ctx.globalAlpha *= 1 - clamp((mark - 0.3) / 0.3); ctx.translate(cx, cy); ctx.scale(pulse, pulse); ctx.shadowColor = 'rgba(31,94,255,0.5)'; ctx.shadowBlur = 40 * c;
    rr(ctx, -w / 2, -h / 2, w, h, lerp(36, 22, c)); ctx.fillStyle = mixHex('#ffffff', C.blue, c); ctx.fill(); ctx.restore();
  }
  const tail = P(T, 12.55, 0.7, 'inOut');
  if (mark > 0) wordmark(ctx, 540, 960, 170, {reveal: mark, tail, tailLen: 1100});
  finish(ctx, T);
  ctx.restore();
}

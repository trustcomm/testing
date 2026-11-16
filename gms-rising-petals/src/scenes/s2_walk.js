// 3.6–8.6 s · "Your child's first school is where that seed begins to grow."
// Whip down into the garden path; the children walk to school hand in hand; push through to the gate.
import {W, H, C, B, P, IMG, initKit, cover, sprite, sticker, drift, finish, clamp, lerp} from '../kit.js';
export const init = initKit;
export function draw(ctx, _t, {t: T}) {
  const enter = P(T, 3.62, 0.62, 'whip'), sw = P(T, 5.72, 0.6, 'inOut'), out = P(T, 7.8, 0.6, 'in');
  ctx.save(); ctx.translate(0, (1 - enter) * -1500);
  ctx.translate(540, 820); ctx.scale(1 + out * 0.9, 1 + out * 0.9); ctx.translate(-540, -820);
  const blur = (1 - enter) * 26;
  // path, slow push, then a push-through into the gate
  if (sw < 1) cover(ctx, IMG.path, {s: lerp(1.0, 1.14, P(T, 3.9, 2.2, 'soft')) + sw * 0.7, fx: 560, fy: 1050, blur: blur + sw * 10, a: 1});
  if (sw > 0) cover(ctx, IMG.gate, {s: lerp(1.28, 1.0, sw) + 0.05 * P(T, 6.3, 1.6, 'soft'), fx: 540, fy: 820, a: sw, blur: (1 - sw) * 8});
  // the children: walk up the path, then on toward the gate
  const step = Math.abs(Math.sin(T * Math.PI * 1.9)), bob = -step * 12, rot = Math.sin(T * Math.PI * 1.9) * 0.022;
  const w1 = P(T, 3.9, 2.0, 'soft'), w2 = P(T, 6.0, 1.9, 'soft');
  let kx = 540, ky = lerp(1830, 1440, w1), kh = lerp(1160, 700, w1);
  if (sw > 0) { ky = lerp(ky, lerp(1560, 1250, w2), sw); kh = lerp(kh, lerp(640, 360, w2), sw); }
  sprite(ctx, IMG.walk, kx, ky + bob, kh, {rot, shadow: 0.3, blur});
  drift(ctx, T, {n: 9, seed: 4, a: 0.9, speed: 0.8});
  sticker(ctx, T, ["Your child's", 'first school'], {y: 340, size: 100, lh: 1.08, times: [B.your, 4.16, 4.66, B.school], accent: {3: C.yellow}, out: 5.22});
  sticker(ctx, T, ['is where that seed', 'begins to grow.'], {y: 340, size: 92, lh: 1.12, times: [5.34, B.where, 5.84, 6.04, B.begins2, 6.9, B.grow], accent: {3: C.yellow, 6: C.yellow}, out: 7.72});
  finish(ctx, T, {grain: 0.025, vignette: 0.24});
  ctx.restore();
}

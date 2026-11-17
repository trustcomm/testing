// 12.9–15.2 s · "Counter pe ek QR code." The line leads down to Meera's counter; an acrylic stand rises; the QR draws on.
import {W, H, C, F, B, P, IMG, initKit, cover, sprite, words, text, qr, wordmark, drawPath, finish, clamp, lerp} from '../kit.js';
export const init = initKit;
export const STAND = {x: 740, base: 1440, w: 330};
export const CAM = (T) => { const z = P(T, 13.2, 1.6, 'camera'); return {s: lerp(1.0, 1.75, z), fx: STAND.x, fy: 1250}; };
export function standFace(ctx, x0, y0, w, h, T) { // card content, in frame px
  const cx = x0 + w / 2; ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, y0, w, h);
  text(ctx, "Meera's Tiffin Room", cx, y0 + h * 0.12, w * 0.085, {weight: 700, fam: F.ui, align: 'center'});
  text(ctx, 'Rate your visit', cx, y0 + h * 0.19, w * 0.06, {weight: 500, fam: F.ui, color: C.muted, align: 'center'});
  const q = w * 0.7; qr(ctx, cx - q / 2, y0 + h * 0.25, q, P(T, B.qr - 0.1, 0.6, 'out'));
  wordmark(ctx, cx, y0 + h * 0.92, w * 0.11, {});
}
export function drawStand(ctx, T, rise = 1) {
  const img = IMG.qr_stand, h = img.height * STAND.w / img.width, x0 = STAND.x - STAND.w / 2, y0 = STAND.base - h + (1 - rise) * 260;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, STAND.base + 4); ctx.clip();
  const k = STAND.w / img.width; standFace(ctx, x0 + 70 * k, y0 + 60 * k, 825 * k, 1010 * k, T);
  ctx.drawImage(img, x0, y0, STAND.w, h); ctx.restore();
}
export function draw(ctx, _t, {t: T}) {
  const up = P(T, 12.95, 0.6, 'camera'), cam = CAM(T);
  ctx.save(); ctx.translate(0, (1 - up) * 1920);
  ctx.save(); ctx.translate(cam.fx, cam.fy); ctx.scale(cam.s, cam.s); ctx.translate(-cam.fx, -cam.fy);
  cover(ctx, IMG.counter_plate, {fy: 1100, blur: P(T, 14.6, 0.5, 'out') * 8});
  // the blue line arrives from above and lands where the stand rises
  drawPath(ctx, [[540, -200], [540, 600], [STAND.x, 1000], [STAND.x, 1180]], clamp((T - 12.9) / 0.5), {lw: 12});
  drawStand(ctx, T, P(T, B.counter - 0.05, 0.6, 'pop'));
  ctx.restore();
  const ha = P(T, B.counter - 0.1, 0.3, 'out') * (1 - P(T, 14.4, 0.3, 'in')); if (ha > 0) { ctx.save(); ctx.globalAlpha *= ha; ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.shadowColor = 'rgba(18,21,28,0.1)'; ctx.shadowBlur = 50; ctx.beginPath(); ctx.roundRect(110, 270, 860, 300, 44); ctx.fill(); ctx.restore(); }
  words(ctx, T, ['Counter pe', 'ek QR code.'], {y: 400, size: 96, times: [B.counter, 13.18, 13.42, B.qr, 14.02], accent: {3: C.blue}, out: 14.62});
  finish(ctx, T);
  ctx.restore();
}

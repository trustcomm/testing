// 14.5–22.9 s · "Customer scan karta hai — na app, na sign-in. Apni bhasha mein — Kannada, Tamil, Telugu, Hindi…
// Phir unke taps se…" A hand brings a phone over the stand; the blue scan line sweeps; the real customer page opens.
// Stars fill, the language row switches with each spoken language, chips tick and the dishes pop out as food stickers.
import {W, H, C, F, B, P, env, IMG, initKit, cover, sprite, pill, text, tick, tap, phoneWithPage, qr, finish, clamp, lerp, rgba} from '../kit.js';
import {CAM, drawStand, STAND} from './s4_qr.js';
export const init = initKit;
const PH = {key: 'hand_phone_scan', cx: 545, w: 1050};
function langAt(T) {
  const seq = [[0, 'English'], [B.kannada - 0.05, 'ಕನ್ನಡ'], [B.tamil - 0.05, 'தமிழ்'], [B.telugu - 0.05, 'తెలుగు'], [B.hindi - 0.05, 'हिन्दी'], [21.2, 'Hinglish']];
  let i = 0; seq.forEach(([t], k) => { if (T >= t) i = k; });
  return {lang: seq[i][1], prevLang: i ? seq[i - 1][1] : null, langP: i ? P(T, seq[i][0], 0.28, 'out') : 1};
}
export function draw(ctx, _t, {t: T}) {
  const rise = P(T, 14.55, 0.6, 'out'), out = P(T, 22.45, 0.5, 'in');
  // background: the zoomed counter, now soft
  const cam = CAM(15.2);
  ctx.save(); ctx.translate(cam.fx, cam.fy); ctx.scale(cam.s, cam.s); ctx.translate(-cam.fx, -cam.fy);
  cover(ctx, IMG.counter_plate, {fy: 1100, blur: 8}); drawStand(ctx, T, 1); ctx.restore();
  ctx.fillStyle = `rgba(250,249,246,${0.35 + 0.3 * P(T, 15.5, 0.5, 'out')})`; ctx.fillRect(0, 0, W, H);
  // phone
  const cy = lerp(2300, 1180, rise) - out * 1500, page = P(T, 15.5, 0.35, 'out');
  const st = {...langAt(T), food: clamp((T - 16.15) / 0.42) * 5, service: clamp((T - 16.85) / 0.36) * 4,
    chips: [[0, B.taps - 0.2], [4, B.taps - 0.05]].filter(([, t]) => T >= t).map(([i]) => i), dishes: [[0, B.taps + 0.12], [1, B.taps + 0.28]].filter(([, t]) => T >= t).map(([i]) => i)};
  const scr = phoneWithPage(ctx, T, {...PH, cy}, st, page < 1 ? {under: (c, x, y, w, h) => {
      // camera view of the QR with the blue scan line
      c.fillStyle = '#20252e'; c.fillRect(x, y, w, h); const q = w * 0.62, qx = x + (w - q) / 2, qy = y + h * 0.3;
      c.fillStyle = '#fff'; c.fillRect(qx - 30, qy - 30, q + 60, q + 60); qr(c, qx, qy, q, 1);
      c.strokeStyle = '#fff'; c.lineWidth = 8; c.lineCap = 'round'; const m = 60; [[qx - 40, qy - 40, 1, 1], [qx + q + 40, qy - 40, -1, 1], [qx - 40, qy + q + 40, 1, -1], [qx + q + 40, qy + q + 40, -1, -1]].forEach(([a, b, dx, dy]) => { c.beginPath(); c.moveTo(a, b + dy * m); c.lineTo(a, b); c.lineTo(a + dx * m, b); c.stroke(); });
      const sy = qy - 30 + (q + 60) * P(T, 15.0, 0.5, 'inOut'); c.fillStyle = C.blue; c.shadowColor = C.blue; c.shadowBlur = 24; c.fillRect(qx - 30, sy, q + 60, 8); c.shadowBlur = 0;
      if (page > 0) { c.globalAlpha = page; c.fillStyle = C.stage; c.fillRect(x, y, w, h); }
    }} : {});
  // taps on the stars (in frame px)
  const u = scr.sw / 390, px = (x) => scr.sx + x * u, py = (y) => scr.sy + scr.sh * 0.035 + y * u;
  [[16.15, 304], [16.85, 241]].forEach(([t0, sx], k) => tap(ctx, px(sx), py(k ? 340 : 236), T, t0 + 0.38, {r: 34}));
  // pills above: no app / no sign-in, then the language being spoken
  const pa = 1 - P(T, 17.6, 0.25, 'in');
  pill(ctx, 'Na app', 360, 330, {size: 40, a: P(T, B.na_app, 0.25, 'out') * pa, s: 0.7 + 0.3 * P(T, B.na_app, 0.5, 'pop'), weight: 700, fam: F.head, icon: (c, x, y) => tick(c, x, y, 13, 1, C.blue, 5), iconW: 40});
  pill(ctx, 'Na sign-in', 720, 330, {size: 40, a: P(T, B.signin, 0.25, 'out') * pa, s: 0.7 + 0.3 * P(T, B.signin, 0.5, 'pop'), weight: 700, fam: F.head, icon: (c, x, y) => tick(c, x, y, 13, 1, C.blue, 5), iconW: 40});
  const L = [['Apni bhasha mein', B.apni, B.kannada - 0.05], ['ಕನ್ನಡ', B.kannada, B.tamil - 0.05], ['தமிழ்', B.tamil, B.telugu - 0.05], ['తెలుగు', B.telugu, B.hindi - 0.05], ['हिन्दी', B.hindi, 21.15], ['+ English · Hinglish', 21.15, 22.4]];
  L.forEach(([s, t0, t1], i) => { const a = env(T, t0, t1 + 0.12, 0.18, 0.12); if (a > 0) pill(ctx, s, 540, 330, {size: i && i < 5 ? 52 : 42, a, s: 0.85 + 0.15 * P(T, t0, 0.4, 'pop'), fill: i && i < 5 ? C.blue : C.white, color: i && i < 5 ? '#fff' : C.ink, stroke: i && i < 5 ? null : undefined, weight: 700, fam: i && i < 5 ? undefined : F.head}); });
  // dishes pop out as food stickers
  [[IMG.food_dosa, 205, B.taps + 0.12, -0.12, 330], [IMG.food_coffee, 890, B.taps + 0.28, 0.1, 230]].forEach(([img, x, t0, rot, w]) => {
    const p = P(T, t0, 0.55, 'spring'); if (p > 0) sprite(ctx, img, x, lerp(1300, 1180, p) - out * 1500, w * p, {rot: rot * p, a: clamp(p * 2)});
  });
  finish(ctx, T);
}

// 5.6–11.5 s · "Khush customers… chup-chaap chale jaate hain. Bolta sirf woh hai, jo naraaz hai."
// The shop rises into view; a happy family walks away quietly; one red 1-star card slides in, loud and alone.
import {W, H, C, F, B, P, env, IMG, initKit, cover, sprite, card, rr, words, text, star, finish, clamp, lerp, rgba} from '../kit.js';
export const init = initKit;
export const STAR_CARD = (T) => ({x: 540, y: 1060, w: 840, h: 330});
export function draw(ctx, _t, {t: T}) {
  const enter = P(T, 5.62, 0.62, 'camera'), out = P(T, 10.95, 0.4, 'in');
  ctx.save(); ctx.translate(0, (1 - enter) * 1920);
  cover(ctx, IMG.counter_plate, {s: 1.06 + 0.04 * P(T, 5.8, 5, 'out'), fy: 1100, blur: 5 + 4 * P(T, 8.4, 0.6, 'out')});
  ctx.fillStyle = `rgba(250,249,246,${0.16 + 0.3 * P(T, 8.4, 0.6, 'out') + 0.5 * out})`; ctx.fillRect(0, 0, W, H);
  // the family walks away into the shop
  // daylight from the doorway on the left, where the family leaves
  const door = P(T, 5.7, 0.8, 'out');
  if (door > 0) { // an open doorway on the left wall: bright daylight, light spill on the floor
    ctx.save(); ctx.globalAlpha *= door; const dx = -30, dy = 470, dw = 250, dh = 800;
    ctx.shadowColor = 'rgba(255,244,210,1)'; ctx.shadowBlur = 160; const g = ctx.createLinearGradient(0, dy, 0, dy + dh); g.addColorStop(0, '#fffdf6'); g.addColorStop(1, '#fff1cf');
    rr(ctx, dx, dy, dw, dh, 26); ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(110,62,26,0.9)'; ctx.lineWidth = 22; rr(ctx, dx, dy, dw, dh, 26); ctx.stroke();
    const sp = ctx.createLinearGradient(0, dy + dh, 520, dy + dh + 300); sp.addColorStop(0, 'rgba(255,240,205,0.75)'); sp.addColorStop(1, 'rgba(255,240,205,0)');
    ctx.fillStyle = sp; ctx.beginPath(); ctx.moveTo(dx, dy + dh); ctx.lineTo(dx + dw, dy + dh); ctx.lineTo(620, H); ctx.lineTo(-60, H); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // the family walks out toward the light, getting smaller, then fades into it
  const w = P(T, 5.9, 2.4, 'inOut'), step = Math.abs(Math.sin(T * Math.PI * 1.8)), gone = P(T, 7.75, 0.6, 'in');
  sprite(ctx, IMG.customers_leaving, lerp(640, 110, w), lerp(1400, 1095, w) - step * 10, lerp(760, 330, w), {a: (1 - gone) * clamp((T - 5.7) / 0.2), rot: -0.04 * w + Math.sin(T * Math.PI * 1.8) * 0.01, blur: gone * 6});
  // headline on a frosted card
  const ha = P(T, 5.4, 0.3, 'out') * (1 - out);
  if (ha > 0) { ctx.save(); ctx.globalAlpha *= ha; ctx.filter = 'blur(0px)'; card(ctx, 70, 270, 940, 300, 44, {fill: 'rgba(255,255,255,0.86)', stroke: null, shadow: 0.08}); ctx.restore(); }
  words(ctx, T, ['Khush customers…', 'chup-chaap chale jaate.'], {y: 400, size: 70, times: [B.khush, 5.78, B.chup, 7.44, 7.64], accent: {2: C.muted}, out: 8.36});
  words(ctx, T, ['Bolta sirf woh hai,', 'jo naraaz hai.'], {y: 400, size: 74, times: [B.bolta, 8.96, 9.28, 9.46, 9.98, B.naraaz, 10.62], accent: {5: C.red}, out: 10.9});
  // the loud 1-star card
  const sc = P(T, 8.55, 0.55, 'pop'), shake = T > B.naraaz ? Math.sin((T - B.naraaz) * 40) * 14 * Math.exp(-(T - B.naraaz) * 6) : 0;
  if (sc > 0 && out < 1) {
    const r = STAR_CARD(T); ctx.save(); ctx.translate(r.x + (1 - sc) * 700 + shake, r.y); ctx.rotate(-0.02); ctx.globalAlpha *= 1 - out;
    card(ctx, -r.w / 2, -r.h / 2, r.w, r.h, 36, {stroke: C.red, lw: 5, shadow: 0.2});
    ctx.beginPath(); ctx.arc(-r.w / 2 + 80, -r.h / 2 + 82, 40, 0, 7); ctx.fillStyle = '#e5e7eb'; ctx.fill();
    rr(ctx, -r.w / 2 + 140, -r.h / 2 + 56, 230, 22, 11); ctx.fillStyle = '#d6d9df'; ctx.fill(); rr(ctx, -r.w / 2 + 140, -r.h / 2 + 92, 150, 18, 9); ctx.fillStyle = '#e5e7eb'; ctx.fill();
    for (let i = 0; i < 5; i++) star(ctx, -r.w / 2 + 80 + i * 74, -r.h / 2 + 175, 28, i === 0 ? C.red : null, '#c4c9d2', 3.5);
    [[0, 620], [1, 480]].forEach(([k, len]) => { rr(ctx, -r.w / 2 + 56, -r.h / 2 + 232 + k * 38, len, 18, 9); ctx.fillStyle = '#e9eaee'; ctx.fill(); });
    ctx.restore();
  }
  finish(ctx, T);
  ctx.restore();
}

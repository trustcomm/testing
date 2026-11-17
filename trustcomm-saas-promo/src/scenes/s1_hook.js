// 0–5.9 s · "Ek sawaal… aaj kitne customers aaye? Aur unme se kitno ne Google review diya?"
// An Instagram-style poll sticker: question, three options, a finger taps "0 – 2", the bar fills blue (the blue line
// is born here), the card wobbles, "Comment mein batao" pops. Then the camera tilts down into the shop.
import {W, H, C, F, B, P, env, initKit, stage, card, rr, words, text, pill, tick, tap, finish, clamp, lerp} from '../kit.js';
export const init = initKit;
const OPT = ['0 – 2', '3 – 5', '10+'], CX = 540, CY = 980, CW = 900;
export function draw(ctx, _t, {t: T}) {
  const tilt = P(T, 5.62, 0.62, 'camera');
  ctx.save(); ctx.translate(0, -tilt * 1920);
  stage(ctx, T);
  pill(ctx, 'POLL', 540, 470, {size: 30, a: P(T, -0.15, 0.2, 'out'), s: 0.6 + 0.4 * P(T, -0.15, 0.5, 'spring'), weight: 800, fam: F.head, fill: C.blue, color: '#fff', stroke: null, icon: (c, x, y) => { c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill(); }, iconW: 26});
  // the poll card
  const pin = P(T, -0.22, 0.55, 'spring'), wob = T > 4.95 ? Math.sin((T - 4.95) * 18) * 0.03 * Math.exp(-(T - 4.95) * 5) : 0;
  if (pin > 0) {
    ctx.save(); ctx.translate(CX, CY); ctx.rotate(wob - 0.012); ctx.scale(0.7 + 0.3 * pin, 0.7 + 0.3 * pin); ctx.globalAlpha *= clamp(pin * 2); ctx.translate(-CX, -CY);
    card(ctx, CX - CW / 2, 600, CW, 760, 52, {shadow: 0.14});
    // frame 1: the question opens big, then becomes the small header
    words(ctx, T, ['Ek sawaal…'], {y: 900, size: 124, times: [0.04, 0.4], accent: {1: C.blue}, out: B.aaj - 0.2});
    words(ctx, T, ['Aaj kitne', 'customers aaye?'], {y: 880, size: 104, times: [B.aaj, 1.64, B.customers, B.aaye], accent: {2: C.blue}, out: 3.28});
    words(ctx, T, ['Aaj kitne customers aaye?'], {y: 700, size: 46, weight: 600, fam: F.head, color: C.muted, times: [3.4, 3.43, 3.46, 3.49]});
    words(ctx, T, ['Kitno ne Google', 'review diya?'], {y: 812, size: 84, weight: 800, times: [B.kitno, 4.08, B.google, B.review, B.diya], accent: {2: C.blue, 3: C.blue}});
    OPT.forEach((o, i) => {
      const p = P(T, 4.25 + i * 0.1, 0.4, 'pop'); if (p <= 0) return; const y = 1010 + i * 108, sel = i === 0, fill = sel ? P(T, 4.97, 0.42, 'snap') : 0;
      ctx.save(); ctx.globalAlpha *= clamp(p * 1.5); ctx.translate((1 - p) * 60, 0);
      rr(ctx, CX - 380, y - 44, 760, 88, 44); ctx.fillStyle = '#f1f1ee'; ctx.fill();
      if (fill > 0) { ctx.save(); rr(ctx, CX - 380, y - 44, 760, 88, 44); ctx.clip(); ctx.fillStyle = C.blue; ctx.fillRect(CX - 380, y - 44, 760 * fill, 88); ctx.restore(); }
      text(ctx, o, CX - 320, y + 15, 42, {weight: 700, fam: F.head, color: fill > 0.5 ? '#fff' : C.ink});
      ctx.beginPath(); ctx.arc(CX + 320, y, 20, 0, 7); ctx.strokeStyle = fill > 0.5 ? '#fff' : '#b9bdc6'; ctx.lineWidth = 4; ctx.stroke();
      if (sel) tick(ctx, CX + 320, y + 1, 11, P(T, 5.12, 0.3, 'out'), '#fff', 5);
      ctx.restore();
    });
    ctx.restore();
  }
  tap(ctx, CX - 120, 1010, T, 4.95);
  pill(ctx, 'Comment mein batao  ↓', 540, 1470, {size: 36, a: P(T, 5.05, 0.25, 'out'), s: 0.7 + 0.3 * P(T, 5.05, 0.5, 'spring'), fill: C.ink, color: '#fff', stroke: null, weight: 700, fam: F.head});
  finish(ctx, T);
  ctx.restore();
}

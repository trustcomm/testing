// Chapter 1 (0–10.1 s): the slow template site that loses customers. Ends on the accent dot alone at (540, 860).
import {W, H, C, B, P, env, initKit, background, card, rr, dot, words, text, pill, cross, grain, clamp, lerp, rgba, hash, mixHex} from '../kit.js';
export const init = initKit;

const BLOCKS = [{x: 28, y: 104, w: 704, h: 150}, {x: 28, y: 274, w: 224, h: 110}, {x: 268, y: 274, w: 224, h: 110}, {x: 508, y: 274, w: 224, h: 110}, {x: 28, y: 404, w: 500, h: 18}, {x: 28, y: 436, w: 340, h: 18}];

function avatar(ctx, x, y, r, a = 1, tone = '#2a2e36') {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a);
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = tone; ctx.fill(); ctx.strokeStyle = '#3a3f4a'; ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 2, 0, 7); ctx.clip(); ctx.fillStyle = '#8b93a1';
  ctx.beginPath(); ctx.arc(x, y - r * 0.18, r * 0.34, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x, y + r * 0.86, r * 0.62, 0, 7); ctx.fill(); ctx.restore(); ctx.restore();
}

export function draw(ctx, _t, {t: T}) {
  background(ctx, T, {glow: 0.13});
  const pB = P(T, 2.92, 0.62, 'camera_s'), pC = P(T, B.mobile, 0.5, 'morph'), pEnd = P(T, 9.4, 0.6, 'morph'), inA = P(T, 0, 0.5, 'out');
  // card rectangle: A (hook) → B (list) → C (phone) → dot
  let x = 160, y = lerp(880, 440, pB), w = 760, h = lerp(420, 480, pB), r = 28;
  x = lerp(x, 390, pC); w = lerp(w, 300, pC); h = lerp(h, 540, pC); y = lerp(y, 420, pC); r = lerp(r, 46, pC);
  const cx = 540, cy0 = y + h / 2;
  x = lerp(x, 540 - 14, pEnd); w = lerp(w, 28, pEnd); y = lerp(y, 860 - 14, pEnd); h = lerp(h, 28, pEnd); r = lerp(r, 14, pEnd);
  const sA = lerp(0.955, 1, inA);

  // hook copy
  words(ctx, T, ['Aapki website', 'customers ko', 'bhaga rahi hai?'], {y: 480, size: 122, times: [0.0, 0.36, 0.78, 1.8, 2.06, 2.38, 2.6], accent: [4], out: 2.86});

  // visitors leaving on "bhaga"
  for (let i = 0; i < 5; i++) {
    const a = P(T, 0.05 + i * 0.07, 0.35, 'pop_soft'), q = P(T, B.bhaga + (4 - i) * 0.07, 0.55, 'in'), ax = 300 + i * 120 + q * 980;
    if (q < 1) { for (let k = 3; k >= 1; k--) if (q > 0.05) avatar(ctx, ax - k * 46 * q, 1392, 44, 0.16 * (1 - q), '#2a2e36'); avatar(ctx, ax, 1392 + (1 - a) * 30, 44 * (0.6 + 0.4 * a), a); }
  }
  text(ctx, 'visitors', 540, 1470, 30, {family: 'Inter', weight: 500, color: C.dim, a: env(T, 0.5, 2.3, 0.4, 0.3)});

  // falling page blocks (only once the phone breaks)
  const fall = T > 9.0;
  ctx.save(); ctx.translate(cx, cy0); ctx.scale(sA, sA); ctx.translate(-cx, -cy0);
  if (pEnd < 1) {
    card(ctx, x, y, w, h, r, {fill: mixHex('#1b1e25', C.accent, pEnd), stroke: pEnd > 0.5 ? null : C.line, shadow: 0.5 * (1 - pEnd)});
    const ca = 1 - P(T, 9.0, 0.3, 'in');
    if (ca > 0) {
      ctx.save(); ctx.globalAlpha *= ca;
      // top bar
      const bw = w - 56, by = y + 62;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x + 34 + i * 26, y + 32, 7, 0, 7); ctx.fillStyle = '#3a3f4a'; ctx.fill(); }
      rr(ctx, x + 28, by, bw, 5, 3); ctx.fillStyle = '#262a32'; ctx.fill();
      ctx.restore();
    }
  }
  // skeleton blocks: fixed to the 760-wide layout, so they overflow the phone when it narrows (the broken mobile design)
  const tpl = P(T, B.template, 0.45, 'pop_soft');
  BLOCKS.forEach((b, i) => {
    const sy = h / 480, tilt = (hash(i * 3.1) - 0.5) * 0.34 * pC, dx = (hash(i * 7.7) - 0.5) * 60 * pC;
    let bx = 160 + b.x + dx, byy = y + b.y * Math.min(1.12, sy), bh = b.h * Math.min(1, sy + 0.1), rot = tilt, a = 1;
    if (pEnd > 0 && !fall) a = 1;
    if (fall) { const ft = Math.max(0, T - 9.0 - i * 0.045); byy += 1500 * ft * ft; rot += (hash(i * 5.3) - 0.5) * 3 * ft; a = 1 - clamp((ft - 0.45) / 0.3); }
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(bx + b.w / 2, byy + bh / 2); ctx.rotate(rot);
    const sh = 0.5 + 0.5 * Math.sin(T * 2.2 - i * 0.6);
    rr(ctx, -b.w / 2, -bh / 2, b.w, bh, 10); ctx.fillStyle = mixHex('#2a2e37', '#3a404c', sh); ctx.fill();
    if (tpl > 0) { ctx.setLineDash([10, 8]); ctx.strokeStyle = rgba('#8b93a1', 0.5 * tpl); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
  });
  // "TEMPLATE" stamp
  const st = env(T, B.template + 0.1, 7.0, 0.3, 0.25);
  if (st > 0) { ctx.save(); ctx.translate(540 + 150 * (1 - pC), y + h * 0.36); ctx.rotate(-0.14); pill(ctx, 'TEMPLATE #4127', 0, 0, {size: 30, a: st, scale: 0.8 + 0.2 * P(T, B.template + 0.1, 0.35, 'pop_soft'), fill: 'rgba(0,0,0,0.75)', stroke: '#6b7280', color: '#b4bcc8', family: 'JetBrains Mono', weight: 600}); ctx.restore(); }
  ctx.restore();

  // the loading bar's head: the accent dot (through-line object)
  const crawl = 0.06 + 0.3 * (1 - Math.exp(-T * 0.35)) + 0.012 * Math.sin(T * 9) * (T < 9 ? 1 : 0);
  const hx = lerp(x + 28 + (w - 56) * crawl, 540, P(T, 9.0, 0.7, 'morph')), hy = lerp(y + 64, 860, P(T, 9.0, 0.7, 'morph'));
  if (T < 9.0) { rr(ctx, x + 28, y + 62, (w - 56) * crawl, 5, 3); ctx.fillStyle = C.accent; ctx.fill(); }
  const pulse = 1 + 0.18 * Math.sin(T * 5.2);
  dot(ctx, hx, hy, lerp(9, 14, P(T, 9.0, 0.7, 'morph')) * (T > 9.7 ? pulse : 1), 1, 1.2);
  if (T > 3.0 && T < 5.3) text(ctx, 'Loading' + '.'.repeat(1 + Math.floor(T * 2.5) % 3), x + 30, y + 46 + 0, 0, {a: 0});

  // the old way: three faults
  pill(ctx, 'THE OLD WAY', 540, 372, {size: 28, a: env(T, 3.0, 7.05, 0.35, 0.25), fill: 'rgba(255,255,255,0.05)', stroke: C.line, color: C.muted, weight: 600});
  [['Slow load', B.slow], ['Purana template', B.template], ['Toota mobile design', B.mobile]].forEach(([label, t0], i) => {
    const p = P(T, t0, 0.42, 'pop_soft'), q = P(T, 6.98 + i * 0.05, 0.24, 'in'), a = clamp(p * 1.4) * (1 - q), yy = 1090 + i * 136, xx = 150 - (1 - p) * 50 - q * 90;
    if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a;
    ctx.beginPath(); ctx.arc(xx + 40, yy - 22, 34, 0, 7); ctx.fillStyle = '#1c1f26'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
    cross(ctx, xx + 40, yy - 22, 12, P(T, t0 + 0.12, 0.3, 'out'), '#b4bcc8', 5);
    text(ctx, label, xx + 104, yy + 4, 78, {align: 'left', weight: 600}); ctx.restore();
  });

  // the customer who doesn't wait
  const vin = P(T, B.rukta - 0.12, 0.5, 'out'), vout = P(T, B.chala, 0.42, 'whip');
  if (vin > 0 && vout < 1) {
    const vx = lerp(-80, 236, vin) + vout * 1100, vy = 690;
    for (let k = 5; k >= 1; k--) if (vout > 0.02) avatar(ctx, vx - k * 60 * Math.sin(vout * Math.PI), vy, 54, 0.13);
    avatar(ctx, vx, vy, 54, 1, '#3a3f4a');
  }
  words(ctx, T, ['Customer rukta nahi.', 'Seedha chala jaata hai.'], {y: 1150, size: 96, lh: 1.2, times: [7.28, 7.6, 8.08, 8.7, 9.0, 9.26, 9.56], accent: [2], out: 9.92});
  grain(ctx, T);
}

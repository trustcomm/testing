// 35.3–39.9 s · "Admissions are now open! Call or WhatsApp us today."
// A green cloud bursts open; megaphone, ADMISSIONS OPEN, petal confetti, the children jump for joy;
// then everything makes room for a contact card with both numbers and the address.
import {W, H, C, B, P, IMG, initKit, sprite, sticker, text, rr, waIcon, phoneGlyph, petal, sparkle, finish, clipBlob, clamp, lerp, rgba, hash, F, font} from '../kit.js';
export const init = initKit;
function numbers(ctx, s, x, y, t0, T) { const n = Math.floor(clamp((T - t0) * 30, 0, s.length)); text(ctx, s.slice(0, n), x, y, 84, {color: C.ink, weight: 900, family: F.body}); return n; }
export function draw(ctx, _t, {t: T}) {
  const burst = P(T, 35.28, 0.55, 'swoop'), out = P(T, 39.32, 0.5, 'in'), shift = P(T, 37.3, 0.55, 'inOut');
  ctx.save(); clipBlob(ctx, 540, 900, burst * 1700, T, 9, 0.12 * (1 - burst) + 0.02);
  const g = ctx.createRadialGradient(540, 800, 50, 540, 900, 1300); g.addColorStop(0, '#36c06a'); g.addColorStop(0.55, C.green); g.addColorStop(1, '#073d22'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(540, 820); ctx.rotate(T * 0.12); ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 2000, i / 16 * Math.PI * 2, (i + 0.5) / 16 * Math.PI * 2); ctx.fill(); } ctx.restore();
  // confetti petals: burst on "open", then fall
  for (let i = 0; i < 36; i++) {
    const t0 = B.open - 0.05, u = Math.max(0, T - t0); if (u <= 0) continue; const ang = hash(i) * Math.PI * 2, v = 700 + hash(i + 1) * 900;
    const x = 540 + Math.cos(ang) * v * (1 - Math.exp(-u * 3)) / 3, y = 950 + Math.sin(ang) * v * (1 - Math.exp(-u * 3)) / 3 + u * u * 160;
    const cols = [[C.yellow, C.orange], [C.pink, '#ffb3cf'], ['#ffffff', '#ffe9a8'], [C.red, C.orange]][i % 4];
    petal(ctx, x, y, 26 + hash(i + 7) * 20, u * (3 + hash(i) * 4) + i, cols[0], cols[1], 1 - P(T, 39.0, 0.4, 'in'));
  }
  // block 1: megaphone + ADMISSIONS OPEN (+ kids), shrinks up on "call"
  ctx.save(); const ks = lerp(1, 0.5, shift); ctx.translate(540, lerp(830, 360, shift)); ctx.scale(ks, ks); ctx.translate(-540, -830);
  const mp = P(T, 35.4, 0.6, 'pop'), buzz = Math.sin(T * 60) * 3 * clamp(1 - Math.abs(T - B.open - 0.2) / 0.3);
  if (mp > 0) { sprite(ctx, IMG.mega, lerp(-300, 290, mp) + buzz, 560, 330, {anchor: 'center', rot: -0.22, shadow: 0, a: 1 - shift});
    for (let k = 0; k < 3; k++) { const u = ((T - 35.6) * 1.6 - k * 0.33) % 1; if (T < 35.6 + k * 0.2) continue; ctx.save(); ctx.globalAlpha = (1 - u) * mp * (1 - shift); ctx.strokeStyle = C.yellow; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(450, 520, 90 + u * 160, -0.6, 0.6); ctx.stroke(); ctx.restore(); } }
  sticker(ctx, T, ['Admissions'], {y: 830, size: 146, times: [B.admissions], stroke: C.deep, sw: 0.17, shadow: 0.4});
  const op = P(T, B.open - 0.04, 0.55, 'pop2');
  if (op > 0) { ctx.save(); ctx.translate(540, 1010); ctx.scale(op, op); ctx.rotate(-0.04); ctx.translate(-540, -1010); sticker(ctx, T, ['Open!'], {y: 1080, size: 250, times: [B.open - 0.04], fill: C.yellow, stroke: C.deep, sw: 0.15, shadow: 0.45, dur: 0.01}); ctx.restore();
    const r = P(T, B.open, 0.6, 'out'); if (r < 1) { ctx.beginPath(); ctx.arc(540, 1000, 200 + r * 500, 0, 7); ctx.strokeStyle = rgba('#ffffff', 0.5 * (1 - r)); ctx.lineWidth = 14 * (1 - r) + 2; ctx.stroke(); } }
  ctx.restore();
  const kp = P(T, B.open + 0.05, 0.6, 'pop') * (1 - P(T, 37.2, 0.4, 'in')), jump = Math.abs(Math.sin((T - B.open) * Math.PI * 2.2)) * 40;
  if (kp > 0) sprite(ctx, IMG.cheer, 540, lerp(2100, 1540, kp) - jump, 480, {shadow: 0});
  // block 2: contact card
  const cp = P(T, 37.45, 0.6, 'pop'), ca = clamp((T - 37.45) / 0.15);
  if (ca > 0) {
    ctx.save(); ctx.translate(540, 940); ctx.scale(0.7 + 0.3 * cp, 0.7 + 0.3 * cp); ctx.translate(-540, -940 + (1 - cp) * 160); ctx.globalAlpha *= ca;
    ctx.shadowColor = 'rgba(0,30,10,0.35)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 24; rr(ctx, 90, 620, 900, 640, 56); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent';
    waIcon(ctx, 230, 740, 54); ctx.beginPath(); ctx.arc(356, 740, 54, 0, 7); ctx.fillStyle = C.red; ctx.fill(); phoneGlyph(ctx, 356, 740, 40);
    text(ctx, 'Call or WhatsApp', 440, 760, 58, {color: C.deep, weight: 700, align: 'left'});
    ctx.fillStyle = rgba(C.deep, 0.12); ctx.fillRect(150, 820, 780, 4);
    numbers(ctx, '99287 88015', 540, 940, B.whatsapp - 0.1, T); numbers(ctx, '99010 17215', 540, 1050, B.whatsapp + 0.25, T);
    ctx.fillStyle = rgba(C.deep, 0.12); ctx.fillRect(150, 1095, 780, 4);
    text(ctx, 'Melekote Main Road, Opp. GMS Enterprises,', 540, 1160, 31, {color: '#4a5a50', weight: 700, family: F.body, a: P(T, 38.5, 0.4, 'out')});
    text(ctx, 'Sadashivanagar, Tumkur', 540, 1205, 31, {color: '#4a5a50', weight: 700, family: F.body, a: P(T, 38.6, 0.4, 'out')});
    ctx.restore();
    const tg = clamp(1 - Math.abs(T - B.today - 0.15) / 0.3); sparkle(ctx, 930, 640, 40 * tg, tg);
  }
  finish(ctx, T, {grain: 0.02, vignette: 0.25});
  ctx.restore();
}

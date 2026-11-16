// 28.5–35.9 s · programs as flowers that grow taller with each age. Calendar flips to 1st December for
// Playhome & Nursery; a tag marks LKG & UKG for the next academic year. A butterfly crosses the meadow.
import {W, H, C, B, P, initKit, stem, flower, cloud, sticker, pill, rr, text, sparkle, finish, clamp, lerp, mixHex, rgba, hash, F, font} from '../kit.js';
export const init = initKit;
const PROG = [
  {name: 'Playhome', age: '2–3 yrs', x: 165, top: 1100, t: B => B.playhome, col: C.pink, light: '#ffb3cf'},
  {name: 'Nursery', age: '3–4 yrs', x: 405, top: 960, t: B => B.nursery, col: C.orange2, light: '#ffc58f'},
  {name: 'LKG', age: '4–5 yrs', x: 645, top: 820, t: B => B.lkg, col: C.blue, light: '#9cc4ff'},
  {name: 'UKG', age: '5–6 yrs', x: 885, top: 680, t: B => B.ukg, col: C.purple, light: '#c9a3ef'},
];
const GROUND = 1460;
function hills(ctx, T) {
  [[1380, '#7fcf6b', 0.006, 50], [1450, '#4fb15a', 0.009, 40], [1530, C.green, 0.012, 30]].forEach(([y, c, f, amp], i) => {
    ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 12) ctx.lineTo(x, y + Math.sin(x * f + i * 2) * amp); ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = c; ctx.fill();
  });
  for (let i = 0; i < 40; i++) { const x = hash(i) * W, y = 1480 + hash(i + 5) * 400; ctx.beginPath(); ctx.arc(x, y, 6 + hash(i + 2) * 5, 0, 7); ctx.fillStyle = ['#ffffff', C.yellow, '#ffb3cf'][i % 3]; ctx.fill(); }
}
function butterfly(ctx, T) {
  const u = clamp((T - 29.2) / 6), x = lerp(-80, 1160, u), y = 560 + Math.sin(u * 9) * 90, f = Math.abs(Math.sin(T * 14));
  ctx.save(); ctx.translate(x, y); ctx.rotate(0.2 + Math.sin(u * 9) * 0.2);
  [[-1, C.orange], [1, C.yellow]].forEach(([d]) => { ctx.save(); ctx.scale(d * (0.3 + 0.7 * f), 1); ctx.fillStyle = C.orange; ctx.beginPath(); ctx.ellipse(22, -14, 26, 20, -0.4, 0, 7); ctx.fill(); ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.ellipse(18, 14, 18, 14, 0.4, 0, 7); ctx.fill(); ctx.restore(); });
  ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 22, 0, 0, 7); ctx.fill(); ctx.restore();
}
function head(ctx, p, x, y, bloom, T) {
  if (bloom <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(1.16, 1.16); ctx.translate(-x, -y); flower(ctx, x, y, 128, bloom, {n: 10, colA: p.col, colB: p.light, center: p.col, rot: T * 0.2});
  const s = clamp(bloom); ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(ctx, -112, -64, 224, 128, 64); ctx.fillStyle = p.col; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke();
  text(ctx, p.name, 0, -4, p.name.length > 4 ? 44 : 56, {color: '#fff', weight: 700});
  text(ctx, p.age, 0, 40, 30, {color: '#fff', weight: 900, family: F.body, a: 0.95}); ctx.restore(); ctx.restore();
}
export function draw(ctx, _t, {t: T}) {
  const wipe = P(T, 28.45, 0.6, 'swoop'), out = P(T, 35.3, 0.4, 'in');
  ctx.save(); const top = lerp(H + 200, -260, wipe);
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, top); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, top + Math.sin(x / 70) * 50 * (1 - wipe)); ctx.lineTo(W, H); ctx.closePath(); ctx.clip();
  const sky = ctx.createLinearGradient(0, 0, 0, 1400); sky.addColorStop(0, C.skyTop); sky.addColorStop(1, '#fff4dc'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // sun
  ctx.save(); ctx.translate(900, 300); ctx.rotate(T * 0.2); ctx.fillStyle = 'rgba(255,214,90,0.35)'; for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, -110); ctx.lineTo(18, -170); ctx.lineTo(-18, -170); ctx.fill(); }
  ctx.beginPath(); ctx.arc(0, 0, 92, 0, 7); ctx.fillStyle = C.yellow; ctx.fill(); ctx.restore();
  cloud(ctx, 220 + T * 12 % 300, 300, 0.9, 0.95); cloud(ctx, 640 - T * 8 % 200, 420, 0.6, 0.85);
  hills(ctx, T);
  // stems and heads
  PROG.forEach((p, i) => {
    const t0 = p.t(B), g = P(T, t0 - 0.1, 0.75, 'soft'), bloom = P(T, t0 + 0.35, 0.6, 'pop');
    const [hx, hy] = stem(ctx, p.x, GROUND + 20, GROUND + 20 - p.top, g, T, {w: 14, leaves: [0.3, 0.55, 0.78].slice(0, 2 + (i > 1 ? 1 : 0)), color: '#3b9b48'});
    head(ctx, p, hx, hy, bloom, T);
    if (bloom > 0.95 && bloom < 1.2) sparkle(ctx, hx + 110, hy - 70, 30 * (1 - P(T, t0 + 0.9, 0.3, 'in')), 1);
  });
  // calendar: 1st December for Playhome & Nursery
  const cal = P(T, 30.45, 0.55, 'pop'), ca = clamp((T - 30.45) / 0.12);
  if (ca > 0) {
    ctx.save(); ctx.translate(285, 600); ctx.scale(1, cal); ctx.rotate(-0.04);
    ctx.shadowColor = 'rgba(0,40,20,0.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; rr(ctx, -190, -150, 380, 300, 34); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); rr(ctx, -190, -150, 380, 300, 34); ctx.clip(); ctx.fillStyle = C.red; ctx.fillRect(-190, -150, 380, 84); ctx.restore();
    [-110, 110].forEach(x => { rr(ctx, x - 9, -170, 18, 46, 9); ctx.fillStyle = C.deep; ctx.fill(); });
    text(ctx, 'DECEMBER', 0, -92, 40, {color: '#fff', weight: 700});
    text(ctx, '1', -26, 50, 150, {color: C.red, weight: 700}); text(ctx, 'st', 50, -10, 54, {color: C.red, weight: 700});
    text(ctx, 'Playhome & Nursery', 0, 118, 30, {color: C.deep, weight: 900, family: F.body});
    ctx.restore();
    const d = P(T, B.december, 0.6, 'out'); ctx.save(); ctx.setLineDash([4, 14]); ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = rgba(C.deep, 0.45 * d);
    ctx.beginPath(); ctx.moveTo(220, 760); ctx.quadraticCurveTo(170, 860, 165, 960); ctx.moveTo(350, 760); ctx.quadraticCurveTo(400, 800, 405, 830); ctx.stroke(); ctx.restore();
  }
  // next academic year: LKG & UKG
  const ny = P(T, B.nextyear - 0.1, 0.5, 'pop');
  if (ny > 0) { ctx.save(); ctx.translate(735, 430); ctx.scale(ny, ny); ctx.rotate(0.03); ctx.shadowColor = 'rgba(0,40,20,0.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    const g = ctx.createLinearGradient(-200, 0, 200, 0); g.addColorStop(0, C.blue); g.addColorStop(1, C.purple); rr(ctx, -200, -78, 400, 156, 40); ctx.fillStyle = g; ctx.fill(); ctx.shadowColor = 'transparent';
    text(ctx, 'From next', 0, -14, 44, {color: '#fff', weight: 600}); text(ctx, 'academic year', 0, 40, 44, {color: C.yellow, weight: 700}); ctx.restore(); }
  butterfly(ctx, T);
  finish(ctx, T, {grain: 0.02, vignette: 0.12});
  ctx.restore();
}

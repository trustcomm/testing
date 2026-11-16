// 14.1–19.8 s · "Where little ones play… explore… and learn, every single day."
// Portal opens from the logo into a soft classroom; three flower medallions bloom one by one (Play: toys,
// Explore: magnifier on a leaf, Learn: a book with letters rising), the first two settle into a row.
import {W, H, C, B, P, IMG, initKit, cover, sprite, sticker, flower, petal, pill, sparkle, drift, finish, clipCircle, clamp, lerp, mixHex, rgba, text, F, font} from '../kit.js';
import {LOGO_AT} from './s3_brand.js';
export const init = initKit;
const HERO = {x: 540, y: 1100, r: 255};
const SLOT = [{x: 250, y: 600, r: 128}, {x: 830, y: 600, r: 128}];
const MED = [
  {t: 14.9, park: 15.86, slot: 0, word: 'Play', cols: [C.pink, '#ffc2da'], word_c: C.pink},
  {t: 15.86, park: 16.98, slot: 1, word: 'Explore', cols: [C.blue, '#a9cdff'], word_c: C.blue},
  {t: 16.98, park: 99, slot: -1, word: 'Learn', cols: [C.orange, '#ffd59c'], word_c: C.orange2},
];
function medPos(m, T) {
  const k = P(T, m.park, 0.6, 'inOut'); if (m.slot < 0 || k <= 0) return HERO; const s = SLOT[m.slot];
  return {x: lerp(HERO.x, s.x, k), y: lerp(HERO.y, s.y, k) - Math.sin(k * Math.PI) * 60, r: lerp(HERO.r, s.r, k)};
}
function explore(ctx, x, y, r, T) {
  ctx.save(); ctx.translate(x, y); const k = r / 290;
  // leaf
  ctx.save(); ctx.rotate(-0.5); ctx.scale(k, k); ctx.beginPath(); ctx.moveTo(0, 170); ctx.bezierCurveTo(-170, 60, -120, -150, 0, -190); ctx.bezierCurveTo(120, -150, 170, 60, 0, 170);
  const g = ctx.createLinearGradient(-150, 0, 150, 0); g.addColorStop(0, '#2f9a48'); g.addColorStop(1, '#6fcf6a'); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 160); ctx.lineTo(0, -170); for (let i = -2; i <= 2; i++) { ctx.moveTo(0, i * 50); ctx.lineTo(70 * Math.sign(i || 1), i * 50 - 50); ctx.moveTo(0, i * 50 + 10); ctx.lineTo(-70, i * 50 - 40); } ctx.stroke();
  // ladybug
  ctx.translate(40, -40); ctx.fillStyle = C.red; ctx.beginPath(); ctx.ellipse(0, 0, 30, 24, 0.3, 0, 7); ctx.fill(); ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(-26, -10, 13, 0, 7); ctx.fill();
  [[-6, -10], [10, 6], [8, -14]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 5, 0, 7); ctx.fill(); }); ctx.restore();
  // magnifier circling over the leaf
  const ax = Math.cos(T * 2.2) * 50 * k, ay = Math.sin(T * 2.2) * 34 * k;
  ctx.translate(ax + 40 * k, ay - 20 * k); ctx.rotate(0.6);
  ctx.fillStyle = 'rgba(190,230,255,0.35)'; ctx.beginPath(); ctx.arc(0, 0, 105 * k, 0, 7); ctx.fill();
  ctx.strokeStyle = C.deep; ctx.lineWidth = 22 * k; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-40 * k, -42 * k, 28 * k, 14 * k, -0.8, 0, 7); ctx.fill();
  ctx.fillStyle = C.yellow; ctx.strokeStyle = C.deep; ctx.lineWidth = 6 * k; ctx.beginPath(); ctx.roundRect(-20 * k, 112 * k, 40 * k, 150 * k, 18 * k); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function learn(ctx, x, y, r, T, t0) {
  const k = r / 290, bw = 520 * k; sprite(ctx, IMG.book, x, y + 40 * k, bw * IMG.book.height / IMG.book.width, {anchor: 'center', shadow: 0});
  ['A', 'B', 'C', '1', '2', '3'].forEach((ch, i) => {
    const u = ((T - t0 - i * 0.18) * 0.55) % 1; if (T - t0 - i * 0.18 < 0) return;
    const px = x + (i - 2.5) * 70 * k + Math.sin(u * 6 + i) * 20 * k, py = y - 20 * k - u * 330 * k, a = Math.sin(u * Math.PI);
    text(ctx, ch, px, py, 92 * k, {color: [C.red, C.blue, C.green, C.orange2, C.purple, C.pink][i], a, stroke: '#fff', sw: 0.12});
  });
}
export function draw(ctx, _t, {t: T}) {
  const L = LOGO_AT(T), portal = P(T, 14.15, 0.62, 'swoop');
  ctx.save(); clipCircle(ctx, L.x, L.y, portal * 1700);
  cover(ctx, IMG.classroom, {s: lerp(1.35, 1.12, portal) + 0.04 * P(T, 14.8, 4.5, 'soft'), fy: 900, blur: 9});
  ctx.fillStyle = 'rgba(255,246,228,0.42)'; ctx.fillRect(0, 0, W, H);
  drift(ctx, T, {n: 10, seed: 13, a: 0.7, speed: 0.7});
  sticker(ctx, T, ['Where little ones'], {y: 380, size: 96, times: [B.little, 14.48, 14.72], out: 15.7});
  MED.forEach((m, i) => {
    const b = P(T, m.t - 0.12, 0.75, 'pop'), a = clamp((T - m.t + 0.12) / 0.15); if (a <= 0) return;
    const p = medPos(m, T), out = m.slot < 0 ? P(T, 19.02, 0.3, 'in') : 0;
    ctx.save(); ctx.globalAlpha *= a;
    // halo + flower + white face
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 1.7); g.addColorStop(0, rgba('#ffffff', 0.7)); g.addColorStop(1, rgba('#ffffff', 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.7, 0, 7); ctx.fill();
    flower(ctx, p.x, p.y, p.r * 1.42 * (1 - out * 0.3), b, {n: 10, colA: m.cols[0], colB: m.cols[1], center: '#fff', rot: T * 0.15 + i});
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.98 * b, 0, 7); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.lineWidth = 8 * p.r / 290; ctx.strokeStyle = m.cols[0]; ctx.stroke();
    const cs = P(T, m.t + 0.05, 0.6, 'pop');
    if (i === 0) sprite(ctx, IMG.toys, p.x, p.y + 10 * p.r / 290, p.r * 1.22 * cs, {anchor: 'center', shadow: 0, rot: Math.sin(T * 1.8) * 0.03});
    if (i === 1 && cs > 0) { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(cs, cs); ctx.translate(-p.x, -p.y); explore(ctx, p.x, p.y, p.r, T); ctx.restore(); }
    if (i === 2 && cs > 0 && out < 1) { ctx.save(); ctx.globalAlpha *= 1 - out; ctx.translate(p.x, p.y); ctx.scale(cs, cs); ctx.translate(-p.x, -p.y); learn(ctx, p.x, p.y, p.r, T, m.t); ctx.restore(); }
    ctx.restore();
    // the word
    // the word: big under the hero; leaves as the medallion parks (the icon carries it from there)
    sticker(ctx, T, [m.word], {x: p.x, y: p.y + p.r + 118, size: 118, times: [m.t], fill: '#fff', accent: {0: m.word_c}, stroke: '#ffffff', sw: 0.2, out: m.slot < 0 ? 19.0 : m.park - 0.34});
  });
  // "every single day"
  const ed = P(T, B.everyday - 0.05, 0.5, 'pop'); if (ed > 0) pill(ctx, 'Every single day!', 540, 310, {size: 50, family: F.title, weight: 700, fill: C.green, a: clamp(ed * 1.4) * (1 - P(T, 19.0, 0.3, 'in')), s: 0.7 + 0.3 * ed});
  finish(ctx, T, {grain: 0.02, vignette: 0.15});
  ctx.restore();
}

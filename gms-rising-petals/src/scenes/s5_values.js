// 19.0–29.3 s · four promises, one per page of a storybook. Pages turn on each line; ticks draw on;
// a chip row collects them; on "for every little one" the children peek out from behind the book and wave.
import {W, H, C, B, P, IMG, initKit, sprite, sticker, pill, tick, rr, text, finish, clamp, lerp, mixHex, rgba, hash, F, sparkle} from '../kit.js';
export const init = initKit;
const BK = {x: 540, y: 1020, w: 1000};
const TS = [19.37, 21.07, 22.68, 25.1];
const TITLES = [['Safe &', 'Nurturing'], ['Activity-Based', 'Learning'], ['Islamic &', 'Moral Values'], ['Caring, Trained', 'Educators']];
const CHIPS = ['Safe', 'Activity-based', 'Values', 'Educators'];
function geom() {
  const k = BK.w / IMG.book.width, h = IMG.book.height * k, x0 = BK.x - BK.w / 2, y0 = BK.y - h / 2;
  return {k, h, x0, y0, spine: x0 + 767.5 * k, L: {x: x0 + 40 * k, y: y0 + 14 * k, w: 722 * k, h: 700 * k}, R: {x: x0 + 773 * k, y: y0 + 14 * k, w: 724 * k, h: 700 * k}};
}
function shield(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(0, -120); ctx.bezierCurveTo(60, -90, 100, -95, 110, -100); ctx.bezierCurveTo(115, 20, 70, 95, 0, 130); ctx.bezierCurveTo(-70, 95, -115, 20, -110, -100); ctx.bezierCurveTo(-100, -95, -60, -90, 0, -120); ctx.closePath();
  const g = ctx.createLinearGradient(0, -120, 0, 130); g.addColorStop(0, '#3fbf6a'); g.addColorStop(1, C.green); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = C.deep; ctx.stroke();
  heart(ctx, 0, 0, 0.55, '#fff'); ctx.restore();
}
function heart(ctx, x, y, s, color = C.red) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(0, 70); ctx.bezierCurveTo(-110, 0, -80, -90, 0, -40); ctx.bezierCurveTo(80, -90, 110, 0, 0, 70); ctx.fillStyle = color; ctx.fill(); ctx.restore();
}
function hands(ctx, x, y, s, T) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  heart(ctx, 0, -40 - Math.abs(Math.sin(T * 3)) * 8, 0.95, C.red);
  ctx.fillStyle = '#f2b48a'; ctx.strokeStyle = '#c7825a'; ctx.lineWidth = 6;
  [-1, 1].forEach(d => { ctx.beginPath(); ctx.moveTo(d * 10, 40); ctx.bezierCurveTo(d * 60, 50, d * 120, 20, d * 150, -20); ctx.bezierCurveTo(d * 160, -40, d * 140, -50, d * 120, -36); ctx.bezierCurveTo(d * 90, -10, d * 60, 0, d * 20, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); });
  ctx.restore();
}
function leftArt(ctx, i, pg, T) {
  const cx = pg.x + pg.w / 2, cy = pg.y + pg.h / 2;
  if (i === 0) shield(ctx, cx, cy + 6, pg.h / 330);
  if (i === 1) sprite(ctx, IMG.toys, cx, cy, pg.h * 0.62, {anchor: 'center', shadow: 0});
  if (i === 2) sprite(ctx, IMG.read, cx, cy + 4, pg.h * 0.86, {anchor: 'center', shadow: 0});
  if (i === 3) hands(ctx, cx, cy + 20, pg.h / 380, T);
}
function rightText(ctx, i, pg, T, t0) {
  const cx = pg.x + pg.w / 2, s = Math.min(62, pg.w / 7.4);
  TITLES[i].forEach((ln, j) => text(ctx, ln, cx, pg.y + pg.h * 0.4 + j * s * 1.15, s, {color: j ? C.red : C.deep, weight: 600}));
  const tp = P(T, t0 + 0.55, 0.5, 'out'); if (tp > 0) { ctx.beginPath(); ctx.arc(cx, pg.y + pg.h * 0.72, s * 0.62, 0, 7); ctx.fillStyle = rgba(C.green, 0.14); ctx.fill(); tick(ctx, cx, pg.y + pg.h * 0.72, s * 0.32, tp, C.green, s * 0.12); }
  text(ctx, String(i + 1).padStart(2, '0'), pg.x + pg.w - 34, pg.y + 56, 30, {family: F.body, weight: 900, color: rgba(C.deep, 0.35), align: 'right'});
}
function sheet(ctx, pg, fill = '#fbf3e0') { rr(ctx, pg.x, pg.y, pg.w, pg.h, 10); ctx.fillStyle = fill; ctx.fill(); }
export function draw(ctx, _t, {t: T}) {
  const wipe = P(T, 19.0, 0.55, 'swoop'), out = P(T, 28.45, 0.5, 'in');
  // paper background rising with a wavy edge
  ctx.save(); const top = lerp(H + 120, -160, wipe);
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, top); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, top + Math.sin(x / 90 + T * 4) * 40 * (1 - wipe)); ctx.lineTo(W, H); ctx.closePath(); ctx.clip();
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#fff7e6'); bg.addColorStop(1, '#ffe9c4'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 46; i++) { ctx.beginPath(); ctx.arc(hash(i) * W, (hash(i + 9) * H + T * 14) % H, 6 + hash(i + 3) * 10, 0, 7); ctx.fillStyle = rgba([C.pink, C.yellow, C.leaf, C.blue][i % 4], 0.13); ctx.fill(); }
  sticker(ctx, T, ['Why choose us?'], {y: 400, size: 104, fill: C.green, stroke: '#fff', sw: 0.16, shadow: 0.12, times: [19.12, 19.24, 19.36], accent: {2: C.red}, out: 28.4});
  // the book: grows up from the Learn medallion
  const g = geom(), enter = P(T, 19.0, 0.7, 'pop');
  ctx.save(); const s0 = lerp(0.6, 1, enter); ctx.translate(BK.x, lerp(1060, BK.y, enter) + out * 900); ctx.scale(s0, s0); ctx.rotate((1 - enter) * -0.06); ctx.translate(-BK.x, -BK.y);
  // children peek out from behind the book on "for every little one"
  const pk = [P(T, B.everylittle - 0.2, 0.6, 'pop'), P(T, B.everylittle - 0.05, 0.6, 'pop')];
  sprite(ctx, IMG.boy, 250, lerp(g.y0 + 300, g.y0 + 330 - 230, pk[0]) + 230, 560, {rot: -0.1 + Math.sin(T * 6) * 0.03 * pk[0], shadow: 0, a: clamp(pk[0] * 3)});
  sprite(ctx, IMG.girl, 830, lerp(g.y0 + 300, g.y0 + 330 - 230, pk[1]) + 230, 560, {rot: 0.1 - Math.sin(T * 6) * 0.03 * pk[1], shadow: 0, a: clamp(pk[1] * 3)});
  ctx.save(); ctx.shadowColor = 'rgba(90,50,0,0.3)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26; ctx.drawImage(IMG.book, g.x0, g.y0, BK.w, g.h); ctx.restore();
  // pages
  let idx = 0; TS.forEach((t0, i) => { if (T >= t0 - 0.38) idx = i; });
  const t0 = TS[idx] - 0.38, u = idx > 0 ? clamp((T - t0) / 0.5) : 1, show = P(T, 19.25, 0.4, 'out');
  ctx.save(); ctx.globalAlpha *= show;
  if (u < 1) { // flipping from idx-1 to idx
    ctx.save(); sheet(ctx, g.L); ctx.clip(); leftArt(ctx, idx - 1, g.L, T); ctx.restore();
    ctx.save(); sheet(ctx, g.R); ctx.clip(); rightText(ctx, idx, g.R, T, TS[idx]); ctx.restore();
    const c = Math.cos(Math.PI * ease(u)), side = c >= 0 ? g.R : g.L;
    ctx.save(); ctx.translate(g.spine, 0); ctx.scale(Math.abs(c) < 0.02 ? 0.02 : Math.abs(c), 1); ctx.translate(-g.spine, 0);
    ctx.shadowColor = 'rgba(80,40,0,0.35)'; ctx.shadowBlur = 30; sheet(ctx, side, mixHex('#fbf3e0', '#e9d9b8', 1 - Math.abs(c))); ctx.shadowColor = 'transparent';
    ctx.save(); sheet(ctx, side); ctx.clip(); if (c >= 0) rightText(ctx, idx - 1, g.R, T, -9); else leftArt(ctx, idx, g.L, T); ctx.restore();
    ctx.restore();
  } else {
    ctx.save(); sheet(ctx, g.L); ctx.clip(); leftArt(ctx, idx, g.L, T); ctx.restore();
    ctx.save(); sheet(ctx, g.R); ctx.clip(); rightText(ctx, idx, g.R, T, TS[idx]); ctx.restore();
  }
  // spine shade
  const sg = ctx.createLinearGradient(g.spine - 40, 0, g.spine + 40, 0); sg.addColorStop(0, 'rgba(120,80,20,0)'); sg.addColorStop(0.5, 'rgba(120,80,20,0.22)'); sg.addColorStop(1, 'rgba(120,80,20,0)'); ctx.fillStyle = sg; ctx.fillRect(g.spine - 40, g.L.y, 80, g.L.h);
  ctx.restore(); ctx.restore();
  // chips collect the promises
  let cx = 0; const ws = CHIPS.map(c => c.length * 17 + 66), tot = ws.reduce((s, v) => s + v + 14, -14); cx = 540 - tot / 2;
  CHIPS.forEach((c, i) => { const p = P(T, TS[i] + 0.3, 0.45, 'pop'); pill(ctx, c, cx + ws[i] / 2, 1430 + out * 600, {size: 30, a: clamp(p * 1.5), s: 0.6 + 0.4 * p, fill: [C.green, C.orange2, C.deep, C.red][i], padX: 22}); cx += ws[i] + 14; });
  finish(ctx, T, {grain: 0.02, vignette: 0.14});
  ctx.restore();
}
const ease = (u) => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

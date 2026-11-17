// 22.3–30.9 s · "Phir unke taps se review ka draft ban jaata hai — customer edit karta hai, aur Google pe khud post karta hai.
// Kuch kehna ho? Toh seedha aapko, private mein." The blue line splits in two: a draft the customer edits and posts on
// Google themselves; and a private note that lands on Meera's phone.
import {W, H, C, F, B, P, env, IMG, initKit, stage, card, rr, words, text, pill, tick, tap, sprite, drawPath, bezierPts, dot, finish, clamp, lerp, rgba, font} from '../kit.js';
export const init = initKit;
const DRAFT = 'The filter coffee and masala dosa were excellent. Friendly service too.';
const NOTE = 'Loved the food. The table by the door gets cold in the evening — maybe keep it shut?';
function wrap(ctx, s, size, maxW, weight = 500) { ctx.font = font(size, weight); const ws = s.split(' '), lines = ['']; ws.forEach(w => { const t = lines.at(-1) ? lines.at(-1) + ' ' + w : w; if (ctx.measureText(t).width > maxW) lines.push(w); else lines[lines.length - 1] = t; }); return lines; }
function typed(ctx, s, n, x, y, size, maxW, {caret = true, color = C.ink, lh = 1.4} = {}) {
  const lines = wrap(ctx, s, size, maxW); let left = n, cx = x, cy = y;
  lines.forEach((ln, i) => { const part = ln.slice(0, Math.max(0, left)); text(ctx, part, x, y + i * size * lh, size, {weight: 500, color}); left -= ln.length + 1; if (part.length) { ctx.font = font(size, 500); cx = x + ctx.measureText(part).width; cy = y + i * size * lh; } });
  if (caret) { ctx.fillStyle = C.blue; ctx.fillRect(cx + 3, cy - size * 0.82, 3, size * 1.05); }
}
export function draw(ctx, _t, {t: T}) {
  const enter = P(T, 22.35, 0.55, 'out'), phaseB = P(T, 27.35, 0.6, 'camera'), out = P(T, 30.55, 0.4, 'in');
  ctx.save(); ctx.globalAlpha *= enter; ctx.translate(0, -out * 1920);
  stage(ctx, T);
  // the line comes down and splits
  const split = P(T, 22.5, 0.6, 'inOut');
  drawPath(ctx, [[540, -100], [540, 300]], clamp((T - 22.35) / 0.3), {lw: 10});
  drawPath(ctx, bezierPts([540, 300], [540, 380], lerp(540, 300, 1 - phaseB), lerp(400, 340, phaseB), ...[[lerp(300, 270, phaseB), lerp(470, 320, phaseB)]]), split, {lw: 10});
  drawPath(ctx, bezierPts([540, 300], [540, 380], [780, 380], [800, lerp(470, 760, phaseB)]), split * (0.3 + 0.7 * phaseB), {lw: 10});
  // card A: draft on Google (centre, then shrinks to the top)
  const ax = lerp(90, 120, phaseB), ay = lerp(500, 290, phaseB), aw = lerp(900, 840, phaseB), ah = lerp(700, 330, phaseB), aa = P(T, 22.55, 0.45, 'pop');
  if (aa > 0) {
    ctx.save(); ctx.globalAlpha *= clamp(aa * 1.5); card(ctx, ax, ay, aw, ah, 40, {shadow: 0.12}); ctx.beginPath(); ctx.rect(ax, ay, aw, ah); ctx.clip();
    const sc = lerp(1, 0.62, phaseB); ctx.translate(ax, ay); ctx.scale(sc, sc);
    text(ctx, 'On Google', 50, 86, 44, {weight: 800, fam: F.head}); text(ctx, 'Draft from your taps · you edit, you post', 50, 140, 28, {weight: 500, color: C.muted});
    rr(ctx, 50, 175, 800, 300, 24); ctx.fillStyle = '#f6f6f3'; ctx.fill(); ctx.strokeStyle = T > B.edit - 0.1 && T < 25.6 ? C.blue : '#e2e2dd'; ctx.lineWidth = 3; ctx.stroke();
    const n = Math.floor(clamp((T - B.draft) * 42, 0, DRAFT.length)), edited = T > 24.9;
    const s = edited ? DRAFT.replace('were excellent', 'were really excellent') : DRAFT, extra = edited ? Math.floor(clamp((T - 24.9) * 20, 0, 7)) : 0;
    const shown = edited ? DRAFT.replace('were excellent', 'were ' + 'really '.slice(0, extra) + 'excellent') : DRAFT.slice(0, n);
    typed(ctx, shown, shown.length, 84, 245, 38, 730, {caret: T < 26.4 && Math.floor(T * 2.5) % 2 === 0 || (n < DRAFT.length && !edited)});
    if (T > B.edit - 0.1 && T < 26.2) pill(ctx, 'Customer edits', 700, 200, {size: 24, fill: C.blueSoft, color: C.blue, stroke: null, a: env(T, B.edit - 0.1, 26.2, 0.2, 0.2)});
    // post button → posted by the customer
    const posted = P(T, B.post + 0.05, 0.35, 'pop');
    rr(ctx, 500, 520, 350, 100, 50); ctx.fillStyle = mixPost(posted); ctx.fill();
    text(ctx, posted > 0.5 ? 'Posted by customer' : 'Post on Google', 675, 584, 30, {weight: 700, color: '#fff', align: 'center'});
    if (posted > 0.5) tick(ctx, 528 + 0, 570, 0, 0);
    ctx.restore();
    const btn = [ax + 675 * lerp(1, 0.62, phaseB), ay + 570 * lerp(1, 0.62, phaseB)]; tap(ctx, btn[0], btn[1], T, B.post);
  }
  words(ctx, T, ['Taps se →', 'review ka draft.'], {y: 330, size: 66, times: [B.taps, 21.86, 22.4, 22.74, B.draft], accent: {3: C.blue}, out: 24.1});
  words(ctx, T, ['customer khud post karta hai'], {y: 1330, size: 54, weight: 700, times: [B.edit, 24.56, 24.86, 26.28, B.post, 26.86], accent: {1: C.blue}, out: 27.3});
  // card B: the private note, then it flies to Meera's phone
  const ba = P(T, B.kuch - 0.1, 0.5, 'pop'), fly = P(T, 29.25, 0.55, 'inOut');
  const mx = 760, my = 1180, mw = 560, mh = IMG.owner_meera.height * mw / IMG.owner_meera.width, mi = P(T, 27.7, 0.6, 'out');
  sprite(ctx, IMG.owner_meera, mx, lerp(1900, my, mi), mw, {a: clamp(mi * 2)});
  const phoneAt = [mx + 0.16 * mw, lerp(1900, my, mi) - 0.13 * mh];
  if (ba > 0 && fly < 1) {
    const bx = lerp(70, phoneAt[0] - 40, fly), by = lerp(700, phoneAt[1] - 30, fly), s = lerp(1, 0.12, fly);
    ctx.save(); ctx.globalAlpha *= clamp(ba * 1.5) * (1 - fly * 0.6); ctx.translate(bx, by); ctx.scale(s, s);
    card(ctx, 0, 0, 560, 420, 34, {shadow: 0.14}); text(ctx, 'Straight to the owner', 40, 70, 34, {weight: 800, fam: F.head});
    rr(ctx, 40, 100, 480, 280, 20); ctx.fillStyle = '#f6f6f3'; ctx.fill(); text(ctx, 'Feedback', 64, 148, 26, {weight: 700}); dot(ctx, 490, 140, 8, 1, C.blue, 0);
    typed(ctx, NOTE, Math.floor(clamp((T - 27.85) * 62, 0, NOTE.length)), 64, 198, 28, 430, {caret: T < 29.2});
    ctx.restore();
  }
  const nb = P(T, B.private - 0.1, 0.45, 'pop');
  if (nb > 0) { ctx.save(); ctx.translate(phoneAt[0] - 230, phoneAt[1] - 150); ctx.scale(nb, nb); card(ctx, -210, -60, 420, 120, 30, {shadow: 0.18}); dot(ctx, -160, 0, 14, 1, C.blue, 0.5);
    text(ctx, 'New private message', -130, -6, 28, {weight: 700}); text(ctx, "Meera's Tiffin Room", -130, 30, 22, {weight: 500, color: C.muted}); ctx.restore(); }
  words(ctx, T, ['Toh seedha aapko,', 'private mein.'], {x: 70, y: 1380, size: 62, align: 'left', times: [28.52, B.seedha, 29.22, 29.8, B.private], accent: {4: C.blue}, out: 30.5});
  finish(ctx, T);
  ctx.restore();
}
function mixPost(p) { return p > 0.5 ? C.green : C.blue; }

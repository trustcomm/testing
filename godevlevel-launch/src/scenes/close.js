// Chapter 4 (34.75–48.5 s): idea → level (tiles become rising bars) → one studio → "we made this video too" (pull back into an editor)
// → Go live (accent flood) → logo, LIVE, godevlevel.in.
import {W, H, C, B, F, P, env, initKit, background, card, rr, dot, words, text, pill, cursor, brandTag, measure, grain, clamp, lerp, rgba, mixHex, spring, font} from '../kit.js';
import {TILE, TS, tileRect, tile, icon, LABELS} from '../tiles.js';
import {wordmark} from './brand.js';
export const init = initKit;

const BAR = i => ({x: 96 + i * 232, y: 1400 - [230, 400, 580, 770][i], w: 192, h: [230, 400, 580, 770][i], r: 26});
const STUDIO = i => ({x: 540 - 306 + (i % 2) * 312, y: 700 + Math.floor(i / 2) * 312, w: 300, h: 300, r: 34});
const PR = {x: 112, y: 452, w: 351, h: 624};
const BTN = {x: 872, y: 404};

function stage(ctx, T, mini = false) {
  background(ctx, T, {glow: 0.14});
  if (!mini) brandTag(ctx, 1 - P(T, 42.3, 0.1, 'out'));
  words(ctx, T, ['Idea aapka.'], {y: 480, size: 100, times: [34.82, 35.2], out: 35.82});
  words(ctx, T, ['Level hamara.'], {y: 560, size: 150, weight: 700, times: [35.94, 36.38], accent: [0], out: 37.16});
  words(ctx, T, ['Ek team.', 'Poora digital studio.'], {y: 470, size: 92, lh: 1.2, times: [37.34, 37.5, 38.18, 38.44, 38.82], accent: [4]});
  const toBar = P(T, 35.8, 0.62, 'morph'), toStudio = P(T, 37.18, 0.62, 'morph');
  for (let i = 0; i < 4; i++) {
    const a = tileRect(i), b = BAR(i), s = STUDIO(i), rise = P(T, 35.86 + i * 0.09, 0.5, 'pop_soft');
    let r = {x: lerp(a.x, b.x, toBar), y: lerp(a.y, b.y + b.h * (1 - rise) * toBar, toBar), w: lerp(a.w, b.w, toBar), h: lerp(a.h, b.h * lerp(1, rise, toBar), toBar), r: lerp(a.r, b.r, toBar)};
    r = {x: lerp(r.x, s.x, toStudio), y: lerp(r.y, s.y, toStudio), w: lerp(r.w, s.w, toStudio), h: lerp(r.h, s.h, toStudio), r: lerp(r.r, s.r, toStudio)};
    const isBar = toBar * (1 - toStudio), hot = i === 3 ? isBar : 0;
    ctx.save(); if (hot > 0) { ctx.shadowColor = rgba(C.accent, 0.6 * hot); ctx.shadowBlur = 60; }
    rr(ctx, r.x, r.y, r.w, r.h, r.r); ctx.fillStyle = mixHex('#14161b', i === 3 ? C.accent : ['#1c1f26', '#262a33', '#343945'][i], isBar); ctx.fill(); ctx.restore();
    rr(ctx, r.x, r.y, r.w, r.h, r.r); ctx.strokeStyle = rgba('#343945', 1 - isBar); ctx.lineWidth = 2; ctx.stroke();
    const ia = 1 - isBar * 1.6; if (ia > 0) { ctx.save(); ctx.globalAlpha *= clamp(ia); icon(ctx, i, r.x + r.w / 2, r.y + r.h / 2 - 34 * r.w / TS, r.w / TS, T); text(ctx, LABELS[i], r.x + r.w / 2, r.y + r.h - 40 * r.w / TS, 40 * (0.55 + 0.45 * r.w / TS), {weight: 600}); ctx.restore(); }
    if (isBar > 0.3) text(ctx, 'Lv ' + (i + 1), r.x + r.w / 2, r.y + r.h - 36, 34, {family: F.mono, weight: 600, color: i === 3 ? '#fff' : C.dim, a: (isBar - 0.3) / 0.7});
  }
  // the dot climbs the levels
  const hopA = env(T, 36.0, 37.2, 0.2, 0.2);
  if (hopA > 0) { const u = clamp((T - 36.02) / 0.84) * 3, k = Math.min(2, Math.floor(u)), f = P(u - k, 0, 1, 'inOut'), b0 = BAR(k), b1 = BAR(k + 1);
    dot(ctx, lerp(b0.x, b1.x, f) + 96, lerp(b0.y, b1.y, f) - 30 - Math.sin(f * Math.PI) * 120, 22, hopA, 1.4); }
}

function editor(ctx, T, a) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a;
  card(ctx, 64, 352, 952, 1096, 36, {fill: '#0f1115', stroke: '#30343d'});
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(104 + i * 26, 402, 8, 0, 7); ctx.fillStyle = i ? '#3a3f4a' : C.accent; ctx.fill(); }
  text(ctx, 'launch-reel.gdl', 200, 412, 26, {family: F.mono, weight: 500, color: C.dim, align: 'left'});
  // layers panel
  text(ctx, 'LAYERS', 510, 500, 24, {family: F.body, weight: 600, color: C.dim, align: 'left'});
  ['hook', 'website', 'motion', '3D model', 'AI', 'logo'].forEach((n, i) => { const p = P(T, 39.9 + i * 0.06, 0.35, 'pop_soft'), yy = 548 + i * 62; ctx.save(); ctx.globalAlpha *= clamp(p * 1.4); ctx.translate((1 - p) * 40, 0);
    rr(ctx, 500, yy - 24, 470, 50, 12); ctx.fillStyle = i === 5 ? rgba(C.accent, 0.14) : '#171a20'; ctx.fill(); ctx.beginPath(); ctx.arc(530, yy, 8, 0, 7); ctx.fillStyle = i === 5 ? C.accent : '#4b5160'; ctx.fill();
    text(ctx, n, 556, yy + 10, 28, {family: F.mono, weight: 500, color: i === 5 ? C.ink : C.muted, align: 'left'}); ctx.restore(); });
  // timeline
  rr(ctx, 96, 1124, 888, 290, 22); ctx.fillStyle = '#131519'; ctx.fill();
  const cl = [[0, 0.21], [0.21, 0.43], [0.43, 0.72], [0.72, 1]];
  for (let row = 0; row < 4; row++) cl.forEach(([s, e], i) => { if ((i + row) % 2 && row > 1) return; const x = 120 + s * 840, w = (e - s) * 840 - 8, yy = 1156 + row * 60; rr(ctx, x, yy, w * P(T, 39.95 + i * 0.07 + row * 0.04, 0.4, 'out'), 44, 10); ctx.fillStyle = row === 0 ? rgba(C.accent, 0.85) : ['#2a2e37', '#23262e', '#1c1f26'][row - 1]; ctx.fill(); });
  const ph = 120 + 840 * lerp(0.80, 0.865, clamp((T - 39.7) / 2.7)); ctx.fillStyle = '#fff'; ctx.fillRect(ph - 2, 1136, 4, 270); ctx.beginPath(); ctx.moveTo(ph - 12, 1130); ctx.lineTo(ph + 12, 1130); ctx.lineTo(ph, 1150); ctx.fill();
  // Go live button
  const press = env(T, B.live - 0.06, B.live + 0.2, 0.06, 0.12);
  ctx.save(); ctx.translate(BTN.x, BTN.y); ctx.scale(1 - 0.1 * press, 1 - 0.1 * press); ctx.shadowColor = rgba(C.accent, 0.6); ctx.shadowBlur = 30; rr(ctx, -96, -34, 192, 68, 34); ctx.fillStyle = C.accent; ctx.fill(); ctx.shadowColor = 'transparent';
  text(ctx, 'Go live', 0, 12, 34, {family: F.body, weight: 700}); ctx.restore();
  ctx.restore();
}

function finale(ctx, T, inverted) {
  const k = 1 + 0.035 * clamp((T - 43) / 5.5); ctx.save(); ctx.translate(540, 960); ctx.scale(k, k); ctx.translate(-540, -960);
  if (inverted) { // on the accent flood: black letters, white "Dev"
    const parts = [['Go', '#0a0a0a'], ['Dev', '#ffffff'], ['Level', '#0a0a0a']], ws = parts.map(p => measure(ctx, p[0], 150, 700)); let x = 540 - ws.reduce((s, v) => s + v, 0) / 2;
    parts.forEach(([s, c], i) => { text(ctx, s, x, 900, 150, {weight: 700, color: c, align: 'left'}); x += ws[i]; });
  } else wordmark(ctx, 540, 900, 150);
  ctx.restore();
}

export function draw(ctx, _t, {t: T}) {
  const pb = P(T, 39.62, 0.78, 'out_front');
  if (pb <= 0) stage(ctx, T);
  else {
    background(ctx, T, {glow: 0.12}); brandTag(ctx, 1);
    editor(ctx, T, clamp(pb * 1.3));
    const kx = lerp(1, PR.w / W, pb), ox = lerp(0, PR.x, pb), oy = lerp(0, PR.y, pb);
    ctx.save(); rr(ctx, ox, oy, W * kx, H * kx, 22 * pb); ctx.clip(); ctx.translate(ox, oy); ctx.scale(kx, kx); stage(ctx, T, true); ctx.restore();
    rr(ctx, ox, oy, W * kx, H * kx, 22 * pb); ctx.strokeStyle = rgba('#3a3f4a', pb); ctx.lineWidth = 2; ctx.stroke();
    words(ctx, T, ['Yeh video bhi', 'humne banaya.'], {x: 735, y: 1000, size: 62, lh: 1.2, times: [40.44, 40.64, 40.8, 41.12, 41.58], accent: [3]});
    // cursor to "Go live"
    const cin = P(T, 40.9, 1.25, 'camera_s'); if (cin > 0) cursor(ctx, lerp(1010, BTN.x + 14, cin), lerp(1500, BTN.y + 6, cin) - Math.sin(cin * Math.PI) * 60, 1.5, env(T, B.live - 0.06, B.live + 0.2, 0.06, 0.12));
  }
  // ── Go live: the accent floods the frame from the button, then shrinks into the LIVE dot ──
  const fl = P(T, B.live, 0.42, 'flood'), back = P(T, 43.12, 0.6, 'morph');
  if (fl > 0) {
    const LD = {x: 438, y: 1082}, cx = lerp(BTN.x, LD.x, back), cy = lerp(BTN.y, LD.y, back), rad = lerp(lerp(40, 2300, fl), 13, back);
    if (back > 0) { // black stage with the final lock-up under the shrinking flood
      background(ctx, T, {glow: 0.2, glowY: 900}); finale(ctx, T, false);
      // LIVE pill
      const lp = P(T, B.live_word - 0.05, 0.4, 'pop_soft'); if (lp > 0) { ctx.save(); ctx.globalAlpha *= clamp(lp * 1.5); ctx.translate(540, 1082); ctx.scale(0.8 + 0.2 * lp, 0.8 + 0.2 * lp);
        rr(ctx, -140, -44, 280, 88, 44); ctx.fillStyle = rgba(C.accent, 0.13); ctx.fill(); ctx.strokeStyle = rgba(C.accent, 0.6); ctx.lineWidth = 2.5; ctx.stroke();
        text(ctx, 'LIVE', 26, 17, 48, {weight: 700, color: C.ink}); ctx.restore(); }
      const pr = (T * 1.1) % 1; ctx.beginPath(); ctx.arc(LD.x, LD.y, 13 + pr * 26, 0, 7); ctx.strokeStyle = rgba(C.accent, 0.5 * (1 - pr) * P(T, 43.7, 0.3, 'out')); ctx.lineWidth = 3; ctx.stroke();
      // visit
      words(ctx, T, ['Aaj hi visit karo'], {y: 1214, size: 46, weight: 500, color: C.muted, times: [44.24, 44.5, 44.6, 44.78]});
      const bp = P(T, 44.9, 0.45, 'pop_soft'), clicked = P(T, 46.78, 0.3, 'out');
      if (bp > 0) { ctx.save(); ctx.globalAlpha *= clamp(bp * 1.5); ctx.translate(540, 1312); ctx.scale(0.9 + 0.1 * bp, 0.9 + 0.1 * bp);
        ctx.shadowColor = rgba(C.accent, 0.5 * clicked); ctx.shadowBlur = 50; rr(ctx, -370, -62, 740, 124, 62); ctx.fillStyle = '#14161b'; ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.strokeStyle = mixHex('#343945', C.accent, clicked); ctx.lineWidth = 3 + clicked * 2; ctx.stroke();
        ctx.strokeStyle = '#8b93a1'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-306, 0, 20, 0, 7); ctx.moveTo(-326, 0); ctx.lineTo(-286, 0); ctx.ellipse(-306, 0, 9, 20, 0, 0, 7); ctx.stroke();
        const str = 'godevlevel.in', n = Math.floor(clamp((T - B.url) * 13, 0, str.length)); ctx.font = font(64, 700, F.display); ctx.letterSpacing = '-1px'; ctx.textAlign = 'left';
        const w0 = ctx.measureText('go').width, w1 = ctx.measureText('godev').width; ctx.fillStyle = C.ink; ctx.fillText(str.slice(0, n), -262, 22);
        if (n > 2) { ctx.fillStyle = C.accent; ctx.fillText(str.slice(2, Math.min(n, 5)), -262 + w0, 22); }
        if (n < str.length || (T < 46.7 && Math.floor(T * 2.5) % 2 === 0)) { ctx.fillStyle = C.accent; ctx.fillRect(-262 + ctx.measureText(str.slice(0, n)).width + 5, -30, 5, 60); } ctx.letterSpacing = '0px';
        ctx.restore();
        const rg = P(T, 46.78, 0.6, 'out'); if (rg > 0 && rg < 1) { rr(ctx, 170 - rg * 40, 1250 - rg * 40, 740 + rg * 80, 124 + rg * 80, 62 + rg * 40); ctx.strokeStyle = rgba(C.accent, 0.6 * (1 - rg)); ctx.lineWidth = 4; ctx.stroke(); } }
      text(ctx, 'Websites  ·  Motion  ·  3D  ·  AI', 540, 1436, 36, {family: F.body, weight: 500, color: C.muted, a: P(T, 46.2, 0.5, 'out')});
      const c2 = P(T, 45.9, 0.85, 'camera_s'); if (c2 > 0) cursor(ctx, lerp(1060, 800, c2), lerp(1560, 1330, c2) - Math.sin(c2 * Math.PI) * 50, 1.5, env(T, 46.72, 46.98, 0.06, 0.12));
    }
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.clip(); ctx.fillStyle = C.accent; ctx.fillRect(0, 0, W, H);
    const wa = P(T, B.live + 0.12, 0.3, 'out'); if (wa > 0) { ctx.globalAlpha = wa; finale(ctx, T, true); }
    ctx.restore();
    if (back >= 1) dot(ctx, LD.x, LD.y, 13, 1, 1.6);
  }
  grain(ctx, T);
}

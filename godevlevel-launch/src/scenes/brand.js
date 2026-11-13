// Chapter 2 (10.1–21.0 s): the dot becomes GoDevLevel; templates are thrown out; code builds a site; <1s, mobile first, made to fit.
// Starts on the accent dot at (540, 860); ends on a phone at x 330–750, y 390–1170 (handed to chapter 3).
import {W, H, C, B, F, P, env, initKit, background, card, rr, dot, words, text, pill, measure, grain, clamp, lerp, rgba, hash, mixHex, spring, font} from '../kit.js';
export const init = initKit;

export function wordmark(ctx, cx, y, size, a = 1, spread = 0, T = 0, t0 = -1) {
  const parts = ['G', 'o', 'D', 'e', 'v', 'L', 'e', 'v', 'e', 'l'], ws = parts.map(p => measure(ctx, p, size, 700) - 0.0 * size), total = ws.reduce((s, v) => s + v, 0);
  let x = cx - total / 2; const out = {dev: [0, 0]};
  parts.forEach((ch, i) => {
    const p = t0 < 0 ? 1 : P(T, t0 + i * 0.035, 0.5, 'out'), mid = x + ws[i] / 2, px = cx + (mid - cx) * (1 + spread * (1 - p) + 0.45 * (1 - p));
    if (i === 2) out.dev[0] = x; if (i === 4) out.dev[1] = x + ws[i];
    if (p > 0.01) { ctx.save(); ctx.globalAlpha *= clamp(a * p); const bl = (1 - p) * size * 0.12; if (bl > 0.4) ctx.filter = `blur(${bl.toFixed(1)}px)`;
      text(ctx, ch, px, y + (1 - p) * size * 0.18, size, {weight: 700, color: i >= 2 && i <= 4 ? C.accent : C.ink}); ctx.restore(); }
    x += ws[i];
  });
  return out;
}

const CODE = [['Hero', ' title="Aapka brand" />', 13.6], ['Menu', ' items={products} />', 14.15], ['Order', ' via="WhatsApp" />', 14.7], ['Speed', ' load="<1s" />', 15.25]];
const VARS = [null, ['Cafe menu', 'grid'], ['Store catalog', 'rows'], ['Book a visit', 'cal']];

// the site being built; r = rect, b = per-block progress [hero, menu, order, speed], v = variant id, vp = variant slide progress
export function site(ctx, r, b, T, phone = 0, v = 0, vPrev = 0, vp = 1) {
  const {x, y, w, h} = r;
  card(ctx, x, y, w, h, lerp(24, 48, phone), {fill: '#14161b', stroke: '#30343d'});
  ctx.save(); rr(ctx, x, y, w, h, lerp(24, 48, phone)); ctx.clip();
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x + 30 + i * 22, y + 28, 6, 0, 7); ctx.fillStyle = '#3a3f4a'; ctx.fill(); }
  if (b[3] > 0) pill(ctx, '<1s', x + w - 70, y + 28, {size: 22, a: clamp(b[3] * 2), scale: 0.6 + 0.4 * b[3], h: 34, padX: 14});
  const layer = (vid, dy, a) => {
    if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, dy);
    const px = x + 22, pw = w - 44, hy = y + 56, hh = h * lerp(0.3, 0.24, phone), title = vid ? VARS[vid][0] : 'Aapka brand', kind = vid ? VARS[vid][1] : 'grid3';
    if (b[0] > 0) { ctx.save(); ctx.globalAlpha *= clamp(b[0] * 1.5); ctx.translate(px + pw / 2, hy + hh / 2); ctx.scale(0.9 + 0.1 * b[0], 0.9 + 0.1 * b[0]);
      rr(ctx, -pw / 2, -hh / 2, pw, hh, 16); ctx.fillStyle = '#23262e'; ctx.fill();
      text(ctx, title, -pw / 2 + 24, -hh / 2 + hh * 0.52, Math.min(46, pw * 0.105), {align: 'left', weight: 700});
      rr(ctx, -pw / 2 + 24, -hh / 2 + hh * 0.68, pw * 0.5, 10, 5); ctx.fillStyle = '#3a404c'; ctx.fill(); ctx.restore(); }
    const ty = hy + hh + 16, bh = lerp(64, 78, phone), by = y + h - bh - 22, th = by - ty - 16;
    if (b[1] > 0) {
      const cells = kind === 'grid3' ? (w > 520 ? [3, 1] : [2, 2]) : kind === 'grid' ? [2, 2] : kind === 'rows' ? [1, 3] : [4, 3];
      for (let j = 0; j < cells[0] * cells[1]; j++) {
        const cxn = j % cells[0], cyn = Math.floor(j / cells[0]), g = 12, cw = (pw - g * (cells[0] - 1)) / cells[0], chh = (th - g * (cells[1] - 1)) / cells[1];
        const p = clamp(b[1] * 1.6 - j * 0.12), s = 0.8 + 0.2 * p; if (p <= 0) continue;
        ctx.save(); ctx.globalAlpha *= p; ctx.translate(px + cxn * (cw + g) + cw / 2, ty + cyn * (chh + g) + chh / 2); ctx.scale(s, s);
        rr(ctx, -cw / 2, -chh / 2, cw, chh, kind === 'cal' ? 10 : 14); ctx.fillStyle = kind === 'cal' && j === 6 ? C.accent : '#262a33'; ctx.fill();
        if (kind === 'rows') { ctx.beginPath(); ctx.arc(-cw / 2 + chh / 2, 0, chh * 0.28, 0, 7); ctx.fillStyle = '#3a404c'; ctx.fill(); rr(ctx, -cw / 2 + chh, -6, cw * 0.45, 12, 6); ctx.fill(); }
        else if (kind !== 'cal') { rr(ctx, -cw / 2 + 12, chh / 2 - 26, cw * 0.55, 10, 5); ctx.fillStyle = '#3a404c'; ctx.fill(); }
        ctx.restore();
      }
    }
    if (b[2] > 0) { const bw = lerp(Math.min(330, pw), pw, phone), s = 0.7 + 0.3 * b[2]; ctx.save(); ctx.globalAlpha *= clamp(b[2] * 1.5); ctx.translate(px + bw / 2, by + bh / 2); ctx.scale(s, s);
      ctx.shadowColor = rgba(C.accent, 0.5); ctx.shadowBlur = 26; rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fillStyle = C.accent; ctx.fill(); ctx.shadowColor = 'transparent';
      text(ctx, vid === 3 ? 'Book now' : 'Order on WhatsApp', 0, 10, Math.min(30, bw * 0.085), {family: F.body, weight: 600}); ctx.restore(); }
    ctx.restore();
  };
  if (vp < 1) layer(vPrev, -h * 0.12 * vp, 1 - vp);
  layer(v, vp < 1 ? h * 0.12 * (1 - vp) : 0, vp);
  ctx.restore();
}

function stat(ctx, T, x, value, label, t0, big = false) {
  const p = spring(T - t0, 2.6, 0.5), a = clamp((T - t0) / 0.15) * (1 - P(T, 18.5, 0.25, 'in')); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, 1372); ctx.scale(0.7 + 0.3 * p, 0.7 + 0.3 * p);
  text(ctx, value, 0, 0, 78, {weight: 700, color: big ? C.accent : C.ink}); text(ctx, label, 0, 46, 25, {family: F.body, weight: 600, color: C.muted}); ctx.restore();
  const ring = P(T, t0, 0.5, 'out'); if (ring < 1 && big) { ctx.beginPath(); ctx.arc(x, 1350, 60 + ring * 110, 0, 7); ctx.strokeStyle = rgba(C.accent, 0.6 * (1 - ring)); ctx.lineWidth = 4; ctx.stroke(); }
}

export function draw(ctx, _t, {t: T}) {
  background(ctx, T, {glow: 0.15});
  // ── wordmark: dot → ring → letters; then it docks as the brand tag ──
  const dock = P(T, 11.92, 0.62, 'camera_s'), size = lerp(152, 44, dock), wy = lerp(900, 300, dock), push = 1 + 0.05 * clamp((T - 10.7) / 1.3) * (1 - dock);
  words(ctx, T, ['Ab milo'], {y: 700, size: 60, weight: 500, color: C.muted, times: [B.milo, B.milo + 0.22], out: 11.85});
  ctx.save(); ctx.translate(540, wy); ctx.scale(push, push); ctx.translate(-540, -wy);
  const dev = wordmark(ctx, 540, wy, size, 1, 0, T, B.brand - 0.06);
  const bar = P(T, B.brand + 0.05, 0.45, 'morph'), barOut = 1 - dock;
  if (T < 10.75 || bar < 1 || barOut > 0) {
    const pulse = T < B.brand ? 1 + 0.18 * Math.sin(T * 5.2) : 1, bx = lerp(540 - 14, dev.dev[0], bar), bw = lerp(28, dev.dev[1] - dev.dev[0], bar), by = lerp(860 - 14, wy + 30, bar), bh = lerp(28, 10, bar);
    ctx.save(); ctx.globalAlpha *= barOut; ctx.shadowColor = rgba(C.accent, 0.9); ctx.shadowBlur = 26; ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(pulse, pulse);
    rr(ctx, -bw / 2, -bh / 2, bw, bh, 14); ctx.fillStyle = C.accent; ctx.fill(); ctx.restore();
  }
  ctx.restore();
  const ring = P(T, B.brand - 0.02, 0.7, 'out'); if (ring > 0 && ring < 1) { ctx.beginPath(); ctx.arc(540, 860, 30 + ring * 760, 0, 7); ctx.strokeStyle = rgba(C.accent, 0.55 * (1 - ring)); ctx.lineWidth = 6 * (1 - ring) + 1; ctx.stroke(); }

  // ── templates thrown out ──
  for (let i = 0; i < 3; i++) {
    const p = P(T, B.no_templates + i * 0.07, 0.45, 'pop_soft'), ft = Math.max(0, T - 12.74 - i * 0.05), a = clamp(p * 1.5) * (1 - clamp((ft - 0.35) / 0.3)); if (a <= 0) continue;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(540 + (i - 1) * 250 * p, 800 + 1700 * ft * ft + (1 - p) * 60); ctx.rotate((i - 1) * 0.2 * p + (i - 1) * 1.6 * ft); ctx.scale(0.85 + 0.15 * p, 0.85 + 0.15 * p);
    card(ctx, -150, -200, 300, 400, 22, {fill: '#191c22', stroke: '#3a3f4a'});
    ctx.setLineDash([9, 8]); ctx.strokeStyle = 'rgba(139,147,161,0.55)'; ctx.lineWidth = 2;
    [[-126, -176, 252, 120], [-126, -40, 120, 90], [6, -40, 120, 90], [-126, 66, 252, 16], [-126, 96, 170, 16]].forEach(b => { rr(ctx, ...b, 8); ctx.stroke(); }); ctx.setLineDash([]);
    ctx.restore();
  }
  const sl = P(T, B.nahi_lagate, 0.22, 'whip'), slOut = 1 - P(T, 12.95, 0.25, 'in');
  if (sl > 0 && slOut > 0) { ctx.save(); ctx.globalAlpha *= slOut; ctx.strokeStyle = C.accent; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.shadowColor = rgba(C.accent, 0.8); ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.moveTo(110, 1010); ctx.lineTo(110 + 860 * sl, 1010 - 400 * sl); ctx.stroke(); ctx.restore(); }
  words(ctx, T, ['Templates nahi.'], {y: 1290, size: 124, times: [12.16, 12.56], accent: [1], out: 13.32});

  // ── code builds the site ──
  const eIn = P(T, 13.4, 0.5, 'pop_soft'), eOut = P(T, 15.72, 0.4, 'in');
  if (eIn > 0 && eOut < 1) {
    ctx.save(); ctx.globalAlpha *= clamp(eIn * 1.5) * (1 - eOut); ctx.translate(540, 590 - eOut * 160); ctx.scale(0.92 + 0.08 * eIn, 0.92 + 0.08 * eIn); ctx.translate(-540, -590);
    card(ctx, 80, 380, 920, 420, 28, {fill: '#111318', stroke: '#30343d'});
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(116 + i * 24, 414, 7, 0, 7); ctx.fillStyle = i === 0 ? C.accent : '#3a3f4a'; ctx.fill(); }
    text(ctx, 'Home.jsx', 540, 424, 26, {family: F.mono, weight: 500, color: C.dim});
    ctx.font = font(40, 500, F.mono); const cw = ctx.measureText('M').width;
    CODE.forEach(([name, rest, t0], i) => {
      const full = '<' + name + rest, n = Math.floor(clamp((T - t0) * 52, 0, full.length)), yy = 512 + i * 72;
      text(ctx, String(i + 1), 128, yy, 30, {family: F.mono, weight: 400, color: '#4b5160', align: 'right'});
      if (n <= 0) return; ctx.font = font(40, 500, F.mono); ctx.textAlign = 'left';
      ctx.fillStyle = '#c9d0db'; ctx.fillText(full.slice(0, n), 160, yy); ctx.fillStyle = C.accent; ctx.fillText(name.slice(0, Math.max(0, n - 1)), 160 + cw, yy);
      if (n < full.length || (i === 3 && Math.floor(T * 2.5) % 2 === 0)) { ctx.fillStyle = C.accent; ctx.fillRect(160 + n * cw + 3, yy - 34, 4, 42); }
    });
    ctx.restore();
  }
  // site mock rectangle: browser under the editor → hero position → phone
  const sIn = P(T, 13.5, 0.5, 'pop_soft'), up = P(T, 15.78, 0.6, 'camera_s'), ph = P(T, B.mobile_first - 0.05, 0.55, 'morph');
  if (sIn > 0) {
    let r = {x: 140, y: lerp(836, 420, up), w: 800, h: lerp(360, 470, up)};
    r = {x: lerp(r.x, 330, ph), y: lerp(r.y, 390, ph), w: lerp(r.w, 420, ph), h: lerp(r.h, 780, ph)};
    const b = CODE.map(([n, rest, t0]) => P(T, t0 + (1 + n.length + rest.length) / 52 + 0.18, 0.45, 'pop_soft'));
    // variants on "zaroorat"
    const vt = [18.86, 19.52, 20.14]; let v = 0, vPrev = 0, vp = 1; vt.forEach((t0, i) => { if (T >= t0) { vPrev = i; v = i + 1; vp = P(T, t0, 0.34, 'out'); } });
    ctx.save(); ctx.globalAlpha *= clamp(sIn * 1.5); const s = 0.92 + 0.08 * sIn; ctx.translate(540, r.y + r.h / 2); ctx.scale(s, s); ctx.translate(-540, -(r.y + r.h / 2));
    site(ctx, r, b, T, ph, v, vPrev, vp); ctx.restore();
    // the dot carries each line of code down into the page
    CODE.forEach(([n, rest, t0], i) => {
      const t1 = t0 + (1 + n.length + rest.length) / 52, p = P(T, t1, 0.2, 'inOut'); if (p <= 0 || p >= 1 || up > 0) return;
      const sx = 160 + (1 + n.length + rest.length) * 24.1, sy = 500 + i * 72, tx = [540, 540, 330, 870][i], ty = [920, 1020, 1140, 866][i];
      dot(ctx, lerp(sx, tx, p), lerp(sy, ty, p) - Math.sin(p * Math.PI) * 40, 9, 1, 1.4);
    });
    // variant label
    ['Cafe', 'Kirana store', 'Clinic'].forEach((lab, i) => { const a = env(T, vt[i], i < 2 ? vt[i + 1] + 0.1 : 20.8, 0.3, 0.2); if (a > 0) pill(ctx, lab, 540, 1236 + (1 - a) * 14, {size: 34, a, fill: 'rgba(255,255,255,0.06)', stroke: C.line, color: C.ink}); });
  }
  pill(ctx, 'Hand-coded, line by line', 540, 1262, {size: 30, a: env(T, B.code, 15.75, 0.3, 0.2)});
  // load race
  const rc = env(T, 15.95, 17.38, 0.3, 0.22);
  if (rc > 0) {
    ctx.save(); ctx.globalAlpha *= rc;
    [['Template', 0.1 + 0.2 * (1 - Math.exp(-(T - 16) * 0.8)), '#4b5160', C.muted], ['GoDevLevel', P(T, 16.12, 0.36, 'out_front'), C.accent, C.ink]].forEach(([lab, f, col, tc], i) => {
      const yy = 1010 + i * 120; text(ctx, lab, 140, yy, 40, {align: 'left', weight: 600, color: tc});
      rr(ctx, 140, yy + 22, 800, 22, 11); ctx.fillStyle = '#1c1f26'; ctx.fill(); rr(ctx, 140, yy + 22, Math.max(22, 800 * clamp(f)), 22, 11); ctx.fillStyle = col; ctx.fill();
      if (i === 1) dot(ctx, 140 + 800 * clamp(f) - 11, yy + 33, 15, 1, 1.5);
    });
    ctx.restore();
  }
  // the site's own three numbers
  stat(ctx, T, 220, '100%', 'HAND-CODED', B.code);
  stat(ctx, T, 540, '<1s', 'LOAD TIME', 16.56, true);
  stat(ctx, T, 860, 'Mobile', 'FIRST, ALWAYS', B.mobile_first);
  words(ctx, T, ['Bilkul aapki zaroorat', 'ke hisaab se.'], {y: 1356, size: 84, lh: 1.14, times: [18.78, 19.18, 19.68, 20.04, 20.22, 20.56], accent: [2], out: 20.74});
  grain(ctx, T);
}

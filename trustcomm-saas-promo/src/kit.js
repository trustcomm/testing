// Trustcomm reel — shared look and helpers (MotionSmith SaaS Launch, bright-flat, recoloured to trustcomm.app).
// Every function is a pure function of the absolute time T (seconds).
import {clamp, lerp, bezier, hash} from './lib/core.js';
export {clamp, lerp, hash};

export const W = 1080, H = 1920;
export const C = {stage: '#faf9f6', ink: '#12151c', muted: '#667085', line: '#e4e4e0', blue: '#1f5eff', blueSoft: '#e3e9fb', white: '#ffffff', red: '#e24a29', google: '#fbbc04', green: '#16a34a'};
export const F = {head: 'Plus Jakarta Sans', ui: 'Inter', kn: 'Noto Sans Kannada', ta: 'Noto Sans Tamil', te: 'Noto Sans Telugu', hi: 'Noto Sans Devanagari'};

// SaaS Launch easing tokens (style.json → easing)
const EZ = {out: [0.16, 1, 0.3, 1], in: [0.32, 0, 0.67, 0], inOut: [0.65, 0, 0.35, 1], pop: [0.24, 1.17, 0.07, 1.09], spring: [0.3, 1.7, 0.5, 1.05],
  camera: [0.52, 0.15, 0.31, 0.93], morph: [0.73, 0.6, 0.11, 1.03], blur: [0.6, 0.01, 0.26, 0.85], snap: [0.08, 0, 0.04, 0.91], whip: [0.45, 0.99, 0, 1.07], front: [0.1, 0.6, 0.08, 0.91], toggle: [0.64, 1.54, 0.2, 0.87], flood: [0.21, 1.43, 0, 0.78]};
const cache = {};
export const ease = (n) => cache[n] ||= bezier(...EZ[n]);
export const P = (T, t0, d, e = 'out') => ease(e)(clamp((T - t0) / d));
export const env = (T, t0, t1, din = 0.3, dout = 0.25) => P(T, t0, din, 'out') * (1 - P(T, t1 - dout, dout, 'in'));
export const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
export const mixHex = (a, b, p) => { const A = parseInt(a.slice(1), 16), B2 = parseInt(b.slice(1), 16); const ch = s => Math.round(lerp((A >> s) & 255, (B2 >> s) & 255, clamp(p))); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };

export const IMG = {}, B = {}, I18N = {}, SCR = {}, QRM = {rows: []};
const LIST = ['counter_plate', 'customers_leaving', 'customers_smiling', 'food_coffee', 'food_dosa', 'hand_phone_scan', 'owner_meera', 'phone_front', 'qr_stand'];
let ready;
export function initKit() {
  return ready ||= (async () => {
    const faces = [[F.head, '/assets/fonts/PlusJakartaSans.ttf', '200 800'], [F.ui, '/assets/fonts/Inter-Variable.woff2', '100 900'], [F.kn, '/assets/fonts/NotoSansKannada-sub.woff2', '400'],
      [F.ta, '/assets/fonts/NotoSansTamil-sub.woff2', '400'], [F.te, '/assets/fonts/NotoSansTelugu-sub.woff2', '400'], [F.hi, '/assets/fonts/NotoSansDevanagari-sub.woff2', '400']];
    for (const [fam, url, w] of faces) document.fonts.add(await new FontFace(fam, `url(${url})`, {weight: w}).load());
    Object.assign(B, (await (await fetch('/assets/beats.json')).json()).beats);
    Object.assign(I18N, await (await fetch('/assets/i18n.json')).json());
    Object.assign(SCR, await (await fetch('/assets/images/cut/screens.json')).json());
    Object.assign(QRM, await (await fetch('/assets/qr.json')).json());
    await Promise.all(LIST.map(k => new Promise((ok, no) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => no(Error('missing ' + k)); i.src = `/assets/images/cut/${k}.png`; })));
  })();
}

// ── drawing ──
export function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
export function card(ctx, x, y, w, h, r = 36, {fill = C.white, stroke = C.line, lw = 2, shadow = 0.12, blur = 60, oy = 24} = {}) {
  ctx.save(); if (shadow) { ctx.shadowColor = `rgba(18,21,28,${shadow})`; ctx.shadowBlur = blur; ctx.shadowOffsetY = oy; }
  rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  if (stroke) { rr(ctx, x, y, w, h, r); ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
/** pick a font family for a string by script */
export function famFor(s, fallback = F.ui) {
  if (/[ಀ-೿]/.test(s)) return F.kn; if (/[஀-௿]/.test(s)) return F.ta; if (/[ఀ-౿]/.test(s)) return F.te; if (/[ऀ-ॿ]/.test(s)) return F.hi; return fallback;
}
export function font(size, weight = 600, fam = F.ui) { return `${weight} ${size}px "${fam}"`; }
export function text(ctx, s, x, y, size, {weight = 600, fam, color = C.ink, align = 'left', a = 1, track = 0, maxW} = {}) {
  if (a <= 0 || !s) return 0; fam ||= famFor(s); ctx.save(); ctx.globalAlpha *= clamp(a); ctx.font = font(size, weight, fam); ctx.letterSpacing = `${track}px`;
  ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color;
  if (maxW) { const w = ctx.measureText(s).width; if (w > maxW) { ctx.translate(x, y); ctx.scale(maxW / w, 1); ctx.fillText(s, 0, 0); ctx.restore(); return maxW; } }
  ctx.fillText(s, x, y); const w = ctx.measureText(s).width; ctx.restore(); return w;
}
export function measure(ctx, s, size, weight = 600, fam, track = 0) { ctx.font = font(size, weight, fam || famFor(s)); ctx.letterSpacing = `${track}px`; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }
/** word-by-word blur-in headline (SaaS Launch word-blur-in). lines: strings; times per word; accent: {wordIndex: colour} */
export function words(ctx, T, lines, {x = W / 2, y, size = 92, weight = 800, fam = F.head, lh = 1.08, color = C.ink, times, t0 = 0, gap = 0.1, accent = {}, out = 1e9, align = 'center', dur = 0.4, track = -0.02} = {}) {
  const q = P(T, out, 0.28, 'in'); if (q >= 1) return;
  ctx.font = font(size, weight, fam); ctx.letterSpacing = `${track * size}px`; ctx.textBaseline = 'alphabetic';
  const space = ctx.measureText(' ').width; let k = 0;
  lines.forEach((ln, li) => {
    const ws = ln.split(' '), wd = ws.map(w => ctx.measureText(w).width), tot = wd.reduce((s, v) => s + v, 0) + space * (ws.length - 1);
    let cx = align === 'center' ? x - tot / 2 : align === 'right' ? x - tot : x; const cy = y + li * size * lh;
    ws.forEach((w, i) => {
      const tw = times ? times[Math.min(k, times.length - 1)] + (k >= times.length ? (k - times.length + 1) * 0.08 : 0) : t0 + k * gap;
      const p = P(T, tw, dur, 'blur'), a = p * (1 - q);
      if (a > 0.003) { ctx.save(); ctx.globalAlpha *= clamp(a); const bl = (1 - p) * size * 0.14 + q * size * 0.1; if (bl > 0.4) ctx.filter = `blur(${bl.toFixed(1)}px)`;
        ctx.fillStyle = accent[k] || color; ctx.textAlign = 'left'; ctx.fillText(w, cx, cy + (1 - p) * size * 0.25 - q * size * 0.2); ctx.restore(); }
      cx += wd[i] + space; k++;
    });
  });
  ctx.letterSpacing = '0px';
}
export function pill(ctx, label, x, y, {size = 32, fill = C.white, color = C.ink, stroke = C.line, a = 1, s = 1, padX = 28, h, weight = 600, fam, icon, iconW = 0} = {}) {
  if (a <= 0) return 0; const tw = measure(ctx, label, size, weight, fam), w = tw + padX * 2 + iconW, hh = h || size * 2;
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate(x, y); ctx.scale(s, s);
  ctx.save(); ctx.shadowColor = 'rgba(18,21,28,0.08)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6; rr(ctx, -w / 2, -hh / 2, w, hh, hh / 2); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  if (stroke) { rr(ctx, -w / 2, -hh / 2, w, hh, hh / 2); ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  if (icon) icon(ctx, -w / 2 + padX + iconW / 2 - 6, 0);
  text(ctx, label, -w / 2 + padX + iconW, size * 0.36, size, {weight, fam, color}); ctx.restore(); return w;
}
export function star(ctx, x, y, r, fill, stroke = C.muted, lw = 3) {
  ctx.save(); ctx.translate(x, y); ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rad, Math.sin(a) * rad); } ctx.closePath();
  ctx.lineJoin = 'round'; if (fill) { ctx.fillStyle = fill; ctx.fill(); } else { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } ctx.restore();
}
export function tick(ctx, x, y, r, p, color = C.blue, lw) {
  if (p <= 0) return; ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw || r * 0.3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const a = clamp(p * 2.4), b = clamp((p - 0.42) / 0.58); ctx.beginPath(); ctx.moveTo(x - r, y);
  ctx.lineTo(x + lerp(-r, -r * 0.25, a), y + lerp(0, r * 0.7, a)); if (b > 0) ctx.lineTo(x + lerp(-r * 0.25, r, b), y + lerp(r * 0.7, -r * 0.75, b)); ctx.stroke(); ctx.restore();
}
export function dot(ctx, x, y, r, a = 1, color = C.blue, glow = 0.6) {
  if (a <= 0 || r <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); if (glow) { ctx.shadowColor = rgba(color, glow); ctx.shadowBlur = r * 2.4; }
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore();
}
/** stroke a polyline/path given as points, drawn on up to progress p (0..1) */
export function drawPath(ctx, pts, p, {color = C.blue, lw = 8, cap = 'round'} = {}) {
  if (p <= 0 || pts.length < 2) return null; const seg = []; let L = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let rem = L * clamp(p); ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = cap; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(...pts[0]);
  let end = pts[0]; for (let i = 1; i < pts.length; i++) { if (rem <= 0) break; const d = seg[i - 1], f = Math.min(1, rem / d); end = [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]; ctx.lineTo(...end); rem -= d; }
  ctx.stroke(); ctx.restore(); return end;
}
export function bezierPts(p0, p1, p2, p3, n = 40) { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, q = 1 - t; out.push([q * q * q * p0[0] + 3 * q * q * t * p1[0] + 3 * q * t * t * p2[0] + t * t * t * p3[0], q * q * q * p0[1] + 3 * q * q * t * p1[1] + 3 * q * t * t * p2[1] + t * t * t * p3[1]]); } return out; }

/** trustcomm wordmark: "trust" ink + "comm" blue (Plus Jakarta ExtraBold); the last m trails a line down (tail 0..1).
 *  Returns the tail's end point. reveal 0..1 slides letters out of the centre with tracking closing. */
export function wordmark(ctx, cx, y, size, {reveal = 1, tail = 0, tailLen = 300, a = 1} = {}) {
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.font = font(size, 800, F.head); ctx.letterSpacing = `${(-0.04 * size + (1 - reveal) * 0.4 * size).toFixed(1)}px`; ctx.textBaseline = 'alphabetic';
  const w1 = ctx.measureText('trust').width, w2 = ctx.measureText('comm').width, x0 = cx - (w1 + w2) / 2;
  ctx.globalAlpha *= clamp(reveal * 1.6); ctx.fillStyle = C.ink; ctx.fillText('trust', x0, y); ctx.fillStyle = C.blue; ctx.fillText('comm', x0 + w1, y); ctx.restore();
  const tx = x0 + w1 + w2 - size * 0.07, ty = y - size * 0.02;
  let end = [tx, ty]; if (tail > 0) end = drawPath(ctx, bezierPts([tx, ty], [tx + size * 0.05, ty + tailLen * 0.4], [tx, ty + tailLen * 0.7], [tx - size * 0.02, ty + tailLen]), tail, {lw: size * 0.085});
  return end;
}
/** a real, scannable QR code (assets/qr.json → https://trustcomm.app/r/demo); p reveals it diagonally */
export function qr(ctx, x, y, s, p = 1, color = C.ink) {
  const rows = QRM.rows, n = rows.length; if (!n) return; const c = s / n; ctx.save();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x - c * 2, y - c * 2, s + c * 4, s + c * 4);   // quiet zone
  ctx.fillStyle = color;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (rows[j][i] === '1' && (i + j) / (2 * n - 2) <= p * 1.02) ctx.fillRect(x + i * c, y + j * c, c + 0.6, c + 0.6);
  ctx.restore();
}
/** sprite drawn by centre (x, y) at width w */
export function sprite(ctx, img, x, y, w, {a = 1, rot = 0, s = 1, blur = 0} = {}) {
  if (a <= 0 || w <= 0) return; const h = img.height * w / img.width; ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(1)}px)`; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
}
export function cover(ctx, img, {s = 1, fx = W / 2, fy = H / 2, px = 0, py = 0, blur = 0, a = 1} = {}) {
  if (a <= 0) return; const k = Math.max(W / img.width, H / img.height), w = img.width * k, h = img.height * k;
  ctx.save(); ctx.globalAlpha *= clamp(a); if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(1)}px)`;
  ctx.translate(fx + px, fy + py); ctx.scale(s, s); ctx.translate(-fx, -fy); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); ctx.restore();
}
/** living background: warm off-white stage with two slow blue-tint blobs */
export function stage(ctx, T, {a = 1} = {}) {
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.fillStyle = C.stage; ctx.fillRect(0, 0, W, H);
  [[0.25, 0.2, 700, 0.07], [0.8, 0.75, 800, 0.06]].forEach(([fx, fy, r, al], i) => { const x = W * fx + Math.sin(T * 0.3 + i) * 80, y = H * fy + Math.cos(T * 0.25 + i * 2) * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(C.blue, al)); g.addColorStop(1, rgba(C.blue, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); });
  ctx.restore();
}
/** a tap: finger-tip circle that presses and ripples */
export function tap(ctx, x, y, T, t0, {r = 46} = {}) {
  const inn = P(T, t0 - 0.35, 0.3, 'out'), press = env(T, t0 - 0.04, t0 + 0.16, 0.06, 0.1), out = P(T, t0 + 0.45, 0.3, 'in'); if (inn <= 0 || out >= 1) return;
  const rp = P(T, t0, 0.55, 'out'); if (rp > 0 && rp < 1) { ctx.save(); ctx.globalAlpha = 1 - rp; ctx.strokeStyle = C.blue; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, r + rp * 80, 0, 7); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.globalAlpha = inn * (1 - out); ctx.translate(x + (1 - inn) * 60, y + (1 - inn) * 80); ctx.scale(1 - press * 0.15, 1 - press * 0.15);
  ctx.fillStyle = 'rgba(18,21,28,0.18)'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
}
let gcan;
export function finish(ctx, T, {grain = 0.018} = {}) {
  gcan ||= new OffscreenCanvas(270, 480); const g = gcan.getContext('2d'), img = g.createImageData(270, 480), d = img.data, f = Math.round(T * 60);
  for (let i = 0; i < d.length; i += 4) { const v = hash(i * 0.37 + f * 13.1) * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = grain * 255; }
  g.putImageData(img, 0, 0); ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(gcan, 0, 0, W, H); ctx.restore();
}

// ── the customer page (rebuild of trustcomm.app/r/demo), drawn in a 390 × 844 CSS-pixel space ──
/** st: {lang, food (0-5 stars filled, fractional ok), service, chips: [indexes ticked], dishes: [indexes ticked], scroll} */
export function customerPage(ctx, T, st = {}, vh = 844) {
  const L = I18N[st.lang || 'English'], prev = st.prevLang ? I18N[st.prevLang] : null, lp = st.langP ?? 1;
  ctx.save(); ctx.fillStyle = C.stage; ctx.fillRect(0, 0, 390, 844); ctx.translate(0, -(st.scroll || 0));
  const swap = (s0, s1, x, y, size, o = {}) => { if (prev && lp < 1) { text(ctx, s0, x, y - lp * 10, size, {...o, a: 1 - lp}); text(ctx, s1, x, y + (1 - lp) * 10, size, {...o, a: lp}); } else text(ctx, s1, x, y, size, o); };
  // progress dots
  rr(ctx, 160, 18, 26, 6, 3); ctx.fillStyle = C.blue; ctx.fill(); [195, 207].forEach(x => { ctx.beginPath(); ctx.arc(x, 21, 3, 0, 7); ctx.fillStyle = '#d0d5dd'; ctx.fill(); });
  rr(ctx, 16, 58, 46, 46, 12); ctx.fillStyle = C.blueSoft; ctx.fill(); text(ctx, 'M', 39, 90, 20, {weight: 700, color: C.blue, align: 'center', fam: F.ui});
  text(ctx, "Meera's Tiffin Room", 76, 78, 18, {weight: 700, fam: F.ui}); swap(prev?.sub, L.sub, 76, 98, 12.5, {weight: 400, color: C.muted, maxW: 296});
  // language row
  const langs = ['English', 'Hinglish', 'हिन्दी', 'ಕನ್ನಡ', 'தமிழ்', 'తెలుగు']; let x = 16;
  langs.forEach(l => { const on = l === (st.lang || 'English'), w = measure(ctx, l, 13, on ? 700 : 500); text(ctx, l, x, 146, 13, {weight: on ? 700 : 500, color: on ? C.ink : C.muted});
    if (!on) { ctx.fillStyle = '#c4c9d2'; ctx.fillRect(x, 151, w, 1.2); } else { ctx.fillStyle = C.blue; rr(ctx, x - 4, 154, w + 8, 3, 1.5); ctx.fill(); } x += w + 17; });
  const starRow = (y, n) => { for (let i = 0; i < 5; i++) { const f = clamp(n - i), cx = 52 + i * 63; star(ctx, cx, y, 17 * (1 + 0.25 * Math.sin(Math.PI * clamp(f)) * (f < 1 ? 1 : 0)), f > 0.5 ? C.blue : null, '#7a8396', 2); } };
  swap(prev?.food, L.food, 16, 196, 17, {weight: 700}); starRow(236, st.food || 0);
  swap(prev?.service, L.service, 16, 300, 17, {weight: 700}); starRow(340, st.service || 0);
  swap(prev?.mention, L.mention, 16, 404, 17, {weight: 700});
  const pickT = L.pick.length > 46 ? [L.pick.slice(0, L.pick.lastIndexOf(' ', 46)), L.pick.slice(L.pick.lastIndexOf(' ', 46) + 1)] : [L.pick];
  pickT.forEach((s, i) => text(ctx, s, 16, 428 + i * 17, 12.5, {weight: 400, color: C.muted, maxW: 358}));
  const chipRows = (labels, y0, ticked) => { let cx = 16, cy = y0; labels.forEach((lab, i) => { const on = ticked?.includes(i), w = measure(ctx, (on ? '✓ ' : '') + lab, 14, 500) + 30;
      if (cx + w > 374) { cx = 16; cy += 46; } rr(ctx, cx, cy, w, 36, 18); ctx.fillStyle = on ? C.blueSoft : C.white; ctx.fill(); ctx.strokeStyle = on ? C.blue : '#d6d9df'; ctx.lineWidth = on ? 1.6 : 1.2; ctx.stroke();
      text(ctx, (on ? '✓ ' : '') + lab, cx + 15, cy + 23, 14, {weight: on ? 600 : 500, color: on ? C.blue : C.ink}); cx += w + 9; }); return cy + 46; };
  let y = chipRows(L.chips, 456, st.chips);
  text(ctx, L.had, 16, y + 34, 17, {weight: 700}); chipRows(['Masala Dosa', 'Filter Coffee', 'Idli Vada', 'Thali'], y + 52, st.dishes);
  ctx.restore();
  // sticky continue
  const by = vh - 84; ctx.fillStyle = 'rgba(250,249,246,0.96)'; ctx.fillRect(0, by, 390, 84); ctx.fillStyle = '#e8e8e4'; ctx.fillRect(0, by, 390, 1);
  const ready = (st.food || 0) >= 1 && (st.service || 0) >= 1; rr(ctx, 16, by + 12, 358, 50, 12); ctx.fillStyle = ready ? C.blue : '#8faaf5'; ctx.fill();
  text(ctx, L.cont, 195, by + 43, 16, {weight: 600, color: '#fff', align: 'center'});
}
/** draw the customer page inside a phone image's screen; ph: {img, key, cx, cy, w} (phone centre + width in frame px) */
export function phoneWithPage(ctx, T, ph, st, {under} = {}) {
  const img = IMG[ph.key], s = SCR[ph.key], k = ph.w / img.width, h = img.height * k, x0 = ph.cx - ph.w / 2, y0 = ph.cy - h / 2;
  const sx = x0 + s.x * k, sy = y0 + s.y * k, sw = s.w * k, sh = s.h * k;
  ctx.save(); rr(ctx, sx, sy, sw, sh, sw * 0.1); ctx.clip(); ctx.fillStyle = C.stage; ctx.fillRect(sx, sy, sw, sh);
  if (under) under(ctx, sx, sy, sw, sh); else { ctx.translate(sx, sy + sh * 0.035); const u = sw / 390; ctx.scale(u, u); customerPage(ctx, T, st, sh * 0.965 / u); }
  ctx.restore(); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, x0, y0, ph.w, h);
  return {sx, sy, sw, sh};
}

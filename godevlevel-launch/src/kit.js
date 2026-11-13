// Shared look and helpers for every scene: brand palette (from godevlevel.in), fonts, easing tokens (saas-launch style),
// living background, text reveals, UI pieces. Everything is a pure function of the absolute time T (seconds).
import {clamp, lerp, seg, ease, hash, noise1, spring} from '/assets/style/saas-launch/lib/core.js';
import {EZ} from '/assets/style/saas-launch/lib/techniques/tokens.js';
export {clamp, lerp, seg, ease, hash, noise1, spring, EZ};

export const W = 1080, H = 1920;
export const C = {bg: '#000000', ink: '#ffffff', muted: '#b4bcc8', dim: '#6b7280', card: '#15171c', card2: '#1c1f26', line: '#2a2e36', accent: '#fa461e'};
export const F = {display: 'Inter Tight', body: 'Inter', mono: 'JetBrains Mono'};
export const B = {}; // beats, filled in init
export const SAFE = {top: 240, bottom: 1480, left: 64, right: 950};

let ready;
export function initKit() {
  return ready ||= (async () => {
    const faces = [
      new FontFace(F.display, 'url(/assets/style/saas-launch/fonts/InterTight-Variable.woff2)', {weight: '100 900'}),
      new FontFace(F.body, 'url(/assets/style/saas-launch/fonts/Inter-Variable.woff2)', {weight: '400 700'}),
      new FontFace(F.mono, 'url(/assets/fonts/JetBrainsMono/JetBrainsMono.ttf)', {weight: '100 800'}),
    ];
    for (const f of faces) document.fonts.add(await f.load());
    const j = await (await fetch('/assets/beats.json')).json();
    Object.assign(B, j.beats);
  })();
}

export const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
export const mixHex = (a, b, p) => { const A = parseInt(a.slice(1), 16), Bn = parseInt(b.slice(1), 16); const ch = s => Math.round(lerp((A >> s) & 255, (Bn >> s) & 255, clamp(p))); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };
export const font = (size, weight = 600, family = F.display) => `${weight} ${size}px "${family}"`;
// eased progress of a move starting at t0 lasting d
export const P = (T, t0, d, e = 'out') => seg(T, t0, d, EZ[e] || e);
// in/out envelope: 0 → 1 over din from t0, back to 0 over dout ending at t1
export const env = (T, t0, t1, din = 0.3, dout = 0.22) => P(T, t0, din, 'out') * (1 - P(T, t1 - dout, dout, 'in'));

// ── Living background: black stage, the site's warm top glow, a dot grid that drifts, vignette ──
export function background(ctx, T, {glowY = 420, glow = 0.16, shift = 0} = {}) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const gx = W / 2 + Math.sin(T * 0.23) * 120, gy = glowY + Math.cos(T * 0.17) * 60;
  const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 900);
  g.addColorStop(0, rgba(C.accent, glow)); g.addColorStop(0.5, rgba(C.accent, glow * 0.25)); g.addColorStop(1, rgba(C.accent, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const off = (T * 9 + shift) % 54;
  ctx.fillStyle = 'rgba(255,255,255,0.055)';
  for (let y = -54 + off; y < H + 54; y += 54) for (let x = 27; x < W; x += 54) ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.72);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.78)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

export function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
export function card(ctx, x, y, w, h, r = 28, {fill = C.card, stroke = C.line, lw = 2, shadow = 0.5} = {}) {
  ctx.save();
  if (shadow) { ctx.shadowColor = `rgba(0,0,0,${shadow})`; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20; }
  rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  if (stroke) { rr(ctx, x, y, w, h, r); ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
// the through-line object: the accent dot
export function dot(ctx, x, y, r, a = 1, glow = 1) {
  if (a <= 0 || r <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(a);
  if (glow) { ctx.shadowColor = rgba(C.accent, 0.9); ctx.shadowBlur = r * 2.2 * glow; }
  ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore();
}

// ── Text ──
function setFont(ctx, size, weight, family) { ctx.font = font(size, weight, family); ctx.letterSpacing = family === F.display ? `${(-0.02 * size).toFixed(2)}px` : '0px'; }
export function measure(ctx, str, size, weight = 600, family = F.display) { setFont(ctx, size, weight, family); const w = ctx.measureText(str).width; ctx.letterSpacing = '0px'; return w; }
export function text(ctx, str, x, y, size, {weight = 600, color = C.ink, align = 'center', family = F.display, a = 1} = {}) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); setFont(ctx, size, weight, family);
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(str, x, y); ctx.restore();
}
/** Word-by-word blur-in. lines: array of strings; times: start time per word (flat) or {t0, gap}. accent: set of word indexes (flat) in the accent colour.
 *  out: time the block leaves (blur up). Returns nothing; draws centred on x. */
export function words(ctx, T, lines, {x = W / 2, y, size = 96, weight = 600, lh = 1.12, color = C.ink, times, t0 = 0, gap = 0.1, accent = [], out = 1e9, family = F.display, align = 'center', dur = 0.38} = {}) {
  const q = P(T, out, 0.26, 'in'); if (q >= 1) return;
  setFont(ctx, size, weight, family); ctx.textBaseline = 'alphabetic';
  const space = ctx.measureText(' ').width; let k = 0;
  lines.forEach((ln, li) => {
    const ws = ln.split(' '), wd = ws.map(w => ctx.measureText(w).width), total = wd.reduce((s, v) => s + v, 0) + space * (ws.length - 1);
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x; const cy = y + li * size * lh;
    ws.forEach((w, i) => {
      const tw = times ? times[k] : t0 + k * gap, p = P(T, tw, dur, 'blur_in'), a = p * (1 - q);
      if (a > 0.003) {
        ctx.save(); ctx.globalAlpha *= clamp(a);
        const blur = (1 - p) * size * 0.16 + q * size * 0.12; if (blur > 0.4) ctx.filter = `blur(${blur.toFixed(1)}px)`;
        ctx.fillStyle = accent.includes(k) ? C.accent : color; ctx.textAlign = 'left';
        ctx.fillText(w, cx, cy + (1 - p) * size * 0.28 - q * size * 0.3); ctx.restore();
      }
      cx += wd[i] + space; k++;
    });
  });
  ctx.letterSpacing = '0px';
}
export function typed(ctx, T, str, x, y, size, {t0, cps = 17, color = C.ink, family = F.mono, weight = 500, caret = true, align = 'left', hold = 1e9} = {}) {
  const n = Math.floor(clamp((T - t0) * cps, 0, str.length)); if (T < t0) return 0;
  setFont(ctx, size, weight, family); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const full = ctx.measureText(str).width, sx = align === 'center' ? x - full / 2 : x, s = str.slice(0, n), w = ctx.measureText(s).width;
  ctx.fillStyle = color; ctx.fillText(s, sx, y);
  if (caret && T < hold && (n < str.length || Math.floor(T * 2.5) % 2 === 0)) { ctx.fillStyle = C.accent; ctx.fillRect(sx + w + 3, y - size * 0.82, Math.max(3, size * 0.07), size * 1.02); }
  return n;
}
export function pill(ctx, label, x, y, {size = 34, a = 1, fill = rgba(C.accent, 0.14), stroke = rgba(C.accent, 0.55), color = C.accent, scale = 1, padX = 26, family = F.body, weight = 600, h} = {}) {
  if (a <= 0) return 0; const tw = measure(ctx, label, size, weight, family), w = tw + padX * 2, hh = h || size * 1.75;
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate(x, y); ctx.scale(scale, scale);
  rr(ctx, -w / 2, -hh / 2, w, hh, hh / 2); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  text(ctx, label, 0, size * 0.36, size, {weight, color, family}); ctx.restore(); return w;
}
// icons drawn with strokes, p = draw-on progress
export function cross(ctx, x, y, r, p = 1, color = C.dim, lw = 5) {
  if (p <= 0) return; ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
  const a = clamp(p * 2), b = clamp(p * 2 - 1);
  ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x - r + 2 * r * a, y - r + 2 * r * a); ctx.stroke();
  if (b > 0) { ctx.beginPath(); ctx.moveTo(x + r, y - r); ctx.lineTo(x + r - 2 * r * b, y - r + 2 * r * b); ctx.stroke(); }
  ctx.restore();
}
export function check(ctx, x, y, r, p = 1, color = C.accent, lw = 6) {
  if (p <= 0) return; ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pts = [[-r, 0], [-r * 0.3, r * 0.7], [r, -r * 0.7]], a = clamp(p * 2.5), b = clamp((p - 0.4) / 0.6);
  ctx.beginPath(); ctx.moveTo(x + pts[0][0], y + pts[0][1]); ctx.lineTo(x + lerp(pts[0][0], pts[1][0], a), y + lerp(pts[0][1], pts[1][1], a));
  if (b > 0) ctx.lineTo(x + lerp(pts[1][0], pts[2][0], b), y + lerp(pts[1][1], pts[2][1], b)); ctx.stroke(); ctx.restore();
}
export function cursor(ctx, x, y, s = 1, press = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (1 - press * 0.14), s * (1 - press * 0.14));
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.lineTo(12, 36); ctx.lineTo(21, 55); ctx.lineTo(29, 51); ctx.lineTo(20, 33); ctx.lineTo(35, 33); ctx.closePath();
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore();
}
// persistent brand tag at the top of the safe area
export function brandTag(ctx, a, y = 300, size = 44) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a);
  const w = [measure(ctx, 'Go', size, 700), measure(ctx, 'Dev', size, 700), measure(ctx, 'Level', size, 700)]; let x = W / 2 - (w[0] + w[1] + w[2]) / 2;
  ['Go', 'Dev', 'Level'].forEach((s, i) => { text(ctx, s, x, y, size, {weight: 700, align: 'left', color: i === 1 ? C.accent : C.ink}); x += w[i]; });
  ctx.restore();
}
// film grain, deterministic per frame
let gcan;
export function grain(ctx, T, amount = 0.045) {
  gcan ||= new OffscreenCanvas(270, 480); const g = gcan.getContext('2d'), img = g.createImageData(270, 480), d = img.data, f = Math.round(T * 60);
  for (let i = 0; i < d.length; i += 4) { const v = hash(i * 0.37 + f * 13.1) * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = amount * 255; }
  g.putImageData(img, 0, 0); ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(gcan, 0, 0, W, H); ctx.restore();
}

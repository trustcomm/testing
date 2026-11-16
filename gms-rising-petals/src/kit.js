// GMS Rising Petals — shared look and helpers. Every function is a pure function of the absolute time T (seconds).
import {clamp, lerp, seg, bezier, hash, noise1, spring} from './lib/core.js';
export {clamp, lerp, hash, noise1, spring};

export const W = 1080, H = 1920;
export const C = {
  green: '#0f7a43', deep: '#0b5a31', leaf: '#3faa4f', red: '#d9262e', orange: '#f7941d', yellow: '#ffc928',
  cream: '#fff8ec', ink: '#173a2a', white: '#ffffff', sky: '#e8f6ff', skyTop: '#9fd6ff',
  pink: '#e93f80', orange2: '#f47b20', blue: '#1f6fe0', purple: '#7b2fbe',
};
export const F = {title: 'Fredoka', body: 'Nunito'};

// easing tokens (fast in, soft settle; a gentle 6–9% overshoot for playful pops)
const EZ = {
  out: [0.16, 1, 0.3, 1], in: [0.55, 0, 0.75, 0.2], inOut: [0.65, 0, 0.35, 1], soft: [0.33, 0, 0.2, 1],
  pop: [0.34, 1.45, 0.5, 1], pop2: [0.3, 1.7, 0.45, 1], swoop: [0.7, 0, 0.2, 1], whip: [0.6, 0, 0.1, 1],
};
const cache = {};
export const ease = (name) => cache[name] ||= bezier(...EZ[name]);
/** eased progress of a move that starts at t0 and lasts d (0 before, 1 after) */
export const P = (T, t0, d, e = 'out') => ease(e)(clamp((T - t0) / d));
/** 0→1 in, then 1→0 out */
export const env = (T, t0, t1, din = 0.35, dout = 0.3) => P(T, t0, din, 'out') * (1 - P(T, t1 - dout, dout, 'in'));
export const mixHex = (a, b, p) => { const A = parseInt(a.slice(1), 16), B2 = parseInt(b.slice(1), 16); const ch = s => Math.round(lerp((A >> s) & 255, (B2 >> s) & 255, clamp(p))); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };
export const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

// ── assets ──
export const IMG = {};
export const B = {}; // beats from plan/beats.json
const LIST = {
  sprout: 'bg/bg_sprout.png', path: 'bg/bg_path.png', gate: 'bg/bg_gate.png', classroom: 'bg/bg_classroom.png',
  boy: 'cut/boy_wave.png', girl: 'cut/girl_wave.png', cheer: 'cut/kids_cheer.png', read: 'cut/kids_read.png', walk: 'cut/kids_walk_back.png',
  book: 'cut/prop_book.png', mega: 'cut/prop_megaphone.png', toys: 'cut/prop_toys.png',
  badge: 'cut/logo_badge.png', rings: 'cut/logo_rings.png', gms: 'cut/logo_gms.png', ltext: 'cut/logo_text.png',
};
let ready;
export function initKit() {
  return ready ||= (async () => {
    const faces = [new FontFace(F.title, 'url(/assets/fonts/Fredoka.ttf)', {weight: '300 700'}), new FontFace(F.body, 'url(/assets/fonts/Nunito.ttf)', {weight: '200 1000'})];
    for (const f of faces) document.fonts.add(await f.load());
    Object.assign(B, (await (await fetch('/assets/beats.json')).json()).beats);
    await Promise.all(Object.entries(LIST).map(([k, p]) => new Promise((ok, no) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => no(Error('missing ' + p)); i.src = '/assets/images/' + p; })));
  })();
}

// ── drawing helpers ──
export function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
/** draw an image to cover the frame, with a camera: scale s around (fx, fy) in frame px, plus pan (px) */
export function cover(ctx, img, {s = 1, fx = W / 2, fy = H / 2, px = 0, py = 0, blur = 0, a = 1} = {}) {
  if (a <= 0) return; const k = Math.max(W / img.width, H / img.height), w = img.width * k, h = img.height * k;
  ctx.save(); ctx.globalAlpha *= clamp(a); if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(1)}px)`;
  ctx.translate(fx + px, fy + py); ctx.scale(s, s); ctx.translate(-fx, -fy);
  ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); ctx.restore();
}
/** draw a cut-out by its bottom-centre (feet) at (x, y) with height h; rot in radians, sx/sy squash */
export function sprite(ctx, img, x, y, h, {a = 1, rot = 0, sx = 1, sy = 1, shadow = 0.35, anchor = 'bottom', blur = 0, flip = false} = {}) {
  if (a <= 0 || h <= 0) return; const w = img.width * h / img.height;
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sx * (flip ? -1 : 1), sy);
  const oy = anchor === 'bottom' ? -h : -h / 2;
  if (shadow > 0 && anchor === 'bottom') { ctx.save(); ctx.fillStyle = `rgba(20,40,20,${shadow})`; ctx.filter = 'blur(14px)'; ctx.beginPath(); ctx.ellipse(0, -4, w * 0.36, h * 0.035, 0, 0, 7); ctx.fill(); ctx.restore(); }
  if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(1)}px)`;
  ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, -w / 2, oy, w, h); ctx.restore();
}
export function font(size, weight = 700, family = F.title) { return `${weight} ${size}px "${family}"`; }
export function measure(ctx, s, size, weight = 700, family = F.title) { ctx.font = font(size, weight, family); return ctx.measureText(s).width; }

/** "sticker" headline: white (or colour) fill, thick deep-green outline, soft drop shadow. Per-word pop-in with times. */
export function sticker(ctx, T, lines, {x = W / 2, y, size = 110, lh = 1.08, times, t0 = 0, gap = 0.12, fill = C.white, accent = {}, stroke = C.deep, sw = 0.16, out = 1e9, dur = 0.42, align = 'center', weight = 700, family = F.title, shadow = 0.35} = {}) {
  const q = P(T, out, 0.3, 'in'); if (q >= 1) return;
  ctx.font = font(size, weight, family); ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  const space = ctx.measureText(' ').width; let k = 0;
  lines.forEach((ln, li) => {
    const ws = ln.split(' '), wd = ws.map(w => ctx.measureText(w).width), tot = wd.reduce((s, v) => s + v, 0) + space * (ws.length - 1);
    let cx = align === 'center' ? x - tot / 2 : align === 'right' ? x - tot : x; const cy = y + li * size * lh;
    ws.forEach((w, i) => {
      const tw = times ? times[k] : t0 + k * gap, p = P(T, tw, dur, 'pop'), a = clamp(P(T, tw, 0.18, 'out') * 1.2) * (1 - q);
      if (a > 0.003) {
        ctx.save(); ctx.globalAlpha *= a; const mx = cx + wd[i] / 2, s = (0.55 + 0.45 * p) * (1 - 0.1 * q);
        ctx.translate(mx, cy - size * 0.32 + (1 - p) * size * 0.35 - q * size * 0.25); ctx.rotate((1 - p) * -0.12 * (k % 2 ? -1 : 1)); ctx.scale(s, s); ctx.translate(-wd[i] / 2, size * 0.32);
        if (shadow) { ctx.fillStyle = `rgba(10,40,20,${shadow})`; ctx.fillText(w, 4, size * 0.08); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = size * sw; ctx.strokeText(w, 0, 0); }
        ctx.fillStyle = accent[k] || fill; ctx.fillText(w, 0, 0); ctx.restore();
      }
      cx += wd[i] + space; k++;
    });
  });
}
/** plain text */
export function text(ctx, s, x, y, size, {weight = 700, family = F.title, color = C.ink, align = 'center', a = 1, stroke, sw = 0.14} = {}) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); ctx.font = font(size, weight, family); ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = size * sw; ctx.strokeText(s, x, y); }
  ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}
/** rounded pill with label */
export function pill(ctx, label, x, y, {size = 34, fill = C.green, color = C.white, a = 1, s = 1, padX = 30, h, weight = 800, family = F.body, shadow = 0.25, icon} = {}) {
  if (a <= 0) return 0; const tw = measure(ctx, label, size, weight, family), iw = icon ? size * 1.2 : 0, w = tw + iw + padX * 2, hh = h || size * 1.9;
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate(x, y); ctx.scale(s, s);
  if (shadow) { ctx.save(); ctx.shadowColor = `rgba(0,40,20,${shadow})`; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; rr(ctx, -w / 2, -hh / 2, w, hh, hh / 2); ctx.fillStyle = fill; ctx.fill(); ctx.restore(); }
  else { rr(ctx, -w / 2, -hh / 2, w, hh, hh / 2); ctx.fillStyle = fill; ctx.fill(); }
  if (icon) icon(ctx, -w / 2 + padX + size * 0.5, 0, size * 0.55);
  text(ctx, label, -w / 2 + padX + iw + tw / 2, size * 0.35, size, {weight, family, color}); ctx.restore(); return w;
}

// ── nature pieces ──
/** a petal (teardrop) pointing up from its base at (0,0), length L */
export function petalPath(ctx, L, wfrac = 0.42) {
  const w = L * wfrac; ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-w, -L * 0.25, -w * 0.8, -L * 0.85, 0, -L); ctx.bezierCurveTo(w * 0.8, -L * 0.85, w, -L * 0.25, 0, 0); ctx.closePath();
}
export function petal(ctx, x, y, L, rot, colA, colB, a = 1) {
  if (a <= 0 || L <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate(x, y); ctx.rotate(rot);
  const g = ctx.createLinearGradient(0, 0, 0, -L); g.addColorStop(0, colA); g.addColorStop(1, colB);
  petalPath(ctx, L); ctx.fillStyle = g; ctx.fill();
  ctx.globalAlpha *= 0.35; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, L * 0.03); ctx.beginPath(); ctx.moveTo(0, -L * 0.12); ctx.quadraticCurveTo(L * 0.05, -L * 0.5, 0, -L * 0.8); ctx.stroke();
  ctx.restore();
}
/** a flower: n petals around a centre, bloom 0..1 */
export function flower(ctx, x, y, r, bloom, {n = 8, colA = C.pink, colB = '#ffb3cf', center = C.yellow, rot = 0, a = 1} = {}) {
  if (a <= 0 || bloom <= 0) return;
  for (let i = 0; i < n; i++) { const ang = rot + i / n * Math.PI * 2, b = clamp(bloom * 1.25 - i * 0.025); petal(ctx, x, y, r * b, ang, colA, colB, a); }
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.beginPath(); ctx.arc(x, y, r * 0.3 * clamp(bloom * 1.4), 0, 7); ctx.fillStyle = center; ctx.fill(); ctx.restore();
}
/** a stem from (x, y0) up to height h with grow 0..1, gentle sway; returns the tip position */
export function stem(ctx, x, y0, h, grow, T, {color = C.leaf, w = 12, leaves = [0.35, 0.62], sway = 1} = {}) {
  const g = clamp(grow); if (g <= 0) return [x, y0];
  const s = Math.sin(T * 1.6 + x * 0.01) * 10 * sway, top = y0 - h * g, tipX = x + s * g;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x - s * 0.6, (y0 + top) / 2, tipX, top); ctx.stroke();
  leaves.forEach((f, i) => { const lp = clamp((g - f) * 4); if (lp <= 0) return; const ly = y0 - h * f, lx = x + s * f * f * 0.6;
    ctx.save(); ctx.translate(lx, ly); ctx.rotate((i % 2 ? 1 : -1) * (1.0 + 0.05 * Math.sin(T * 2 + i))); const L = 70 * lp;
    petalPath(ctx, L, 0.5); ctx.fillStyle = mixHex(C.leaf, C.green, 0.4); ctx.fill(); ctx.restore(); });
  ctx.restore(); return [tipX, top];
}
/** sparkle star */
export function sparkle(ctx, x, y, r, a = 1, color = '#fff6c8') {
  if (a <= 0 || r <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate(x, y); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = r * 2;
  ctx.beginPath(); for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4, rad = i % 2 ? r * 0.28 : r; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(ang) * rad, Math.sin(ang) * rad); } ctx.closePath(); ctx.fill(); ctx.restore();
}
/** drifting petals across the frame: seeded, deterministic */
export function drift(ctx, T, {n = 14, seed = 1, a = 1, speed = 1, cols = [[C.orange, C.red], [C.pink, '#ffb3cf'], [C.yellow, C.orange], ['#7fd18a', C.green]], size = [26, 46], wind = 1} = {}) {
  if (a <= 0) return;
  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 7.31 + seed), h2 = hash(i * 3.17 + seed * 2), h3 = hash(i * 1.93 + seed * 3), sp = (0.05 + 0.05 * h2) * speed;
    const u = (h1 + T * sp) % 1, x = ((h3 * 1.4 - 0.2) * W + Math.sin(T * (0.6 + h2) + i) * 70 + u * 260 * wind) % (W + 200) - 100, y = -80 + u * (H + 160);
    const c = cols[i % cols.length], L = lerp(size[0], size[1], h2);
    petal(ctx, x, y, L, T * (0.8 + h1) * (i % 2 ? 1 : -1) + i, c[0], c[1], a * 0.9);
  }
}
/** sunburst background (cream → white) with slowly turning rays */
export function sunburst(ctx, T, {cx = W / 2, cy = 860, a = 1, base = C.cream, ray = 'rgba(255,214,90,0.16)', n = 18} = {}) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a);
  const g = ctx.createRadialGradient(cx, cy, 50, cx, cy, 1500); g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, base); g.addColorStop(1, '#ffe7b8');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.translate(cx, cy); ctx.rotate(T * 0.06); ctx.fillStyle = ray;
  for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 2400, i / n * Math.PI * 2, (i + 0.5) / n * Math.PI * 2); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
/** soft clouds */
export function cloud(ctx, x, y, s, a = 1, color = '#ffffff') {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
  [[0, 0, 70], [-80, 18, 52], [80, 18, 56], [-40, -30, 58], [40, -36, 64]].forEach(([cx, cy, r]) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); });
  rr(ctx, -132, 10, 264, 66, 33); ctx.fill(); ctx.restore();
}
/** WhatsApp-style badge (drawn, generic) */
export function waIcon(ctx, x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#25d366'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.13; ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0.35 * Math.PI, 2.55 * Math.PI); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.32); ctx.lineTo(-r * 0.72, r * 0.72); ctx.lineTo(-r * 0.25, r * 0.55); ctx.fill();
  phoneGlyph(ctx, 0, 0, r * 0.42, '#fff'); ctx.restore();
}
export function phoneGlyph(ctx, x, y, s, color = '#fff') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.6); ctx.fillStyle = color; rr(ctx, -s * 0.28, -s * 0.75, s * 0.56, s * 1.5, s * 0.22); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out'; rr(ctx, -s * 0.12, -s * 0.38, s * 0.24, s * 0.76, 2); ctx.fill(); ctx.restore();
}
export function pin(ctx, x, y, s, color = C.red) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color; ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-30, -40, -46, -60, -46, -88); ctx.arc(0, -88, 46, Math.PI, 0); ctx.bezierCurveTo(46, -60, 30, -40, 0, 0); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -88, 18, 0, 7); ctx.fill(); ctx.restore();
}
export function tick(ctx, x, y, r, p, color = C.green, lw) {
  if (p <= 0) return; ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw || r * 0.28; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const a = clamp(p * 2.4), b = clamp((p - 0.42) / 0.58); ctx.beginPath(); ctx.moveTo(x - r, y);
  ctx.lineTo(x + lerp(-r, -r * 0.25, a), y + lerp(0, r * 0.7, a)); if (b > 0) ctx.lineTo(x + lerp(-r * 0.25, r, b), y + lerp(r * 0.7, -r * 0.75, b)); ctx.stroke(); ctx.restore();
}
/** deterministic film grain + warm vignette */
let gcan;
export function finish(ctx, T, {grain = 0.03, vignette = 0.22} = {}) {
  if (vignette) { const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75); v.addColorStop(0, 'rgba(60,30,0,0)'); v.addColorStop(1, `rgba(60,30,0,${vignette})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
  if (!grain) return; gcan ||= new OffscreenCanvas(270, 480); const g = gcan.getContext('2d'), img = g.createImageData(270, 480), d = img.data, f = Math.round(T * 60);
  for (let i = 0; i < d.length; i += 4) { const v = hash(i * 0.37 + f * 13.1) * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = grain * 255; }
  g.putImageData(img, 0, 0); ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(gcan, 0, 0, W, H); ctx.restore();
}
/** circular or flower-shaped clip */
export function clipCircle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, 7); ctx.clip(); }
export function clipBlob(ctx, x, y, r, T, bumps = 9, amp = 0.08) {
  ctx.beginPath(); for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 2, rr2 = Math.max(0.1, r * (1 + amp * Math.sin(a * bumps + T * 3))); ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } ctx.closePath(); ctx.clip();
}
/** the GMS logo, built from layers. p = {disc, rings, gms, text1, text2} each 0..1; centre (x, y), diameter d */
export function logo(ctx, x, y, d, p, T = 0) {
  const k = d / 1000, R = 500 * k;
  ctx.save(); ctx.translate(x, y);
  if (p.disc > 0) { const s = p.disc; ctx.save(); ctx.scale(s, s); ctx.shadowColor = 'rgba(40,60,20,0.28)'; ctx.shadowBlur = 50 * k * 1.4; ctx.shadowOffsetY = 18 * k * 1.4; ctx.beginPath(); ctx.arc(0, 0, R * 0.985, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore(); }
  if (p.rings > 0) { ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R * 1.05, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p.rings)); ctx.closePath(); ctx.clip(); ctx.drawImage(IMG.rings, -R, -R, d, d); ctx.restore(); }
  if (p.gms > 0) { // diagonal write-on wipe with a soft edge
    const e = clamp(p.gms), x0 = -R * 0.6, x1 = R * 0.62, wx = lerp(x0 - 60 * k, x1 + 60 * k, e);
    ctx.save(); const g = ctx.createLinearGradient(wx - 70 * k, 0, wx + 10 * k, 0); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    const off = new OffscreenCanvas(Math.ceil(d), Math.ceil(d)), o = off.getContext('2d'); o.drawImage(IMG.gms, 0, 0, d, d); o.globalCompositeOperation = 'destination-in';
    o.translate(R, R); o.fillStyle = g; o.fillRect(-R, -R, d, d); ctx.drawImage(off, -R, -R); ctx.restore();
    if (e > 0 && e < 1) sparkle(ctx, wx, -R * 0.12 + Math.sin(e * 9) * R * 0.12, 26 * k * 1.6, 1);
  }
  [['text1', 0.56, 0.665], ['text2', 0.665, 0.8]].forEach(([key, y0, y1]) => { // centre-out wipe for each text line
    const e = clamp(p[key] || 0); if (e <= 0) return; ctx.save(); const half = R * 0.75 * e; ctx.beginPath(); ctx.rect(-half, -R + d * y0, half * 2, d * (y1 - y0)); ctx.clip();
    ctx.drawImage(IMG.ltext, -R, -R, d, d); ctx.restore();
  });
  ctx.restore();
}
export const fullLogo = {disc: 1, rings: 1, gms: 1, text1: 1, text2: 1};

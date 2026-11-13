// Chapter 3 (21.0–34.75 s): "not only websites" — the phone becomes one of four tiles; each new tile opens into its own scene
// (Motion, 3D, AI) and closes back. Starts on the phone from chapter 2, ends on the four filled tiles.
import {W, H, C, B, F, P, env, initKit, background, card, rr, dot, words, text, pill, check, cursor, brandTag, grain, clamp, lerp, rgba, hash, mixHex, spring, font} from '../kit.js';
import {TILE, TS, STAGE, PHONE, tileRect, tile, miniPhone} from '../tiles.js';
export const init = initKit;

const OPEN = [null, [23.02, 26.32], [26.42, 30.86], [30.96, 34.3]];
const open = (i, T) => OPEN[i] ? P(T, OPEN[i][0], 0.56, 'camera_s') * (1 - P(T, OPEN[i][1], 0.46, 'camera_s')) : 0;
const bez = (u, a, b, c, d) => { const q = 1 - u; return q * q * q * a + 3 * q * q * u * b + 3 * q * u * u * c + u * u * u * d; };

// ── Motion ──
function motion(ctx, T) {
  words(ctx, T, ['Motion graphics'], {x: 0, y: -392, size: 96, times: [23.28, 23.54], accent: [0]});
  words(ctx, T, ['explainer videos'], {x: 0, y: -316, size: 50, weight: 500, color: C.muted, times: [23.94, 24.2]});
  const exit = P(T, 24.78, 0.3, 'in');
  if (exit < 1) {
    ctx.save(); ctx.translate(0, -1100 * exit); ctx.globalAlpha *= 1 - exit;
    const PX = [-360, -170, 150, 360], PY = [10, -330, 200, -150], dr = P(T, 23.3, 0.8, 'inOut');
    ctx.strokeStyle = '#4b5160'; ctx.lineWidth = 4; ctx.setLineDash([3, 14]); ctx.lineCap = 'round'; ctx.beginPath();
    for (let k = 0; k <= 60 * dr; k++) { const u = k / 60; k ? ctx.lineTo(bez(u, ...PX), bez(u, ...PY)) : ctx.moveTo(bez(u, ...PX), bez(u, ...PY)); } ctx.stroke(); ctx.setLineDash([]);
    const u = P(T, 23.55, 1.1, 'inOut'), mo = P(T, 23.9, 0.5, 'morph');
    [0, 1 / 3, 2 / 3, 1].forEach((k, i) => { const p = P(T, 23.4 + i * 0.12, 0.3, 'pop_soft'); ctx.save(); ctx.translate(bez(k, ...PX), bez(k, ...PY)); ctx.rotate(Math.PI / 4); ctx.scale(p, p); ctx.fillStyle = u >= k - 0.02 ? C.accent : '#8b93a1'; ctx.fillRect(-11, -11, 22, 22); ctx.restore(); });
    for (let k = 6; k >= 0; k--) { const uu = clamp(u - k * 0.035 * Math.sin(u * Math.PI)), x = bez(uu, ...PX), y = bez(uu, ...PY), sz = 46;
      ctx.save(); ctx.globalAlpha *= k ? 0.11 : 1; ctx.translate(x, y); ctx.rotate(mo * Math.PI / 2 + u * 1.2); if (!k) { ctx.shadowColor = rgba(C.accent, 0.8); ctx.shadowBlur = 40; }
      rr(ctx, -sz, -sz, sz * 2, sz * 2, lerp(sz, 16, mo)); ctx.fillStyle = C.accent; ctx.fill(); ctx.restore(); }
    // timeline
    const tl = P(T, 23.35, 0.5, 'pop_soft'); ctx.save(); ctx.globalAlpha *= clamp(tl * 1.5); ctx.translate(0, (1 - tl) * 60);
    card(ctx, -420, 230, 840, 250, 24, {fill: '#111318', stroke: '#30343d', shadow: 0.3});
    ['shape', 'path', 'text', 'sfx'].forEach((n, i) => { const yy = 276 + i * 50; text(ctx, n, -392, yy + 8, 24, {family: F.mono, weight: 500, color: C.dim, align: 'left'});
      const x0 = -290 + hash(i + 2) * 120, wl = 300 + hash(i * 3 + 1) * 280; rr(ctx, x0, yy - 12, wl, 26, 8); ctx.fillStyle = '#262a33'; ctx.fill();
      [0.05, 0.5, 0.95].forEach(k => { ctx.save(); ctx.translate(x0 + wl * k, yy + 1); ctx.rotate(Math.PI / 4); ctx.fillStyle = i === 0 ? C.accent : '#8b93a1'; ctx.fillRect(-7, -7, 14, 14); ctx.restore(); }); });
    const phx = lerp(-290, 390, u); ctx.fillStyle = C.accent; ctx.fillRect(phx - 2, 246, 4, 220); ctx.beginPath(); ctx.moveTo(phx - 12, 240); ctx.lineTo(phx + 12, 240); ctx.lineTo(phx, 258); ctx.fill();
    ctx.restore(); ctx.restore();
  }
  // the feed that stops
  const fin = P(T, 24.82, 0.25, 'out');
  if (fin > 0) {
    const sp = P(T, 24.86, 1.02, 'out_snap'), s = 2760 * sp + 26 * Math.exp(-Math.max(0, T - 25.86) * 9) * Math.sin(Math.max(0, T - 25.86) * 26), vel = clamp((1 - sp) * 3);
    ctx.save(); ctx.globalAlpha *= fin; ctx.beginPath(); ctx.rect(-480, -250, 960, 780); ctx.clip();
    for (let k = 0; k <= 6; k++) {
      const y = 110 + k * 460 - s; if (y < -700 || y > 900) continue; const ours = k === 6;
      ctx.save(); ctx.translate(0, y); if (vel > 0.05 && !ours) ctx.globalAlpha *= 0.75;
      card(ctx, -330, -200, 660, 400, 30, {fill: ours ? '#191c22' : '#131519', stroke: ours ? rgba(C.accent, P(T, 25.86, 0.3, 'out')) : '#2a2e36', lw: ours ? 5 : 2, shadow: 0.3});
      ctx.beginPath(); ctx.arc(-282, -150, 22, 0, 7); ctx.fillStyle = '#2a2e36'; ctx.fill(); rr(ctx, -246, -160, 180, 14, 7); ctx.fill();
      if (ours) { const r = T * 1.8; ctx.save(); ctx.translate(0, 30); ctx.rotate(r); ctx.shadowColor = rgba(C.accent, 0.8); ctx.shadowBlur = 40; rr(ctx, -62, -62, 124, 124, 22 + 40 * (0.5 + 0.5 * Math.sin(T * 3))); ctx.fillStyle = C.accent; ctx.fill(); ctx.restore(); }
      else { rr(ctx, -290, -100, 580, 200, 16); ctx.fillStyle = '#1c1f26'; ctx.fill(); rr(ctx, -290, 124, 380, 14, 7); ctx.fillStyle = '#23262e'; ctx.fill(); }
      ctx.restore();
    }
    ctx.restore();
    const ring = P(T, 25.86, 0.55, 'out'); if (ring > 0 && ring < 1) { rr(ctx, -330 - ring * 50, -90 - ring * 50, 660 + ring * 100, 400 + ring * 100, 30 + ring * 30); ctx.strokeStyle = rgba(C.accent, 0.7 * (1 - ring)); ctx.lineWidth = 5; ctx.stroke(); }
    words(ctx, T, ['Scroll rok dein.'], {x: 0, y: 462, size: 84, times: [25.48, 25.86, 26.0], accent: [1]});
  }
}

// ── 3D ──
const ICO = (() => {
  const t = (1 + Math.sqrt(5)) / 2, n = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
  let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(n);
  let Fc = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const mid = {}, m = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (mid[k] === undefined) { V.push(n(V[a].map((x, i) => (x + V[b][i]) / 2))); mid[k] = V.length - 1; } return mid[k]; };
  const F2 = []; Fc.forEach(([a, b, c]) => { const ab = m(a, b), bc = m(b, c), ca = m(c, a); F2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); });
  return {V, F: F2};
})();
function three(ctx, T) {
  words(ctx, T, ['3D models'], {x: 0, y: -392, size: 96, times: [27.32, 27.74], accent: [0]});
  words(ctx, T, ['+ animation'], {x: 0, y: -316, size: 50, weight: 500, color: C.muted, times: [28.06, 28.38]});
  pill(ctx, 'Blender', -330, -214, {size: 28, a: P(T, B.blender, 0.3, 'out'), scale: 0.7 + 0.3 * P(T, B.blender, 0.35, 'pop_soft'), fill: 'rgba(255,255,255,0.06)', stroke: C.line, color: C.ink});
  const ext = P(T, B.three_d - 0.1, 0.55, 'pop_soft'), toSphere = P(T, B.models, 0.6, 'morph') * (1 - P(T, 29.2, 0.55, 'morph')), alive = P(T, 29.3, 0.6, 'inOut');
  const yaw = lerp(T * 0.95, 0.42 * Math.sin(T * 2.1) + 0.55, alive), pitch = 0.5, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), spn = Math.sin(pitch);
  // bounce (animation) and the happy hop (zinda)
  const ba = P(T, B.animation, 0.3, 'out') * (1 - P(T, 29.15, 0.3, 'out')), bt = (T - B.animation) * 1.9, bounce = Math.abs(Math.sin(bt * Math.PI)) * 0.95 * ba;
  const hop = T > B.zinda_hit ? Math.abs(Math.sin((T - B.zinda_hit) * Math.PI * 2.4)) * 0.5 * Math.exp(-(T - B.zinda_hit) * 1.2) : 0, lift = bounce + hop;
  const sq = 1 - 0.22 * ba * Math.pow(1 - Math.abs(Math.sin(bt * Math.PI)), 6);
  const proj = ([x, y, z]) => { const X = x * cy - z * sy, Z = x * sy + z * cy, Y = y * cp - Z * spn, Z2 = y * spn + Z * cp, f = 900 / (6 + Z2); return [X * f, Y * f - 40, Z2]; };
  // floor grid
  const ga = P(T, B.blender - 0.1, 0.5, 'out'); ctx.save(); ctx.globalAlpha *= ga; ctx.lineWidth = 2;
  for (let i = -5; i <= 5; i++) { ctx.strokeStyle = rgba('#8b93a1', i === 0 ? 0.5 : 0.16); let a = proj([i * 0.6, 1, -3]), b = proj([i * 0.6, 1, 3]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); a = proj([-3, 1, i * 0.6]); b = proj([3, 1, i * 0.6]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  const sh = proj([0, 1, 0]); ctx.fillStyle = `rgba(0,0,0,${0.5 - 0.25 * lift})`; ctx.beginPath(); ctx.ellipse(sh[0], sh[1], 190 * (1 - 0.3 * lift), 70 * (1 - 0.3 * lift), 0, 0, 7); ctx.fill(); ctx.restore();
  // object: icosphere vertices pushed out to a cube and back
  const R = 0.92, vs = ICO.V.map(v => { const m = Math.max(Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2])), c = v.map(x => x / m * 0.8), p = c.map((x, i) => lerp(x, v[i] * 1.08, toSphere) * R);
    return [p[0] * (2 - sq) * 0.5 + p[0] * 0.5, 1 - R * 0.8 * lerp(1, 1.08 / 0.8, toSphere) * 0 - (1 - p[1]) * 0 + (p[1] * lerp(0.03, 1, ext) * sq) - (R * 0.8 * lerp(0.03, 1, ext) * sq) * lerp(1, 1.3, toSphere) - lift, p[2]]; });
  const pv = vs.map(proj), L = [-0.45, -0.72, -0.53];
  const faces = ICO.F.map(f => { const [a, b, c] = f.map(i => vs[i]), u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]; const l = Math.hypot(...n) || 1; n = n.map(x => x / l);
    const X = n[0] * cy - n[2] * sy, Z = n[0] * sy + n[2] * cy, Y = n[1] * cp - Z * spn, Z2 = n[1] * spn + Z * cp; return {f, z: (pv[f[0]][2] + pv[f[1]][2] + pv[f[2]][2]) / 3, lam: clamp(X * L[0] + Y * L[1] + Z2 * L[2]), facing: Z2 < 0.15}; })
    .sort((a, b) => b.z - a.z);
  const oa = P(T, B.blender, 0.35, 'out'), wire = 1 - 0.75 * P(T, B.models + 0.3, 0.6, 'out') * (1 - 0);
  ctx.save(); ctx.globalAlpha *= oa; ctx.lineJoin = 'round';
  faces.forEach(({f, lam}) => { ctx.beginPath(); f.forEach((i, k) => k ? ctx.lineTo(pv[i][0], pv[i][1]) : ctx.moveTo(pv[i][0], pv[i][1])); ctx.closePath();
    ctx.fillStyle = mixHex('#4a1206', '#ff6a3c', 0.12 + lam * 0.95); ctx.fill(); ctx.strokeStyle = rgba('#ffffff', 0.07 + 0.3 * wire * toSphere + 0.0); ctx.lineWidth = 1.5; ctx.stroke(); });
  ctx.restore();
  // eyes on the front (+z after yaw≈0.55 faces camera-left); placed in object space on the −z face
  const ea = P(T, B.zinda_hit - 0.12, 0.3, 'pop_soft') * (1 - toSphere);
  if (ea > 0) { const blink = (T % 1.7) < 0.09 ? 0.15 : 1, top = 1 - 2 * R * 0.8 - lift;
    [-0.3, 0.3].forEach(ex => { const p = proj([ex, top + 0.55, -R * 0.8 - 0.01]); ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(ea, ea * blink); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, 19, 27, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(3, 4, 9, 0, 7); ctx.fill(); ctx.restore(); });
    const m = proj([0, top + 0.98, -R * 0.8 - 0.01]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6 * ea; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(m[0], m[1] - 14, 26, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke(); }
  const ring = P(T, B.zinda_hit, 0.6, 'out'); if (ring > 0 && ring < 1) { ctx.beginPath(); ctx.arc(0, -40, 150 + ring * 300, 0, 7); ctx.strokeStyle = rgba(C.accent, 0.6 * (1 - ring)); ctx.lineWidth = 5; ctx.stroke(); }
  // keyframe strip
  const ka = env(T, B.animation - 0.1, 29.3, 0.3, 0.25); if (ka > 0) { ctx.save(); ctx.globalAlpha *= ka; rr(ctx, -360, 330, 720, 12, 6); ctx.fillStyle = '#23262e'; ctx.fill();
    for (let i = 0; i < 7; i++) { ctx.save(); ctx.translate(-340 + i * 113, 336); ctx.rotate(Math.PI / 4); ctx.fillStyle = i % 2 ? '#8b93a1' : C.accent; ctx.fillRect(-9, -9, 18, 18); ctx.restore(); }
    const px = -340 + ((bt % 2) / 2) * 680; ctx.fillStyle = '#fff'; ctx.fillRect(px - 2, 306, 4, 60); ctx.restore(); }
  words(ctx, T, ['Product ko zinda kar dein.'], {x: 0, y: 452, size: 68, times: [29.46, 29.8, 30.08, 30.52, 30.66], accent: [2]});
}

// ── AI ──
function ai(ctx, T) {
  words(ctx, T, ['AI solutions'], {x: 0, y: -392, size: 96, times: [31.48, 31.82], accent: [0]});
  const pin = P(T, 31.3, 0.45, 'pop_soft'), press = env(T, 32.66, 32.9, 0.08, 0.14);
  ctx.save(); ctx.globalAlpha *= clamp(pin * 1.5); ctx.translate(0, -250); ctx.scale(0.9 + 0.1 * pin, 0.9 + 0.1 * pin);
  rr(ctx, -410, -58, 820, 116, 58); ctx.fillStyle = '#14161b'; ctx.fill(); ctx.strokeStyle = mixHex('#343945', C.accent, P(T, 31.5, 0.3, 'out') * 0.8); ctx.lineWidth = 3; ctx.stroke();
  const str = 'Customer replies automate karo', n = Math.floor(clamp((T - 31.56) * 30, 0, str.length));
  ctx.font = font(40, 500, F.body); ctx.textAlign = 'left'; ctx.fillStyle = C.ink; ctx.fillText(str.slice(0, n), -366, 14);
  if (T < 32.7 && Math.floor(T * 2.5) % 2 === 0 || n < str.length) { ctx.fillStyle = C.accent; ctx.fillRect(-366 + ctx.measureText(str.slice(0, n)).width + 4, -22, 4, 44); }
  ctx.save(); ctx.translate(352, 0); ctx.scale(1 - 0.16 * press, 1 - 0.16 * press); dot(ctx, 0, 0, 40, 1, 0.8); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, -14); ctx.moveTo(-12, -2); ctx.lineTo(0, -14); ctx.lineTo(12, -2); ctx.stroke(); ctx.restore();
  ctx.restore();
  const rp = P(T, 32.68, 0.6, 'out'); if (rp > 0 && rp < 1) { ctx.beginPath(); ctx.arc(352, -250, 40 + rp * 240, 0, 7); ctx.strokeStyle = rgba(C.accent, 0.6 * (1 - rp)); ctx.lineWidth = 4; ctx.stroke(); }
  // dot grid "thinking": a wave of the accent runs through it
  const ga = P(T, 32.4, 0.4, 'out'); for (let y = 0; y < 5; y++) for (let x = 0; x < 15; x++) { const d = (x + y * 0.7) / 18, w = Math.exp(-Math.pow(((T - 32.7) * 0.9 % 1.2) - d, 2) * 40) * (T > 32.7 ? 1 : 0), px = -364 + x * 52, py = -128 + y * 44;
    ctx.beginPath(); ctx.arc(px, py, 6 + 7 * w, 0, 7); ctx.fillStyle = w > 0.05 ? mixHex('#3a3f4a', C.accent, w) : '#2a2e36'; ctx.globalAlpha = ga; ctx.fill(); } ctx.globalAlpha = 1;
  [['Replies', 'auto', 32.92], ['Leads', 'sorted', 33.36], ['Reports', 'ready', 33.8]].forEach(([a, b, t0], i) => { const p = P(T, t0, 0.42, 'pop_soft'); if (p <= 0) return; const yy = 150 + i * 122;
    ctx.save(); ctx.globalAlpha *= clamp(p * 1.5); ctx.translate(0, yy + (1 - p) * 40); card(ctx, -410, -50, 820, 100, 26, {fill: '#14161b', stroke: '#30343d', shadow: 0.25});
    ctx.beginPath(); ctx.arc(-350, 0, 28, 0, 7); ctx.fillStyle = rgba(C.accent, 0.16); ctx.fill(); check(ctx, -350, 2, 13, P(T, t0 + 0.12, 0.3, 'out'));
    text(ctx, a, -296, 18, 50, {align: 'left', weight: 600}); text(ctx, b, 380, 16, 40, {align: 'right', weight: 500, color: C.muted, family: F.body}); ctx.restore(); });
}

const CONTENT = [null, motion, three, ai];
export function draw(ctx, _t, {t: T}) {
  background(ctx, T, {glow: 0.13});
  brandTag(ctx, 1);
  const anyOpen = Math.max(open(1, T), open(2, T), open(3, T)), back = P(T, 21.0, 0.75, 'out_front');
  words(ctx, T, ['Sirf websites nahi.'], {y: 480, size: 104, times: [21.98, 22.18, 22.56], accent: [2], out: 22.98});
  text(ctx, 'Aur ab…', 540, 400 + 0, 0, {a: 0});
  // closed tiles (the open one is drawn last, on top)
  for (let i = 0; i < 4; i++) {
    const o = open(i, T); if (o > 0.999) continue;
    const pop = i === 0 ? back : P(T, 21.25 + i * 0.09, 0.45, 'pop_soft'), visited = i === 0 ? 1 : (T > OPEN[i][1] ? 1 : 0), others = Math.max(...[1, 2, 3].filter(k => k !== i).map(k => open(k, T)));
    if (o > 0) continue;
    tile(ctx, i, T, {filled: i === 0 ? clamp((back - 0.6) / 0.4) : visited, a: clamp(pop * 1.4) * (1 - others), s: (0.8 + 0.2 * pop) * (1 - 0.08 * others), label: i === 0 ? clamp((back - 0.7) / 0.3) : 1});
  }
  // the phone from chapter 2 shrinking into the Web tile
  if (back < 1) miniPhone(ctx, lerp(540, TILE[0][0], back), lerp(780, TILE[0][1] - 34, back), lerp(1, 0.3, back), T);
  for (let i = 1; i < 4; i++) {
    const o = open(i, T); if (o <= 0) continue;
    const a = tileRect(i), r = {x: lerp(a.x, STAGE.x, o), y: lerp(a.y, STAGE.y, o), w: lerp(a.w, STAGE.w, o), h: lerp(a.h, STAGE.h, o), r: lerp(a.r, STAGE.r, o)};
    card(ctx, r.x, r.y, r.w, r.h, r.r, {fill: mixHex('#14161b', '#0c0d10', o), stroke: '#343945'});
    const closing = T > OPEN[i][1];
    ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, r.r); ctx.clip();
    const ca = clamp((o - 0.35) / 0.5); if (ca > 0) { ctx.save(); ctx.globalAlpha *= ca; ctx.translate(r.x + r.w / 2, r.y + r.h / 2); ctx.scale(r.w / STAGE.w, r.w / STAGE.w); CONTENT[i](ctx, T); ctx.restore(); }
    ctx.restore();
    if (o < 0.5) tile(ctx, i, T, {filled: closing ? 1 : 0, a: 1 - o * 2, rect: r, label: closing ? 1 : 0});
  }
  grain(ctx, T);
}

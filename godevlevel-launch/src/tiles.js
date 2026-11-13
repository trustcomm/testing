// The four service tiles (Web, Motion, 3D, AI) shared by chapters 3 and 4.
import {C, F, P, card, rr, dot, text, clamp, lerp, rgba} from './kit.js';
import {site} from './scenes/brand.js';
export const TILE = [[320, 790], [760, 790], [320, 1230], [760, 1230]], TS = 400;
export const STAGE = {x: 60, y: 380, w: 960, h: 1060, r: 44};
export const LABELS = ['Web', 'Motion', '3D', 'AI'];
export const tileRect = i => ({x: TILE[i][0] - TS / 2, y: TILE[i][1] - TS / 2, w: TS, h: TS, r: 40});
export const PHONE = {x: 330, y: 390, w: 420, h: 780};
const ISO = (x, y, z) => [(x - z) * 0.866, (x + z) * 0.5 - y];

export function miniPhone(ctx, cx, cy, k, T) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-540, -780);
  site(ctx, PHONE, [1, 1, 1, 1], T, 1, 3, 3, 1); ctx.restore();
}
export function icon(ctx, i, cx, cy, s, T) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (i === 0) { ctx.restore(); miniPhone(ctx, cx, cy, 0.3 * s, T); return; }
  if (i === 1) {
    ctx.strokeStyle = '#4b5160'; ctx.lineWidth = 5; ctx.setLineDash([2, 12]); ctx.beginPath(); ctx.moveTo(-110, 40); ctx.bezierCurveTo(-50, -120, 40, 110, 110, -50); ctx.stroke(); ctx.setLineDash([]);
    const u = 0.5 + 0.5 * Math.sin(T * 1.6), q = 1 - u, bx = q * q * q * -110 + 3 * q * q * u * -50 + 3 * q * u * u * 40 + u * u * u * 110, by = q * q * q * 40 + 3 * q * q * u * -120 + 3 * q * u * u * 110 + u * u * u * -50;
    [[-110, 40], [110, -50]].forEach(([x, y]) => { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#8b93a1'; ctx.fillRect(-9, -9, 18, 18); ctx.restore(); });
    dot(ctx, bx, by, 22, 1, 1);
  } else if (i === 2) {
    const a = T * 0.5, c = Math.cos(a), sn = Math.sin(a), v = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(([x, y, z]) => ISO((x * c - z * sn) * 62, y * 62, (x * sn + z * c) * 62));
    ctx.strokeStyle = '#8b93a1'; ctx.lineWidth = 4;
    [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([p, q]) => { ctx.beginPath(); ctx.moveTo(...v[p]); ctx.lineTo(...v[q]); ctx.stroke(); });
    ctx.fillStyle = rgba(C.accent, 0.9); ctx.beginPath(); [3, 2, 6, 7].forEach((k, j) => j ? ctx.lineTo(...v[k]) : ctx.moveTo(...v[k])); ctx.closePath(); ctx.fill();
  } else {
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) { const w = 0.5 + 0.5 * Math.sin(T * 3 - (x + y) * 0.9), mid = x === 1 && y === 1;
      if (mid) dot(ctx, 0, 0, 20 + 4 * w, 1, 1); else { ctx.beginPath(); ctx.arc((x - 1) * 62, (y - 1) * 62, 9 + 5 * w, 0, 7); ctx.fillStyle = rgba('#8b93a1', 0.45 + 0.5 * w); ctx.fill(); } }
  }
  ctx.restore();
}
/** one tile: filled (icon + label) or empty (dashed slot). a = alpha, s = scale */
export function tile(ctx, i, T, {filled = 1, a = 1, s = 1, rect = tileRect(i), label = 1} = {}) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a);
  const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2; ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
  card(ctx, rect.x, rect.y, rect.w, rect.h, rect.r, {fill: '#14161b', stroke: filled > 0.5 ? '#343945' : null});
  if (filled < 1) { ctx.save(); ctx.globalAlpha *= 1 - filled; ctx.setLineDash([14, 12]); rr(ctx, rect.x, rect.y, rect.w, rect.h, rect.r); ctx.strokeStyle = '#3a3f4a'; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#4b5160'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - 22, cy); ctx.lineTo(cx + 22, cy); ctx.moveTo(cx, cy - 22); ctx.lineTo(cx, cy + 22); ctx.stroke(); ctx.restore(); }
  if (filled > 0) { ctx.save(); ctx.globalAlpha *= filled; icon(ctx, i, cx, cy - 34, rect.w / TS, T); if (label) text(ctx, LABELS[i], cx, rect.y + rect.h - 40, 40, {weight: 600, color: C.ink, a: label}); ctx.restore(); }
  ctx.restore();
}

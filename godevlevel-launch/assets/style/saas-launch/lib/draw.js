// Canvas 2D drawing helpers for the style. All sizes are in pixels of the composition (e.g. 1080x1920).
import { clamp, lerp, hash } from './core.js';

export function rrect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}

// A shape that morphs between rectangles/pills/circles: interpolate box + corner radius (the "pill morph").
export function morphBox(a, b, p) {
  return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p), r: lerp(a.r ?? 0, b.r ?? 0, p) };
}

export function withAlpha(ctx, a, fn) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore(); }

// Soft glow: draw fn twice, once blurred and brightened underneath.
export function glow(ctx, radius, color, strength, fn) {
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = radius; ctx.globalAlpha *= strength; fn(); ctx.restore(); fn();
}

export function linearGrad(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((c, i) => Array.isArray(c) ? g.addColorStop(c[0], c[1]) : g.addColorStop(i / (stops.length - 1), c));
  return g;
}
export function radialGrad(ctx, x, y, r, stops) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  stops.forEach((c, i) => Array.isArray(c) ? g.addColorStop(c[0], c[1]) : g.addColorStop(i / (stops.length - 1), c));
  return g;
}

// Text with per-glyph layout so letters/words can animate independently.
// Returns [{ch, x, y, w, i, word}] positioned for the given alignment; draw each with drawGlyph.
export function layoutText(ctx, text, { x, y, font, tracking = 0, align = 'center', lineHeight = 1.1, maxWidth = Infinity }) {
  ctx.font = font; ctx.letterSpacing = '0px';
  const size = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)[1]);
  const words = text.split(' '), lines = [[]]; let lw = 0;
  const wWidth = w => [...w].reduce((s, c) => s + ctx.measureText(c).width + tracking * size, 0);
  const space = ctx.measureText(' ').width;
  for (const w of words) {
    const ww = wWidth(w);
    if (lines[lines.length - 1].length && lw + space + ww > maxWidth) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push(w); lw += (lw ? space : 0) + ww;
  }
  const glyphs = []; let gi = 0, wi = 0;
  lines.forEach((ln, li) => {
    const total = ln.reduce((s, w, k) => s + wWidth(w) + (k ? space : 0), 0);
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    const cy = y + li * size * lineHeight;
    ln.forEach(w => {
      for (const ch of w) { const cw = ctx.measureText(ch).width; glyphs.push({ ch, x: cx, y: cy, w: cw, i: gi++, word: wi, line: li, size }); cx += cw + tracking * size; }
      cx += space; wi++;
    });
  });
  return glyphs;
}

// Draw one glyph with transform (dy in px, scale around baseline centre, blur px, alpha).
export function drawGlyph(ctx, g, { dy = 0, dx = 0, scale = 1, scaleY = 1, blur = 0, alpha = 1, color, rot = 0 } = {}) {
  if (alpha <= 0.002) return;
  ctx.save(); ctx.globalAlpha *= clamp(alpha);
  if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(2)}px)`;
  ctx.translate(g.x + g.w / 2 + dx, g.y + dy); ctx.rotate(rot); ctx.scale(scale, scale * scaleY);
  if (color) ctx.fillStyle = color;
  ctx.textAlign = 'center'; ctx.fillText(g.ch, 0, 0); ctx.restore();
}

// Film grain overlay (deterministic per frame index).
export function grain(ctx, w, h, frame, amount = 0.05, cell = 2) {
  if (amount <= 0) return;
  const img = ctx.createImageData(Math.ceil(w / cell), Math.ceil(h / cell)), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const v = hash(i * 0.37 + frame * 13.1) * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = amount * 255; }
  const c = new OffscreenCanvas(img.width, img.height); c.getContext('2d').putImageData(img, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.imageSmoothingEnabled = false; ctx.drawImage(c, 0, 0, w, h); ctx.restore();
}

// Vignette to focus the centre.
export function vignette(ctx, w, h, strength = 0.35, color = '0,0,0') {
  ctx.save(); ctx.fillStyle = radialGrad(ctx, w / 2, h / 2, Math.hypot(w, h) / 2, [[0.55, `rgba(${color},0)`], [1, `rgba(${color},${strength})`]]);
  ctx.fillRect(0, 0, w, h); ctx.restore();
}

// Images: preload once, then draw by key.
const IMG = {};
export async function loadImages(map) { await Promise.all(Object.entries(map).map(([k, src]) => new Promise((ok, no) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = no; i.src = src; }))); }
export const img = k => IMG[k];

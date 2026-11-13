// Style tokens for the techniques: easing beziers mirrored from style.json -> easing (check.mjs asserts they match),
// a hex/rgb colour mixer, and the font loader for fonts/ (Inter Tight = display, Inter = body).
import { ease } from '../core.js';

export const EZ = {
  out_settle: [0.18, 0.18, 0.25, 0.88], out_front: [0.1, 0.6, 0.08, 0.91], out_snap: [0.08, 0, 0.04, 0.91],
  camera_s: [0.52, 0.15, 0.31, 0.93], pan_giant: [0.13, 0.12, 0.38, 1], pan_linear: [0.29, 0.7, 0.32, 0.04],
  pop_soft: [0.24, 1.17, 0.07, 1.09], toggle: [0.64, 1.54, 0.2, 0.87], spring_big: [0.3, 2.04, 0.54, 1.38],
  blur_in: [0.6, 0.01, 0.26, 0.85], whip: [0.45, 0.99, 0, 1.07], flood: [0.21, 1.43, 0, 0.78],
  logo_resolve: [0.22, -0.05, 0.19, 1.06], slam_in: [0.95, 0.11, 0.61, 0.73], iris: [0.27, 0.47, 0.06, 1.12],
  morph: [0.73, 0.6, 0.11, 1.03],
};
// Token name -> easing value for seg()/keys(); unknown names throw (core.js would silently fall back to 'out').
export const ez = name => { if (Array.isArray(name) || typeof name === 'function') return name; if (EZ[name]) return EZ[name]; if (['linear', 'out', 'in', 'inOut', 'pop', 'snap'].includes(name)) return name; throw new Error('unknown easing token ' + name); };
export const ezf = name => ease(ez(name));

const rgb = c => Array.isArray(c) ? c : [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
// Mix two colours (hex or [r,g,b]) -> css rgb string.
export const mixColor = (a, b, p) => { const A = rgb(a), B = rgb(b); return `rgb(${A.map((x, i) => Math.round(x + (B[i] - x) * p)).join(',')})`; };
export const alpha = (c, a) => `rgba(${rgb(c).join(',')},${a})`;

export const FONT = { display: 'Inter Tight', body: 'Inter' };
export async function loadFonts() {
  const faces = [new FontFace('Inter Tight', `url(${new URL('../../fonts/InterTight-Variable.woff2', import.meta.url)})`, { weight: '100 900' }),
    new FontFace('Inter', `url(${new URL('../../fonts/Inter-Variable.woff2', import.meta.url)})`, { weight: '400 700' })];
  for (const f of faces) document.fonts.add(await f.load());
}

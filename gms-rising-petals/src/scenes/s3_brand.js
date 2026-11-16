// 7.9–14.9 s · "Welcome to GMS Rising Petals! A caring early learning space, right here in Tumkur."
// The petal opens a flower-shaped iris onto a sunburst; the logo builds itself: disc, rings draw on, the GMS ribbon
// writes, the name and tagline wipe open; petals burst; the logo lifts; a pin drops on Tumkur. Then a dive through it.
import {W, H, C, B, P, IMG, initKit, sunburst, logo, petal, sparkle, sticker, pill, pin, drift, finish, clipBlob, clamp, lerp, hash, text, F} from '../kit.js';
export const init = initKit;
export const LOGO_AT = (T) => { const m = P(T, 10.3, 0.65, 'inOut'); return {x: 540, y: lerp(860, 650, m), d: lerp(760, 600, m)}; };
export function draw(ctx, _t, {t: T}) {
  const iris = P(T, 7.92, 0.7, 'swoop'), dive = P(T, 14.12, 0.62, 'in');
  ctx.save(); clipBlob(ctx, 540, 860, iris * 1500, T, 10, 0.06 * (1 - iris));
  const L = LOGO_AT(T);
  ctx.translate(L.x, L.y); ctx.scale(1 + dive * 7, 1 + dive * 7); ctx.translate(-L.x, -L.y);
  sunburst(ctx, T, {cy: L.y});
  drift(ctx, T, {n: 10, seed: 9, a: 0.6, speed: 0.6});
  // petal burst on "Petals!"
  for (let i = 0; i < 18; i++) {
    const u = P(T, B.petals - 0.05, 1.1, 'out'), a = (1 - P(T, B.petals + 0.45, 0.6, 'in')) * clamp(u * 4), ang = i / 18 * Math.PI * 2 + hash(i) * 0.3, dist = L.d * 0.5 + u * (260 + hash(i + 3) * 260);
    const cols = [[C.orange, C.red], [C.green, '#7fd18a'], [C.yellow, C.orange]][i % 3];
    if (a > 0) petal(ctx, L.x + Math.cos(ang) * dist, L.y + Math.sin(ang) * dist, 34 + hash(i) * 22, ang + Math.PI / 2 + u * 3, cols[0], cols[1], a);
  }
  logo(ctx, L.x, L.y, L.d, {disc: P(T, 8.0, 0.6, 'pop'), rings: P(T, 8.3, 0.85, 'inOut'), gms: P(T, B.g - 0.05, 0.85, 'soft'), text1: P(T, B.rising - 0.02, 0.5, 'out'), text2: P(T, 9.62, 0.5, 'out')}, T);
  // sparkles that twinkle around the finished logo
  for (let i = 0; i < 6; i++) { const t0 = 10.0 + i * 0.55, g = clamp(1 - Math.abs(T - t0) / 0.3), ang = i * 2.1; sparkle(ctx, L.x + Math.cos(ang) * L.d * 0.62, L.y + Math.sin(ang) * L.d * 0.62, 26 * g, g); }
  sticker(ctx, T, ['A caring early', 'learning space,'], {y: 1090, size: 100, lh: 1.1, fill: C.green, stroke: '#ffffff', sw: 0.14, shadow: 0.15, times: [10.6, B.caring, 11.2, 11.56, B.space], accent: {1: C.red}, out: 12.36});
  sticker(ctx, T, ['right here in'], {y: 1090, size: 96, fill: C.green, stroke: '#ffffff', sw: 0.14, shadow: 0.15, times: [B.right, 12.82, 13.14]});
  // Tumkur: pin drop + name + address
  const pd = P(T, B.tumkur - 0.25, 0.5, 'pop2'), pa = clamp((T - (B.tumkur - 0.25)) / 0.12);
  if (pa > 0) { pin(ctx, 330, lerp(900, 1255, pd), 1.0 * pa, C.red); sticker(ctx, T, ['Tumkur'], {x: 610, y: 1250, size: 124, fill: C.red, stroke: '#ffffff', sw: 0.14, shadow: 0.2, times: [B.tumkur]}); }
  pill(ctx, 'Melekote Main Road, Sadashivanagar', 540, 1390, {size: 34, a: P(T, 13.6, 0.4, 'out'), s: lerp(0.9, 1, P(T, 13.6, 0.45, 'pop')), fill: C.green});
  finish(ctx, T, {grain: 0.02, vignette: 0.12});
  ctx.restore();
}

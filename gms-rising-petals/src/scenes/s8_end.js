// 39.3–46.5 s · "GMS Rising Petals. Little petals… big dreams." Petals converge and the logo rebuilds;
// a garden grows along the bottom; the children pop up and wave; contact line stays; slow push to the end.
import {W, H, C, B, P, IMG, initKit, sunburst, logo, petal, sprite, sticker, flower, stem, pill, waIcon, sparkle, drift, finish, clipBlob, clamp, lerp, hash, F} from '../kit.js';
export const init = initKit;
export function draw(ctx, _t, {t: T}) {
  const iris = P(T, 39.3, 0.6, 'swoop'), push = 1 + 0.035 * P(T, 40.5, 6, 'soft');
  ctx.save(); clipBlob(ctx, 540, 780, iris * 1700, T, 10, 0.06 * (1 - iris));
  ctx.translate(540, 900); ctx.scale(push, push); ctx.translate(-540, -900);
  sunburst(ctx, T, {cy: 760});
  drift(ctx, T, {n: 8, seed: 21, a: 0.55, speed: 0.6});
  // petals converge into the ring
  for (let i = 0; i < 20; i++) {
    const u = P(T, 39.35 + hash(i) * 0.15, 0.7, 'inOut'), ang = i / 20 * Math.PI * 2, d0 = 900 + hash(i + 4) * 300, d = lerp(d0, 330, u);
    const cols = [[C.orange, C.red], [C.green, '#7fd18a'], [C.yellow, C.orange]][i % 3];
    if (u < 1) petal(ctx, 540 + Math.cos(ang + u * 1.2) * d, 760 + Math.sin(ang + u * 1.2) * d, 40, ang + u * 4, cols[0], cols[1], 1 - P(T, 39.95, 0.25, 'in'));
  }
  logo(ctx, 540, 760, 700, {disc: P(T, 39.85, 0.5, 'pop'), rings: P(T, 39.9, 0.5, 'inOut'), gms: P(T, 39.95, 0.55, 'soft'), text1: P(T, B.rp - 0.05, 0.45, 'out'), text2: P(T, B.rp + 0.25, 0.45, 'out')}, T);
  for (let i = 0; i < 5; i++) { const t0 = 41.0 + i * 0.9, g = clamp(1 - Math.abs(T - t0) / 0.3), a = i * 2.4; sparkle(ctx, 540 + Math.cos(a) * 420, 760 + Math.sin(a) * 420, 30 * g, g); }
  // garden
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * 120, h = 150 + hash(i + 1) * 120, gr = P(T, 39.6 + i * 0.06, 0.7, 'soft');
    const [tx, ty] = stem(ctx, x, 1960, h + 300, gr, T, {w: 10, leaves: [0.45]});
    flower(ctx, tx, ty, 54 + hash(i) * 20, P(T, 40.1 + i * 0.06, 0.5, 'pop'), {n: 8, colA: [C.pink, C.yellow, C.orange2, '#ffffff', C.red][i % 5], colB: '#ffffff', center: i % 5 === 1 ? C.orange : C.yellow, rot: T * 0.3 + i});
  }
  // the children
  const b1 = P(T, 40.55, 0.6, 'pop'), b2 = P(T, 40.7, 0.6, 'pop');
  sprite(ctx, IMG.boy, 148, lerp(2300, 1660, b1), 600, {rot: -0.04 + Math.sin(T * 5) * 0.015, shadow: 0});
  sprite(ctx, IMG.girl, 932, lerp(2300, 1660, b2), 600, {rot: 0.04 - Math.sin(T * 5) * 0.015, shadow: 0});
  sticker(ctx, T, ['Little Petals,'], {y: 1270, size: 98, fill: C.green, stroke: '#fff', sw: 0.16, shadow: 0.15, times: [B.littlepetals, 41.88]});
  sticker(ctx, T, ['Big Dreams.'], {y: 1385, size: 112, fill: C.red, stroke: '#fff', sw: 0.16, shadow: 0.15, times: [B.bigdreams - 0.08, 43.04]});
  const cp = P(T, 43.6, 0.5, 'pop');
  if (cp > 0) pill(ctx, '99287 88015  ·  99010 17215', 540, 1470, {size: 34, a: clamp(cp * 1.5), s: 0.7 + 0.3 * cp, fill: C.deep, icon: (c, x, y, r) => waIcon(c, x, y, r * 1.2)});
  finish(ctx, T, {grain: 0.02, vignette: 0.14});
  ctx.restore();
}

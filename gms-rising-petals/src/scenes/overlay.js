// Through-line petal (2.9–8.4 s): born at the sprout tip, flies up with the whip, drifts over the path,
// leads the children to the gate, then becomes the white disc of the logo.
import {W, H, C, P, initKit, petal, clamp, lerp} from '../kit.js';
export const init = initKit;
const K = [[2.95, 548, 600], [3.55, 548, 560], [4.15, 700, 380], [5.4, 400, 560], [6.6, 660, 640], [7.6, 540, 780], [8.05, 540, 860]];
function at(T) { for (let i = 1; i < K.length; i++) if (T <= K[i][0]) { const [t0, x0, y0] = K[i - 1], [t1, x1, y1] = K[i], u = P(T, t0, t1 - t0, 'inOut'); return [lerp(x0, x1, u), lerp(y0, y1, u)]; } return K.at(-1).slice(1); }
export function draw(ctx, _t, {t: T}) {
  const born = P(T, 2.95, 0.5, 'pop'), gone = P(T, 8.0, 0.22, 'in'); if (born <= 0 || gone >= 1) return;
  const [x, y] = at(T), sway = Math.sin(T * 2.4) * 0.5, L = 46 * born * lerp(1, 1.6, P(T, 7.6, 0.4, 'out'));
  ctx.save(); ctx.shadowColor = 'rgba(255,170,60,0.9)'; ctx.shadowBlur = 40;
  petal(ctx, x, y + L / 2, L, sway + T * 0.6, C.red, C.orange, 1 - gone); ctx.restore();
}

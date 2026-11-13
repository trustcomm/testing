// iris-mask: circle mask opening a scene from a small shape, or closing a scene to a dot; plus the ring ripple.
// iris(ctx, t, { cx, cy, R, t0, dur = 0.62, mode = 'open' | 'close', rStart = 0, rEnd = 0 }, drawInside) -> radius
//   open: radius rStart -> R reveals drawInside; close: R -> rEnd keeps drawInside only inside the shrinking circle.
//   Soft edge comes from motion blur at render time (--blur 6).
// ringRipple(ctx, t, { cx, cy, r, t0, dur = 0.34, color, width = 0.12*r }): ring overshoots to 1.57x then thins (r16).
// Numbers: iris-to-dot 620 ms 'iris' easing, ~70% by 35% of the time (r16); check-iris 733 ms (r07); ripple 340 ms + 150 fade.
// Source: techniques/iris-mask.md
import { seg, curve, clamp, lerp } from '../core.js';
import { ez } from './tokens.js';

export function iris(ctx, t, { cx, cy, R, t0, dur = 0.62, mode = 'open', rStart = 0, rEnd = 0 }, drawInside) {
  const p = seg(t, t0, dur, ez('iris'));
  const r = Math.max(0, mode === 'open' ? lerp(rStart, R, p) : lerp(R, rEnd, p));
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip(); drawInside(ctx); ctx.restore();
  return r;
}

const RIPPLE = curve([0, 0.21, 0.56, 0.81, 1.02, 1.22, 1.42, 1.57, 1.53, 1.12, 1.0]);   // r16 measured samples
export function ringRipple(ctx, t, { cx, cy, r, t0, dur = 0.34, color, width, fade = 0.15 }) {
  const u = (t - t0) / dur; if (u <= 0 || t > t0 + dur + fade) return;
  const k = RIPPLE(clamp(u)), w = (width ?? r * 0.12) * (1.4 - 0.9 * clamp(u));
  ctx.save(); ctx.globalAlpha = 0.85 * (1 - clamp((t - t0 - dur) / fade)); ctx.strokeStyle = color; ctx.lineWidth = Math.max(0.5, w);
  ctx.beginPath(); ctx.arc(cx, cy, Math.max(0, r * k), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}

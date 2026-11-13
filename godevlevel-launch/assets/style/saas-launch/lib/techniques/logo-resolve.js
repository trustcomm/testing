// logo-resolve: the logo blur-resolves out of the story's through-line object (dot / orb / bar), then holds.
// logoResolve(ctx, t, { cx, cy, t0, dur = 0.367, blurFrom = 90, scaleFrom = 0.9, drawLogo, seed }) -> p
//   drawLogo(ctx) draws the logo centred on (0, 0). seed = { r, color }: the through-line dot that the logo grows out of;
//   it shrinks into the logo while the blur clears.
// Numbers: r08 blur 90 px -> 0 in 367 ms, 'logo_resolve' easing (slight dip, 6% overshoot), wordmark ~25% frame width,
// hold 0.5-1.3 s (keep something moving; no dead end-card). Source: techniques/logo-resolve.md
import { seg, clamp } from '../core.js';
import { ez } from './tokens.js';

export function logoResolve(ctx, t, { cx, cy, t0, dur = 0.367, blurFrom = 90, scaleFrom = 0.9, drawLogo, seed }) {
  const p = seg(t, t0, dur, ez('logo_resolve'));
  if (seed) {
    const k = 1 - seg(t, t0, dur * 0.8, ez('slam_in'));
    if (k > 0.01) { ctx.save(); ctx.fillStyle = seed.color; ctx.beginPath(); ctx.arc(cx, cy, seed.r * k, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  }
  if (t < t0) return 0;
  const b = blurFrom * (1 - clamp(p)), s = scaleFrom + (1 - scaleFrom) * p;
  ctx.save(); ctx.globalAlpha *= clamp(p * 2); if (b > 0.3) ctx.filter = `blur(${b.toFixed(1)}px)`;
  ctx.translate(cx, cy); ctx.scale(s, s); drawLogo(ctx); ctx.restore();
  return p;
}

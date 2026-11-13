// pill-toggle: pill pop with overshoot (label arrives after the pill settles) and a liquid toggle switch.
// pillPop(ctx, t, { cx, cy, w, h, t0, dur = 0.44, ease = 'pop_soft', color, label, font, textColor, labelDelay = 0.15, rot = 0 })
//   ease 'spring_big' (46% overshoot) at most twice per video.
// toggle(ctx, t, { x, y, w, h, t0, offColor, onColor, knobColor, dur = 0.267 }) -> p   thumb stretches ~40% mid-slide.
// Numbers: toggle 267 ms 'toggle' easing, 4% overshoot (r08); pill pop 440 ms (r16); label +130-200 ms (r17); stagger pops
// ~55 ms apart (r08). Source: techniques/pill-toggle.md
import { seg, clamp, lerp } from '../core.js';
import { rrect } from '../draw.js';
import { ez, ezf, mixColor } from './tokens.js';

export function pillPop(ctx, t, { cx, cy, w, h, t0, dur = 0.44, ease = 'pop_soft', color, label, font, textColor, labelDelay = 0.15, rot = 0 }) {
  if (t < t0) return 0;
  const p = seg(t, t0, dur, ez(ease));
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot * (1 - clamp(p)) * Math.PI / 180); ctx.scale(Math.max(0, p), Math.max(0, p));
  ctx.fillStyle = color; rrect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill();
  if (label) {
    const q = seg(t, t0 + dur * 0.6 + labelDelay, 0.25, ez('out_settle'));
    ctx.globalAlpha *= q; ctx.font = font; ctx.fillStyle = textColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, h * 0.04 + (1 - q) * h * 0.25);
  }
  ctx.restore();
  return p;
}

export function toggle(ctx, t, { x, y, w, h, t0, offColor, onColor, knobColor = '#fff', dur = 0.267 }) {
  const u = clamp((t - t0) / dur), p = ezf('toggle')(u), pad = h * 0.1, kh = h - 2 * pad;
  ctx.save(); ctx.fillStyle = mixColor(offColor, onColor, clamp(p)); rrect(ctx, x, y, w, h, h / 2); ctx.fill();
  const stretch = kh * 0.4 * Math.sin(Math.PI * u);   // liquid: thumb widens mid-slide then contracts
  const kx = lerp(x + pad, x + w - pad - kh, p) - stretch * (1 - p);
  ctx.fillStyle = knobColor; rrect(ctx, kx, y + pad, kh + stretch, kh, kh / 2); ctx.fill(); ctx.restore();
  return p;
}

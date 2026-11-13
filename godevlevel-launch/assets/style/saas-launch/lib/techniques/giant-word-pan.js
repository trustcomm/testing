// giant-word-pan: scale-cut to ONE word filling 60-70% of frame height (cropped), camera pans across it.
// giantWordPan(ctx, t, word, { W, H, t0, dur = 0.7, ease = 'pan_giant', heightFrac = 0.65, from = 0.05, to = 0.95,
//   weight = 700, family = 'Inter Tight', color, fill }) -> { x0, width, size }
//   from/to = which point of the word (0..1 of its width) sits at frame centre at the start/end of the pan.
//   Draw it only inside the window you want (the caller decides cut in/out). fill = optional (ctx, x0, x1) => CanvasGradient.
// Numbers: r13 pan ~55% of frame in 700 ms (pan_giant); r15 2.54 s near-linear (pan_linear); word 60-70% of height (r15).
// Source: techniques/giant-word-pan.md
import { seg, lerp } from '../core.js';
import { ez } from './tokens.js';

export function giantWordPan(ctx, t, word, o) {
  const { W, H, t0, dur = 0.7, ease = 'pan_giant', heightFrac = 0.65, from = 0.05, to = 0.95, weight = 700, family = 'Inter Tight', color, fill } = o;
  const capH = 0.73;   // Inter Tight cap height / font size
  const size = heightFrac * H / capH;
  ctx.save(); ctx.font = `${weight} ${size.toFixed(1)}px "${family}"`; ctx.letterSpacing = `${(-0.03 * size).toFixed(1)}px`;
  const w = ctx.measureText(word).width, p = seg(t, t0, dur, ez(ease));
  const x0 = W / 2 - lerp(from, to, p) * w, y = H / 2 + heightFrac * H / 2;
  ctx.fillStyle = fill ? fill(ctx, x0, x0 + w) : color; ctx.textAlign = 'left'; ctx.fillText(word, x0, y);
  ctx.restore();
  return { x0, width: w, size };
}

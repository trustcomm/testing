// hero-word-rise: letters rise one by one out of a baseline mask while the word grows to 45-65% of frame width.
// heroWordRise(ctx, t, word, { cx, y (baseline), W, widthFrac = 0.55, t0, stagger = 0.1, dur = 0.733, ease = 'pop_soft',
//   weight = 600, family = 'Inter Tight', color, trackingFrom = 0.06, tracking = -0.03 }) -> { size, settleAt }
// Numbers: r09 733 ms, ~100 ms letter stagger, 8% overshoot, ~65% width; r05 pop_soft 7% overshoot. Big springs only on hooks.
// Source: techniques/hero-word-rise.md
import { seg, stagger as stg, clamp, lerp } from '../core.js';
import { layoutText, drawGlyph } from '../draw.js';
import { ez } from './tokens.js';

export function heroWordRise(ctx, t, word, o) {
  const { cx, y, W, widthFrac = 0.55, t0, stagger = 0.1, dur = 0.733, ease = 'pop_soft', weight = 600, family = 'Inter Tight', color,
    trackingFrom = 0.06, tracking = -0.03 } = o;
  ctx.font = `${weight} 100px "${family}"`; ctx.letterSpacing = '0px';
  const n = [...word].length;
  const size = 100 * widthFrac * W / (ctx.measureText(word).width + tracking * 100 * (n - 1));
  const total = (n - 1) * stagger + dur, settle = seg(t, t0, total, ez('out_settle'));
  const tr = lerp(trackingFrom, tracking, settle), scale = 0.88 + 0.12 * settle;   // word grows and tightens as it lands
  ctx.save(); ctx.translate(cx, y); ctx.scale(scale, scale); ctx.translate(-cx, -y);
  const gs = layoutText(ctx, word, { x: cx, y, font: `${weight} ${size.toFixed(1)}px "${family}"`, tracking: tr });
  ctx.beginPath(); ctx.rect(cx - 2 * W, y - size * 1.2, 4 * W, size * 1.42); ctx.clip();   // baseline mask (keeps descenders)
  ctx.fillStyle = color;
  for (const g of gs) {
    const p = stg(t, g.i, t0, stagger, dur, ez(ease));
    drawGlyph(ctx, g, { dy: (1 - p) * size * 1.05, alpha: clamp(p * 3) });
  }
  ctx.restore();
  return { size, settleAt: t0 + total };
}

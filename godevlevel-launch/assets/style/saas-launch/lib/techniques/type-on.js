// type-on: characters appear one by one from a caret; each new letter flashes in the glow colour and cools.
// typeOn(ctx, t, text, { x, y, font, color, t0, rate = 0.06 s/char, glow, glowDecay = 0.6, caret = true, align = 'left',
//   tracking }) -> { n, done, caretX, caretY, size }
// Numbers: 60 ms/letter (r16), 67-70 ms (r03, r17), 18 ms fast (r08); glow cools over 500-650 ms (r06); caret blink 530 ms
// (choice). Source: techniques/type-on.md
import { layoutText, drawGlyph, glow as glowFx } from '../draw.js';
import { clamp } from '../core.js';

export function typeOn(ctx, t, text, { x, y, font, color, t0, rate = 0.06, glow, glowDecay = 0.6, caret = true, caretColor, align = 'left', tracking = 0 }) {
  const gs = layoutText(ctx, text, { x, y, font, align, tracking });   // final layout, so letters never shift while typing
  ctx.font = font;
  const n = clamp(Math.floor((t - t0) / rate) + 1, 0, [...text].length), size = gs[0]?.size || parseFloat(font.match(/(\d+(?:\.\d+)?)px/)[1]);
  // layoutText drops spaces; map typed char count -> glyph count
  const at = [...text].map((c, i) => c === ' ' ? -1 : i).filter(i => i >= 0);   // char index of each glyph
  const typed = at.filter(i => i < n).length;
  for (let i = 0; i < typed; i++) {
    const g = gs[i], age = t - (t0 + at[i] * rate);
    const k = glow ? Math.max(0, 1 - age / glowDecay) : 0;
    if (k > 0.02) glowFx(ctx, size * 0.5, glow, k, () => drawGlyph(ctx, g, { color }));
    else drawGlyph(ctx, g, { color, alpha: clamp(age / 0.05) });
  }
  const last = gs[typed - 1];
  const caretX = typed ? last.x + last.w + size * 0.06 : (gs[0]?.x ?? x), caretY = gs[0]?.y ?? y;
  if (caret && t >= t0 - 0.3 && (n < [...text].length || Math.floor((t - t0) / 0.53) % 2 === 0)) {
    ctx.fillStyle = caretColor || glow || color; ctx.fillRect(caretX, caretY - size * 0.78, Math.max(2, size * 0.07), size * 0.95);
  }
  return { n, done: n >= [...text].length, caretX, caretY, size };
}
// Times each character appears (for type_key cues; thin to every 2-3 chars when rate < 30 ms).
export const typeOnCues = (t0, text, rate = 0.06, every = 1) => [...text].map((c, i) => c === ' ' || i % every ? null : t0 + i * rate).filter(v => v != null);

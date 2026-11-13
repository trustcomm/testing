// word-blur-in: words resolve from blur left to right (focus pull), optional collapse exit.
// wordBlurIn(ctx, t, text, { x, y, font, color, t0, stagger = 0.1, dur = 0.5, blur = 32, scaleFrom = 1.08, rise = 20,
//   accent: { word: index, color }, exitAt, exitDur = 0.267, align, maxWidth }) -> { words, lastWordAt }
// Numbers: blur 16-40 px, ~100 ms word stagger, 400-800 ms per word, scale 1.08 -> 1, 'blur_in' easing (r11/r16);
// exit: gaps close in 267 ms ease-in (r13). Source: techniques/word-blur-in.md
import { seg, stagger as stg } from '../core.js';
import { layoutText, drawGlyph } from '../draw.js';
import { ez } from './tokens.js';

export function wordBlurIn(ctx, t, text, o) {
  const { x, y, font, color, t0, stagger = 0.1, dur = 0.5, blur = 32, scaleFrom = 1.08, rise = 20, accent, exitAt, exitDur = 0.267, align = 'center', maxWidth } = o;
  const gs = layoutText(ctx, text, { x, y, font, align, maxWidth, tracking: o.tracking ?? -0.02 });
  ctx.font = font; ctx.fillStyle = color;
  const nWords = gs.length ? gs[gs.length - 1].word + 1 : 0;
  const ex = exitAt == null ? 0 : seg(t, exitAt, exitDur, 'in');
  // collapse exit: every glyph slides toward the line centre and fades
  const cx = gs.length ? (gs[0].x + gs[gs.length - 1].x + gs[gs.length - 1].w) / 2 : x;
  for (const g of gs) {
    const p = stg(t, g.word, t0, stagger, dur, ez('blur_in'));
    drawGlyph(ctx, g, { blur: blur * (1 - p), scale: scaleFrom - (scaleFrom - 1) * p, alpha: Math.min(1, p * 1.6) * (1 - ex),
      dy: rise * (1 - p), dx: (cx - (g.x + g.w / 2)) * ex * 0.85, color: accent && accent.word === g.word ? accent.color : color });
  }
  return { words: nWords, lastWordAt: t0 + (nWords - 1) * stagger };
}
// Time each word is ~50% sharp (for the text_tick cue per word).
export const wordBlurInCues = (t0, nWords, stagger = 0.1, dur = 0.5) => Array.from({ length: nWords }, (_, i) => t0 + i * stagger + dur * 0.55);

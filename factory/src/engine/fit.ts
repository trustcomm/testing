/**
 * fit(): largest font size (≤ max, ≥ min) at which `text` fits `maxWidth` (single line) or
 * wraps into at most `maxLines` lines of `maxWidth`. Uses canvas measureText with the real fonts.
 */
let ctx: CanvasRenderingContext2D | null = null;
const measure = (text: string, font: string) => {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  ctx!.font = font;
  return ctx!.measureText(text).width;
};

const linesNeeded = (words: string[], size: number, family: string, weight: number, maxWidth: number) => {
  const font = `${weight} ${size}px ${family}`;
  const space = measure(" ", font);
  let lines = 1;
  let w = 0;
  for (const word of words) {
    const ww = measure(word, font);
    if (ww > maxWidth) return Infinity;
    if (w === 0) w = ww;
    else if (w + space + ww <= maxWidth) w += space + ww;
    else {
      lines++;
      w = ww;
    }
  }
  return lines;
};

export const fit = (
  text: string,
  opts: { maxWidth: number; max: number; min?: number; family: string; weight: number; maxLines?: number },
): number => {
  const words = text.split(/\s+/).filter(Boolean);
  const min = opts.min ?? Math.round(opts.max * 0.4);
  const maxLines = opts.maxLines ?? 1;
  for (let size = opts.max; size > min; size -= 2) {
    if (linesNeeded(words, size, opts.family, opts.weight, opts.maxWidth) <= maxLines) return size;
  }
  return min;
};

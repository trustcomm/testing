// ─────────────────────────────────────────────────────────────
// @baqur.ai series look: "Apple keynote at night"
// Change the look here, once, and every reel follows.
// ─────────────────────────────────────────────────────────────
import '@fontsource-variable/inter';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/jetbrains-mono';

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 60,
} as const;

export const C = {
  bg: '#000000',
  ink: '#F5F5F7', // white line art / primary text
  ink2: 'rgba(245,245,247,0.62)', // secondary text
  ink3: 'rgba(245,245,247,0.34)', // tertiary / hairlines
  hair: 'rgba(245,245,247,0.14)',
  red: '#FF3B30', // alarm (story start)
  green: '#34C759', // trust (story end)
  amber: '#FFB340', // numerals only
  glass: 'rgba(28,28,30,0.55)',
  glassEdge: 'rgba(255,255,255,0.10)',
} as const;

export const F = {
  display: "'Inter Variable', 'Inter', -apple-system, 'SF Pro Display', system-ui, sans-serif",
  serif: "'Instrument Serif', 'New York', Georgia, serif",
  mono: "'JetBrains Mono Variable', 'JetBrains Mono', 'SF Mono', Menlo, monospace",
} as const;

// Type scale (px at 1080 wide). Tight tracking on big sizes, like Apple.
export const T = {
  hero: {fontSize: 260, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.92},
  h1: {fontSize: 96, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.0},
  h2: {fontSize: 64, fontWeight: 650, letterSpacing: '-0.025em', lineHeight: 1.08},
  body: {fontSize: 42, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.25},
  label: {fontSize: 30, fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1.2},
  micro: {fontSize: 24, fontWeight: 500, letterSpacing: '0.02em', lineHeight: 1.3},
} as const;

// Instagram UI safe zones (1080×1920). Keep text out of these.
export const SAFE = {
  top: 240,
  bottom: 440,
  side: 72,
} as const;

// Story arc colour: 0 = alarm red, 1 = trust green.
export const arcColor = (t: number) => {
  const k = Math.max(0, Math.min(1, t));
  const a = [0xff, 0x3b, 0x30];
  const b = [0x34, 0xc7, 0x59];
  const m = a.map((v, i) => Math.round(v + (b[i] - v) * k));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
};

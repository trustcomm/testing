export const W = 1080, H = 1920, FPS = 30;
export const C = {
  canvas: "#F5F5F7", text: "#1D1D1F", secondary: "#6E6E73", accent: "#0071E3", warn: "#FF3B30", ok: "#34C759", black: "#000000", white: "#FFFFFF",
} as const;
// Instagram's UI covers the top 240 px and the bottom 440 px of a 1080x1920 reel: key content stays inside y 240..1480.
export const SAFE = { top: 240, bottom: 440 };
export const STAGE = { top: 262, bottom: 1290 };           // the hero content lives here (the camera push widens it by 4 %); captions sit under it
export const CAPTION = { centerY: 1388 };                   // caption pill centre: its bottom edge stays under 1480
export const FONT = {
  display: '"Inter Display", Inter, system-ui, sans-serif',
  ui: 'Inter, system-ui, sans-serif',
  serif: '"Playfair Display", "Instrument Serif", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
};
// Apple-style spring: stiffness ~170, damping ~22 -> damping ratio 0.84, an overshoot under 1 % (the brief allows 3 %)
export const SPRING = { stiffness: 170, damping: 22, mass: 1 } as const;
export const STAGGER = 4;        // frames between staggered reveals
export const RISE = 24;          // px an element rises as it enters
export const BLUR_IN = 8;        // px of blur it enters from
export const PUSH = 0.04;        // the camera pushes in 4 % over every scene
export const TRANSITION = 12;    // frames of a blur-dissolve

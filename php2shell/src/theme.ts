export const W = 1080, H = 1920, FPS = 30;
export const C = {
  black: "#000000", lift: "#0B0C0F", liftTrust: "#0F1110",
  text: "#F5F5F7", secondary: "#8E8E93", hair: "#2C2C2E",
  alarm: "#FF3B30",            // danger, bug, hacker, critical: it means "danger"
  trust: "#34C759",            // fix, safe versions, "sach": appears ONLY from S10 onward
  glass: "rgba(255,255,255,0.06)", glassStroke: "rgba(255,255,255,0.12)",
} as const;
// Safe zones: nothing important in the top 240 px or the bottom 440 px (Instagram's UI covers them).
export const SAFE = { top: 240, bottom: 440 };
// The hero stage: scenes keep their content inside x 60..1020, y 270..1330. Captions sit under it, above the bottom zone.
export const STAGE = { left: 60, right: 1020, top: 270, bottom: 1330, cx: 540, cy: 800 };
export const CAPTION_Y = 1410;       // centre of the caption line; S11 moves it up (CAPTION_Y_S11)
export const CAPTION_Y_S11 = 1345;
export const FONT = {
  display: '"Inter Display", Inter, system-ui, sans-serif',
  body: 'Inter, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
  serif: '"Instrument Serif", Georgia, serif',
};
export const STROKE_W = 3;           // every illustration is a single-weight 3 px white stroke at 1080 w, rounded caps
// Chips: stiffness 160, damping 18 (zeta 0.71: ~4 % overshoot at most)
export const SPRING = { stiffness: 160, damping: 18, mass: 1 } as const;
export const DISSOLVE = 9;           // frames: "blur + fade 0.3 s"
export const ANTICIPATE = 6;         // frames: a scene's layer starts this long before its first word (4-8 frames)

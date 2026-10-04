// All constants for the title-card video. renderFrame(t) reads only these and t.
export const W = 1920;
export const H = 1080;
export const FPS = 30;

export const COLORS = {
  bg: "#0b0b0f",
  ink: "#f4f2ec",
  accent: "#c8ff3d",
};

export const FONT_FAMILY = "Space Grotesk";
export const FONT_WEIGHT = 700;
export const FONT_SIZE = 168; // max size; long lines shrink to fit the margin
export const MARGIN = 144;

// One card per line. `accent` = index of the single word drawn in the accent colour.
export const LINES = [
  { text: "Every frame is code", accent: 3 },
  { text: "Nothing is filmed", accent: 2 },
  { text: "Same input", accent: 1 },
  { text: "Same pixels", accent: 1 },
  { text: "Render it free", accent: 2 },
];

// Motion (seconds / px)
export const FADE_IN = 0.5;
export const RISE = 40;
export const FADE_OUT = 0.25;
export const holdFor = (words) => Math.max(1.2, 0.35 + words / 3.2);

// Pacing between cards so the whole piece lands in the 15–20 s window
export const LEAD_IN = 0.6;
export const GAP = 1.0;
export const TAIL = 1.0;

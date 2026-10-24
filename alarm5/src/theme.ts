export const W = 1080, H = 1920, FPS = 60;
export const C = {
  black: "#000000", lift: "#0B0C0F", grid: "#1C1C1E",
  text: "#F5F5F7", secondary: "#8E8E93", hair: "#2C2C2E",
  alarm: "#FF3B30",            // danger (S1-S12 only)
  trust: "#34C759",            // fixes / actions, and everything from S13
  amber: "#FFB340",            // ONLY the countdown numerals' glow
  glass: "rgba(255,255,255,0.06)", glassStroke: "rgba(255,255,255,0.12)",
} as const;
// Safe zones: nothing important in the top 240 px or the bottom 440 px (Instagram's UI covers them).
export const SAFE = { top: 240, bottom: 440 };
// The hero stage: the camera frames a station so its centre sits at STAGE_CY on screen; content stays inside y 270..1330 of the screen.
export const STAGE = { left: 60, right: 1020, top: 270, bottom: 1330, cx: 540, cy: 800 };
export const CAPTION_Y = 1410;       // centre of the caption line
export const FONT = {
  display: '"Inter Display", Inter, system-ui, sans-serif',
  body: 'Inter, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
  serif: '"Instrument Serif", Georgia, serif',
};
export const STROKE_W = 3;           // 3 px on SCREEN at every zoom (strokes divide by the layer scale)
// Physical elements: springs with stiffness 120-180, damping 18-24, mass 1 (overshoot <= 4 %).
export const SPRING = { k: 150, c: 20, m: 1 } as const;
export const WORLD = { w: 5400, h: 9600 };
/** the five alarm stations: centre points on the WORLD map (countdown order 5 -> 4 -> 3 -> 2 -> 1) */
export const STATION = {
  5: { x: 1100, y: 1600, name: "BANK" },
  4: { x: 4200, y: 2900, name: "PACKAGE" },
  3: { x: 1300, y: 4700, name: "SERVER CITY" },
  2: { x: 4100, y: 6400, name: "PHONE" },
  1: { x: 2700, y: 8200, name: "PHP CORE" },
} as const;
export type StationNo = 5 | 4 | 3 | 2 | 1;
export const SEC = (s: number) => Math.round(s * FPS);   // seconds -> frames

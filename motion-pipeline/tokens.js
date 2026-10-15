// Frozen once approved: the one file every scene imports for colour, type and spacing.
export const tokens = {
  W: 1920, H: 1080, FPS: 30,
  // four hues (accent, ice, coral, violet) plus the neutrals bg, ink, dim and glow; npm test enforces the count
  color: { bg: '#0b0b0f', ink: '#f4f2ec', accent: '#c8ff3d', dim: '#6b6b76', glow: '#1b1b26', ice: '#7cc8ff', coral: '#ff7a59', violet: '#a58bff' },
  font: { display: '"Space Grotesk"', body: 'Inter', mono: '"JetBrains Mono"' },
  size: { hero: 168, h1: 112, h2: 72, body: 40, label: 26 },
  track: { hero: -0.035, h1: -0.03, label: 0.08 },   // em
  safe: { x: 144, y: 96 },                            // 7.5% x, ~9% y
  stroke: { outline: 4.5, detail: 3 },                // px: silhouettes, then interior detail
  radius: 16,                                         // px: every rounded corner
  shadowAlpha: 0.3,                                   // contact shadows and floor light
  hold: 1.2,                                          // min seconds fully legible
  // every face the scenes draw with; index.html loads each before READY (Inter is not bundled yet)
  fonts: ['700 100px "Space Grotesk"', '500 26px "JetBrains Mono"'],
};

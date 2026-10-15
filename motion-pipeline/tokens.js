// Frozen once approved: the one file every scene imports for colour, type and spacing.
export const tokens = {
  W: 1920, H: 1080, FPS: 30,
  color: { bg: '#0b0b0f', ink: '#f4f2ec', accent: '#c8ff3d', dim: '#6b6b76', glow: '#1b1b26' },
  font: { display: '"Space Grotesk"', body: 'Inter', mono: '"JetBrains Mono"' },
  size: { hero: 168, h1: 112, h2: 72, body: 40, label: 26 },
  track: { hero: -0.035, h1: -0.03, label: 0.08 },   // em
  safe: { x: 144, y: 96 },                            // 7.5% x, ~9% y
  hold: 1.2,                                          // min seconds fully legible
  // every face the scenes draw with; index.html loads each before READY (Inter is not bundled yet)
  fonts: ['700 100px "Space Grotesk"', '500 26px "JetBrains Mono"'],
};

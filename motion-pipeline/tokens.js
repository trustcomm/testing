// Frozen once approved: every colour, size and timing the scenes use.
const font = (px) => `700 ${px}px "Space Grotesk", system-ui, sans-serif`;
export const tokens = {
  W: 1920, H: 1080, FPS: 30,
  color: { bg: "#0b0b0f", fg: "#ffffff", dim: "#8a8f98", accent: "#ff4a24", ice: "#8fd8ff" },
  font,
  fonts: [font(100)],   // every face the scenes draw with; index.html loads each before READY
};

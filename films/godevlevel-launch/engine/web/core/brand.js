// Approved brand values (STATE.md). Every other tone on screen is a blend of these three.
export const C = { charcoal: "#323743", orange: "#FD4B25", ink: "#F5F3EF" };
// Display face approved by the user 2026-10-05: Archivo ExtraBold (OFL). Inter Tight stays loaded for comparison only.
export const FONT = { display: '"Archivo"', mono: '"JetBrains Mono"' };
// Orange is never used for text under this many screen pixels (contrast on charcoal ≈ 3.5:1).
export const ORANGE_TEXT_MIN_PX = 48;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const colour = (name) => (name in C ? C[name] : name);

/** Blend two brand colours (t = 0 → a, 1 → b) as an rgb() string. */
export function mix(a, b, t) {
  const A = hex(colour(a));
  const B = hex(colour(b));
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
/** A brand colour with alpha, as rgba(). */
export function alpha(name, a) {
  const [r, g, b] = hex(colour(name));
  return `rgba(${r},${g},${b},${a})`;
}

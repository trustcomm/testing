// Trustcomm palette and type.
// PRODUCT COLOURS: measured — confirm against site CSS before final. (Working values from the flat-fill pixels of the
// real /r/demo screenshots, ui/demo-*.jpg, 2026-10-05.)
export const P = {
  // Measured from the real /r/demo screens (ui/demo-*.jpg, flat-fill pixels), 2026-10-05:
  blue: "#1E5EFE", // buttons, stars, ticked chips, progress dots
  ink: "#111216", // headings and body text
  grey: "#6D6D75", // secondary text
  line: "#EAE9E5", // hairlines, idle dots, chip outlines
  edge: "#E6E5E1", // card / chip borders
  tint: "#E4EAF8", // light-blue panels (owner-message header, tick badge)
  paper: "#FAF9F5", // the page background = the film's paper white
  white: "#FFFFFF",
  // Film-only colours:
  sand: "#EFE7DA", // warm neutral (BRIEF §3)
  shop: "#F2A93B", // the fictional demo shop's own colour on its counter stand (F3)
  skin: "#C98F65", // the illustrated thumb in Beat 10
  starOff: "#DCDBD7", // INFERRED: unrated star — PENDING the user's phone screenshot of the unrated screen
  red: "#E5484D", // Beat 1–3 film-only: the one loud, angry customer shape and its sound-wave spike
  green: "#3DBE7A", // Beat 1 / 14 film-only: the quiet, happy customer shapes
};
// One geometric OFL sans (BRIEF §3): Poppins, proposed; the client's own font replaces it if supplied.
export const FONT = '"Poppins"';
// Inside the phone screens: Inter (OFL), the closest match to the product's system sans, with Noto Sans for the
// Indic scripts of the Beat 8 language flips (user, 2026-10-05).
export const UIFONT = '"Inter", "Noto Sans Devanagari", "Noto Sans Kannada", "Noto Sans Tamil", "Noto Sans Telugu", sans-serif';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const col = (c) => P[c] ?? c;
export function mix(a, b, t) {
  const A = hex(col(a)), B = hex(col(b));
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
export function rgba(c, a) {
  const [r, g, b] = hex(col(c));
  return `rgba(${r},${g},${b},${a})`;
}

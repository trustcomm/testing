// Trustcomm palette and type. PROVISIONAL until the client approves (STATE.md):
//   blue / ink measured from client/logo-from-chat.jpg (JPG, so approximate); paper + sand are the brief's
//   "one bright paper white + one warm neutral"; shop = the fictional demo shop's own colour (F3: stand printed
//   in the shop's colours); skin = the illustrated thumb in Beat 10.
export const P = {
  blue: "#0E50FC",
  ink: "#141723",
  paper: "#FAF8F4",
  sand: "#EFE7DA",
  white: "#FFFFFF",
  shop: "#F2A93B",
  skin: "#C98F65",
};
// One geometric OFL sans (BRIEF §3): Poppins, proposed; the client's own font replaces it if supplied.
export const FONT = '"Poppins"';

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

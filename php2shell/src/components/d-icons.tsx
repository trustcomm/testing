// Line-art helpers for S11-S13 (owner: the S11-S13 scene author). Shape generators return SVG path strings in canvas pixels, to be drawn with <Stroke>.
import { arc, circle, line, poly, rrect } from "./draw";

const rad = (a: number) => (a * Math.PI) / 180;

/** A jigsaw piece, centred on (cx, cy), `size` px wide (tab to tab). Tabs on top and right, sockets on the left and bottom. */
export const puzzle = (cx: number, cy: number, size: number): string => {
  const k = size / 156, T = (x: number, y: number) => `${(cx + (x - 118) * k).toFixed(2)} ${(cy + (y - 82) * k).toFixed(2)}`, r = (22 * k).toFixed(2);
  return `M${T(40, 40)}H${(cx + (83.03 - 118) * k).toFixed(2)}A${r} ${r} 0 1 1 ${T(116.97, 40)}H${(cx + (160 - 118) * k).toFixed(2)}V${(cy + (83.03 - 82) * k).toFixed(2)}A${r} ${r} 0 1 1 ${T(160, 116.97)}V${(cy + (160 - 82) * k).toFixed(2)}H${(cx + (116.97 - 118) * k).toFixed(2)}A${r} ${r} 0 1 0 ${T(83.03, 160)}H${(cx + (40 - 118) * k).toFixed(2)}V${(cy + (116.97 - 82) * k).toFixed(2)}A${r} ${r} 0 1 0 ${T(40, 83.03)}Z`;
};

/** A circular restart arrow: a clockwise arc from a0 to a1 (degrees, 0 = right, 90 = down) with an open arrowhead at its end. */
export const restartArrow = (cx: number, cy: number, r: number, a0 = -55, a1 = 235): string => {
  const ex = cx + r * Math.cos(rad(a1)), ey = cy + r * Math.sin(rad(a1));
  const heading = Math.atan2(Math.cos(rad(a1)), -Math.sin(rad(a1))), head = r * 0.42;
  const barb = (s: number) => `${(ex + head * Math.cos(heading + s * (Math.PI - 0.62))).toFixed(2)} ${(ey + head * Math.sin(heading + s * (Math.PI - 0.62))).toFixed(2)}`;
  return `${arc(cx, cy, r, a0, a1)}M${barb(1)}L${ex.toFixed(2)} ${ey.toFixed(2)}L${barb(-1)}`;
};

/** The paper-plane "send" glyph (24-unit grid), centred on (cx, cy), `size` px, its tip pointing along `heading` degrees (0 = right, 90 = down). */
export const paperPlane = (cx: number, cy: number, size: number, heading: number): string => {
  const k = size / 24, a = rad(heading + 45), ca = Math.cos(a), sa = Math.sin(a);
  const P = (x: number, y: number) => { const dx = (x - 12) * k, dy = (y - 12) * k; return `${(cx + dx * ca - dy * sa).toFixed(2)} ${(cy + dx * sa + dy * ca).toFixed(2)}`; };
  return `M${P(22, 2)}L${P(15, 22)}L${P(11, 13)}L${P(2, 9)}ZM${P(22, 2)}L${P(11, 13)}`;
};

/** An envelope outline (w x h) with its flap, centred on (cx, cy). */
export const envelope = (cx: number, cy: number, w: number, h: number): string => {
  const x = cx - w / 2, y = cy - h / 2;
  return `${rrect(x, y, w, h, Math.min(8, h * 0.2))}M${x + 5} ${y + 6}L${cx} ${y + h * 0.58}L${x + w - 5} ${y + 6}`;
};

/** A chat bubble with a tail at the bottom left. */
export const bubble = (x: number, y: number, w: number, h: number, r = 40): string =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + 46}C${x + 28} ${y + h} ${x + 12} ${y + h + 6} ${x - 12} ${y + h + 22}C${x - 2} ${y + h + 8} ${x} ${y + h - 8} ${x} ${y + h - 30}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

/** A person: a head circle and a shoulder arc. (cx, cy) = centre of the head. */
export const person = (cx: number, cy: number, head = 44): { head: string; shoulders: string } => ({
  head: circle(cx, cy, head),
  shoulders: arc(cx, cy + head * 3 + 8, head * 2, 205, 335),
});

/** A browser window outline: frame, title bar rule, three dots, an address bar. Returns separate paths so they can write on in turn. */
export const browserWindow = (x: number, y: number, w: number, h: number) => ({
  frame: rrect(x, y, w, h, 18),
  bar: line(x, y + 52, x + w, y + 52),
  dots: [0, 1, 2].map((i) => circle(x + 28 + i * 22, y + 26, 4.5)),
  address: rrect(x + 108, y + 8, w - 108 - 18, 36, 18),
});

export { poly };

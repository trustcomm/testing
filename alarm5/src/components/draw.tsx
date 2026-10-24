// Line art. Every illustration is a single-weight 3 px stroke (#F5F5F7) ON SCREEN (the stroke divides by the layer's scale), rounded caps, written on with stroke-dashoffset.
// Draw into <Local> (an SVG whose origin is the object's origin, in WORLD pixels at scale 1) or into <Canvas> (a full-frame screen-space SVG).
import React, { createContext, useContext, useId } from "react";
import { C, H, STROKE_W, W } from "../theme";
import { useFrame } from "../clock";
import { clamp01 } from "../motion";
import { swing } from "../easing";

/** the scale (screen px per local px) of the object being drawn; strokes divide by it so they stay 3 px on screen */
export const ScaleCtx = createContext(1);
export const useScale = () => useContext(ScaleCtx);

export const Canvas: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", ...style }}>{children}</svg>
);
/** a zero-size SVG whose children are in local object coordinates */
export const Local: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <svg width={1} height={1} viewBox="0 0 1 1" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", ...style }}>{children}</svg>
);

/** write-on progress 0..1 (swing) of something that starts on frame `at` and takes `frames` (30-50 frames at 60 fps) */
export const useWrite = (at: number, frames = 36) => swing((useFrame() - at) / frames);

export interface StrokeProps {
  d: string;
  at?: number; frames?: number;      // write-on from frame `at` over `frames`
  p?: number;                        // or give the progress directly (0..1); overrides at/frames
  from?: number;                     // draw only from this fraction (a trailing erase: from rising)
  color?: string; w?: number; opacity?: number;
  dotted?: number;                   // dotted line: spacing in px
  glow?: string;                     // soft drop-shadow colour
  fill?: string;
  transform?: string;
  style?: React.CSSProperties;
}
export const Stroke: React.FC<StrokeProps> = ({ d, at = 0, frames = 36, p, from = 0, color = C.text, w, opacity = 1, dotted, glow, fill = "none", transform, style }) => {
  const f = useFrame(), sc = useScale();
  const mid = useId().replace(/:/g, "");
  const sw = (w ?? STROKE_W) / sc;
  const k = clamp01(p ?? swing((f - at) / frames));
  if (k <= 0 || opacity <= 0 || k <= from) return null;
  const common = { fill, stroke: color, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, opacity, transform, style: { filter: glow ? `drop-shadow(0 0 ${8 / sc}px ${glow})` : undefined, ...style } };
  if (dotted) {
    const dd = dotted / sc;
    return (
      <g>
        <mask id={mid} maskUnits="userSpaceOnUse" x={-9000} y={-9000} width={18000} height={18000}><path d={d} fill="none" stroke="#fff" strokeWidth={sw * 8} strokeLinecap="round" pathLength={1} strokeDasharray={k >= 0.9995 ? undefined : "1 1"} strokeDashoffset={k >= 0.9995 ? undefined : 1 - k} transform={transform} /></mask>
        <path d={d} {...common} strokeDasharray={`0.01 ${dd}`} mask={`url(#${mid})`} />
      </g>
    );
  }
  if (k >= 0.9995 && from === 0) return <path d={d} {...common} />;
  return <path d={d} {...common} pathLength={1} strokeDasharray={`${k - from} 1`} strokeDashoffset={-from} />;
};

// ---- shape helpers (local pixels) ----
export const line = (x1: number, y1: number, x2: number, y2: number) => `M${x1} ${y1}L${x2} ${y2}`;
export const poly = (pts: [number, number][], close = false) => `M${pts.map(([x, y]) => `${x} ${y}`).join("L")}${close ? "Z" : ""}`;
export const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}`;
/** rounded rectangle, starting at the top-left, clockwise */
export const rrect = (x: number, y: number, w: number, h: number, r = 0) => {
  r = Math.min(r, w / 2, h / 2);
  return r ? `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z` : `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
};
/** arc of a circle, angles in degrees (0 = right, 90 = down), clockwise from a0 to a1 */
export const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${x0} ${y0}A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${x1} ${y1}`;
};
export const quad = (x1: number, y1: number, cx: number, cy: number, x2: number, y2: number) => `M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`;
export const cubic = (x1: number, y1: number, c1x: number, c1y: number, c2x: number, c2y: number, x2: number, y2: number) => `M${x1} ${y1}C${c1x} ${c1y} ${c2x} ${c2y} ${x2} ${y2}`;
export const check = (cx: number, cy: number, s: number) => poly([[cx - s * 0.5, cy + s * 0.02], [cx - s * 0.14, cy + s * 0.4], [cx + s * 0.55, cy - s * 0.38]]);
export const cross = (cx: number, cy: number, s: number) => `${line(cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2)}${line(cx + s / 2, cy - s / 2, cx - s / 2, cy + s / 2)}`;

export const pointsOnPath = (d: string, n: number): { x: number; y: number }[] => {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
  el.setAttribute("d", d);
  const L = el.getTotalLength();
  return Array.from({ length: n }, (_, i) => { const q = el.getPointAtLength((L * i) / Math.max(1, n - 1)); return { x: q.x, y: q.y }; });
};
export const pathLength = (d: string): number => { const el = document.createElementNS("http://www.w3.org/2000/svg", "path"); el.setAttribute("d", d); return el.getTotalLength(); };
export const pointAt = (d: string, t: number): { x: number; y: number; angle: number } => {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path"); el.setAttribute("d", d);
  const L = el.getTotalLength(), s = L * clamp01(t), a = el.getPointAtLength(s), b = el.getPointAtLength(Math.min(L, s + 1));
  return { x: a.x, y: a.y, angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI };
};

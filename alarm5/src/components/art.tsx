// Shared pieces of station art (local px; strokes stay 3 px on screen). HTML pieces are positioned with <Abs>, SVG pieces go inside <Local>.
import React from "react";
import { C, FONT } from "../theme";
import { useFrame } from "../clock";
import { clamp01, lerp, smooth, springAt } from "../motion";
import { glide, settle, swing } from "../easing";
import { Local, Stroke, arc, circle, line, poly, rrect, check } from "./draw";
import { Pill, Tone } from "./pill";

/** absolutely positioned (centre x, y) HTML in local object space */
export const Abs: React.FC<{ x: number; y: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, style, children }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", ...style }}>{children}</div>
);

/** a world pill that springs in (scale from 0.6, fade over 8 frames) on frame `at`, and leaves with a blur over 10 frames from `out` */
export const WPill: React.FC<{ x: number; y: number; at: number; out?: number; tone?: Tone; size?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ x, y, at, out, tone = "default", size = 28, style, children }) => {
  const f = useFrame();
  if (f < at) return null;
  const o = out === undefined ? 0 : glide(clamp01((f - out) / 10));
  if (o >= 1) return null;
  const s = springAt(f, at);
  return <Abs x={x} y={y} style={{ opacity: clamp01((f - at) / 8) * (1 - o), transform: `translate(-50%, -50%) scale(${(0.6 + 0.4 * s) * (1 - 0.08 * o)})`, filter: o > 0 ? `blur(${o * 8}px)` : undefined }}><Pill tone={tone} size={size} style={style}>{children}</Pill></Abs>;
};

/** a glass panel with a coloured outline: slides up 60 px and fades in over 22 frames (settle), the content lags 4 frames */
export const Panel: React.FC<{ x: number; y: number; w: number; h: number; at: number; out?: number; tone?: "trust" | "danger" | "plain"; r?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, at, out, tone = "trust", r = 32, style, children }) => {
  const f = useFrame();
  const p = settle(clamp01((f - at) / 26)), o = out === undefined ? 0 : glide(clamp01((f - out) / 12));
  if (p <= 0 || o >= 1) return null;
  const col = tone === "trust" ? C.trust : tone === "danger" ? C.alarm : C.glassStroke;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2 + (1 - p) * 70, width: w, height: h, opacity: p * (1 - o), borderRadius: r, background: "rgba(255,255,255,0.06)", border: `2px solid ${col}`, boxShadow: tone === "plain" ? undefined : `0 0 40px ${tone === "trust" ? "rgba(52,199,89,0.18)" : "rgba(255,59,48,0.18)"}, inset 0 1px 0 rgba(255,255,255,0.08)`, backdropFilter: "blur(24px)", boxSizing: "border-box", filter: o > 0 ? `blur(${o * 8}px)` : undefined, ...style }}>{children}</div>
  );
};
export const T: React.FC<{ size: number; weight?: 500 | 700; color?: string; mono?: boolean; display?: boolean; serif?: boolean; style?: React.CSSProperties; children: React.ReactNode }> = ({ size, weight = 700, color = C.text, mono, display, serif, style, children }) => (
  <div style={{ fontFamily: mono ? FONT.mono : serif ? FONT.serif : display ? FONT.display : FONT.body, fontStyle: serif ? "italic" : undefined, fontWeight: serif ? 400 : mono ? 500 : weight, fontSize: size, color, lineHeight: 1.1, letterSpacing: display ? "-0.03em" : mono ? "0.04em" : undefined, whiteSpace: "nowrap", ...style }}>{children}</div>
);

/** a small person outline (head + shoulders), `s` scales it */
export const Person: React.FC<{ x: number; y: number; s?: number; at: number; frames?: number; color?: string; sway?: number }> = ({ x, y, s = 1, at, frames = 26, color = C.text, sway = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${sway})`}>
    <Stroke d={circle(0, -34 * s, 15 * s)} at={at} frames={frames} color={color} />
    <Stroke d={arc(0, 44 * s, 46 * s, 212, 328)} at={at + 4} frames={frames} color={color} />
  </g>
);

/** an arrowhead at (x, y) pointing along `deg` */
export const Arrowhead: React.FC<{ x: number; y: number; deg: number; at: number; color?: string; size?: number }> = ({ x, y, deg, at, color = C.text, size = 22 }) => (
  <g transform={`translate(${x} ${y}) rotate(${deg})`}><Stroke d={poly([[-size, -size * 0.6], [0, 0], [-size, size * 0.6]])} at={at} frames={8} color={color} /></g>
);

/** a lock: body + shackle; `closed` 0..1 moves the shackle down onto the body */
export const Lock: React.FC<{ x: number; y: number; s?: number; at: number; closed: number; color?: string }> = ({ x, y, s = 1, at, closed, color = C.trust }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Stroke d={rrect(-46, -10, 92, 76, 14)} at={at} frames={30} color={color} />
    <Stroke d={`M-26 -10V-34A26 26 0 0 1 26 -34V${-10 - (1 - closed) * 0}`} at={at + 4} frames={30} color={color} transform={`translate(0 ${-(1 - closed) * 18})`} />
    <Stroke d={line(0, 20, 0, 40)} at={at + 14} frames={12} color={color} />
  </g>
);

export const CheckMark: React.FC<{ x: number; y: number; s?: number; at: number; color?: string; frames?: number }> = ({ x, y, s = 40, at, color = C.trust, frames = 18 }) => <Stroke d={check(x, y, s)} at={at} frames={frames} color={color} />;
export { smooth, lerp, swing, glide, settle, Local, Stroke };

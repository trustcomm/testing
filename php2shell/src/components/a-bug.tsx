// The bug glyph of S3 / S4: a small red line-art insect (head, body, midline, six legs that scuttle, two antennae), single-weight 3 px strokes.
import React from "react";
import { C } from "../theme";
import { clamp01, easeOutCubic, lerp } from "../motion";

const ELLIPSE = "M-14 5A14 21 0 1 1 14 5A14 21 0 1 1 -14 5";
const HEAD = "M-7 -26A7 7 0 1 1 7 -26A7 7 0 1 1 -7 -26";
/** the glyph's paths in its own coordinates (head up, -y), legs swung by `phase` (radians) with amplitude `amp`, antennae swayed by `sway` (px) */
export const bugPaths = (phase: number, amp: number, sway: number): { d: string; fill?: boolean }[] => {
  const out: { d: string; fill?: boolean }[] = [{ d: ELLIPSE, fill: true }, { d: HEAD, fill: true }, { d: "M0 -16L0 26" }];
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const rx = s * 14, ry = -8 + 13 * i, a = Math.sin(phase + i * 2.1 + (s > 0 ? Math.PI : 0)) * amp, ca = Math.cos(a), sa = Math.sin(a);
      const rot = (vx: number, vy: number) => [rx + vx * ca - vy * sa, ry + vx * sa + vy * ca];
      const k = rot(s * 20, (i - 1) * 7 - 2), f = rot(s * 31, (i - 1) * 14 + 10);
      out.push({ d: `M${rx} ${ry}L${k[0].toFixed(2)} ${k[1].toFixed(2)}L${f[0].toFixed(2)} ${f[1].toFixed(2)}` });
    }
    out.push({ d: `M${s * 3} -35Q${s * 10} -46 ${s * 16 + sway * s} -58` });
  }
  return out;
};

export interface BugDef { p0: [number, number]; pc: [number, number]; p1: [number, number]; t0: number; t1: number; seed: number }
export interface BugState { x: number; y: number; angle: number; scale: number; alpha: number; phase: number; amp: number; sway: number; moving: boolean; arrived: boolean }
/** where the bug is at a frame: it crawls a quadratic path out of the panel's corner (stop-and-go scuttle), then idles with small twitches; `freeze` stops time (caught) */
export const bugState = (b: BugDef, f: number, freeze = Infinity): BugState => {
  const tt = Math.min(f, freeze), t = clamp01((tt - b.t0) / (b.t1 - b.t0));
  const u = 1 - (1 - t) ** 2.2 + 0.012 * Math.sin(t * 38) * (1 - t);
  const q = 1 - u;
  const x = q * q * b.p0[0] + 2 * q * u * b.pc[0] + u * u * b.p1[0], y = q * q * b.p0[1] + 2 * q * u * b.pc[1] + u * u * b.p1[1];
  const dx = 2 * q * (b.pc[0] - b.p0[0]) + 2 * u * (b.p1[0] - b.pc[0]), dy = 2 * q * (b.pc[1] - b.p0[1]) + 2 * u * (b.p1[1] - b.pc[1]);
  const moving = t > 0 && t < 1, arrived = t >= 1;
  const twitch = arrived ? Math.max(0, Math.sin(tt * 0.19 + b.seed * 5)) ** 6 : 0;
  const phase = moving ? (tt - b.t0) * 1.5 : arrived ? 4 + tt * 0.8 : 0;
  const amp = moving ? 0.42 : 0.03 + 0.16 * twitch;
  const sway = (moving ? 4 : 1.4) * Math.sin(tt * (moving ? 0.9 : 0.35) + b.seed * 7);
  const wob = moving ? 5 * Math.sin(tt * 1.1 + b.seed) * (1 - t) : 1.6 * Math.sin(tt * 0.23 + b.seed * 3) * twitch;
  const born = clamp01((f - b.t0) / 4);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI + 90 + wob, scale: 0.92 * lerp(0.5, 1, easeOutCubic((f - b.t0) / 8)), alpha: born, phase, amp, sway, moving, arrived };
};

export const Bug: React.FC<{ s: BugState; color?: string; glow?: boolean }> = ({ s, color = C.alarm, glow = true }) => {
  if (s.alpha <= 0) return null;
  return (
    <g transform={`translate(${s.x.toFixed(2)} ${s.y.toFixed(2)}) rotate(${s.angle.toFixed(2)}) scale(${s.scale.toFixed(3)})`} opacity={s.alpha} style={{ filter: glow ? "drop-shadow(0 0 5px rgba(255,59,48,0.55))" : undefined }}>
      {bugPaths(s.phase, s.amp, s.sway).map((p, i) => <path key={i} d={p.d} fill={p.fill ? "rgba(255,59,48,0.2)" : "none"} stroke={color} strokeWidth={3 / s.scale} strokeLinecap="round" strokeLinejoin="round" />)}
    </g>
  );
};

import React from "react";
import { spring } from "remotion";
import { FPS, SPRING } from "./theme";
import { useFrame } from "./clock";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
export const easeOutCubic = (x: number) => 1 - (1 - clamp01(x)) ** 3;
export const easeInCubic = (x: number) => clamp01(x) ** 3;
export const easeInOutCubic = (x: number) => { const u = clamp01(x); return u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2; };
export const smooth = (a: number, b: number, x: number) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
/** progress 0..1 of something that starts at frame `at` and lasts `frames` (linear) */
export const prog = (frame: number, at: number, frames: number) => clamp01((frame - at) / frames);
/** seeded hash noise in 0..1: the same (i, k) always gives the same number, so every render is identical */
export const rand = (i: number, k = 0) => { let h = (Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(k + 7, 0x85ebca6b)) >>> 0; h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0; h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0; return ((h ^ (h >>> 15)) >>> 0) / 4294967296; };

/** The chip spring (stiffness 160, damping 18: overshoot <= ~4 %), 0 -> 1, starting on frame `at`. */
export const springAt = (frame: number, at: number, extra = 0): number => { const l = frame - at - extra; return l < 0 ? 0 : spring({ frame: l, fps: FPS, config: SPRING }); };
export function useSpring(at: number, extra = 0): number { return springAt(useFrame(), at, extra); }

/**
 * The text entrance: rises 20 px, from an 8 px blur to sharp, fading in, over `frames` (default 12), starting on frame `at`.
 * `out` (frame): the reverse over 9 frames ("blur + fade 0.3 s").
 */
export const Rise: React.FC<{ at: number; frames?: number; dy?: number; blur?: number; out?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ at, frames = 12, dy = 20, blur = 8, out, style, children }) => {
  const f = useFrame();
  const p = easeOutCubic((f - at) / frames);
  if (p <= 0) return null;
  const o = out === undefined ? 0 : clamp01((f - out) / 9);
  if (o >= 1) return null;
  const k = p * (1 - o);
  return <div style={{ opacity: k, transform: `translateY(${(1 - p) * dy - o * 6}px)`, filter: p < 1 || o > 0 ? `blur(${(1 - p) * blur + o * 8}px)` : undefined, ...style }}>{children}</div>;
};

/** A chip: springs in from 0.6 scale (stiffness 160, damping 18) on frame `at`. */
export const Pop: React.FC<{ at: number; from?: number; out?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ at, from = 0.6, out, style, children }) => {
  const f = useFrame();
  const s = springAt(f, at);
  if (s <= 0) return null;
  const o = out === undefined ? 0 : clamp01((f - out) / 9);
  if (o >= 1) return null;
  return <div style={{ opacity: clamp01(s * 1.6) * (1 - o), transform: `scale(${from + (1 - from) * s})`, filter: o > 0 ? `blur(${o * 8}px)` : undefined, ...style }}>{children}</div>;
};

/** Absolutely positions its children centred on (x, y) in canvas pixels. */
export const At: React.FC<{ x: number; y: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, style, children }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", ...style }}>{children}</div>
);

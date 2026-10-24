import React from "react";
import { FPS } from "./theme";
import { useFrame } from "./clock";
import { glide, settle, springT, launch, swing } from "./easing";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
export const smooth = (a: number, b: number, x: number) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
/** progress 0..1 of something that starts at frame `at` and lasts `frames` (linear) */
export const prog = (frame: number, at: number, frames: number) => clamp01((frame - at) / frames);
/** seeded hash noise in 0..1: the same (i, k) always gives the same number, so every render is identical */
export const rand = (i: number, k = 0) => { let h = (Math.imul(Math.floor(i) + 1, 0x9e3779b1) ^ Math.imul(k + 7, 0x85ebca6b)) >>> 0; h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0; h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0; return ((h ^ (h >>> 15)) >>> 0) / 4294967296; };
/** smooth 1-D value noise in -1..1 (cubic interpolation between seeded lattice values); `x` in lattice units */
export const noise1 = (x: number, seed = 0) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return (rand(i, seed) * (1 - u) + rand(i + 1, seed) * u) * 2 - 1; };

/** an easing applied to progress `at .. at+frames` */
export const ramp = (f: number, at: number, frames: number, e: (x: number) => number = glide) => e(clamp01((f - at) / frames));
export const arrive = (f: number, at: number, frames: number) => settle(clamp01((f - at) / frames));
export const depart = (f: number, at: number, frames: number) => launch(clamp01((f - at) / frames));
export const swingP = (f: number, at: number, frames: number) => swing(clamp01((f - at) / frames));

/** The physical spring (stiffness 150, damping 20, mass 1: overshoot about 1 %), 0 -> 1, starting on frame `at`. Exact at sub-frame times. */
export const springAt = (frame: number, at: number, k = 150, c = 20, m = 1): number => springT((frame - at) / FPS, k, c, m);
export function useSpring(at: number, k = 150, c = 20): number { return springAt(useFrame(), at, k, c); }

/**
 * The text entrance: rises 20 px, from an 8 px blur to sharp, fading in, over `frames` (default 16 = 0.27 s), starting on frame `at`.
 * `out` (frame): the reverse over 10 frames. Never appears or disappears in a single frame.
 */
export const Rise: React.FC<{ at: number; frames?: number; dy?: number; blur?: number; out?: number; outFrames?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ at, frames = 16, dy = 20, blur = 8, out, outFrames = 10, style, children }) => {
  const f = useFrame();
  const p = settle(clamp01((f - at) / frames));
  if (p <= 0) return null;
  const o = out === undefined ? 0 : glide(clamp01((f - out) / outFrames));
  if (o >= 1) return null;
  const k = p * (1 - o);
  return <div style={{ opacity: k, transform: `translateY(${(1 - p) * dy - o * 8}px)`, filter: p < 1 || o > 0 ? `blur(${(1 - p) * blur + o * 8}px)` : undefined, ...style }}>{children}</div>;
};

/** A chip: springs in from 0.6 scale (stiffness 150, damping 20) on frame `at`; fades in over the first 8 frames. `out`: scale down + fade over 10 frames. */
export const Pop: React.FC<{ at: number; from?: number; out?: number; origin?: string; style?: React.CSSProperties; children?: React.ReactNode }> = ({ at, from = 0.6, out, origin, style, children }) => {
  const f = useFrame();
  const s = springAt(f, at);
  if (f < at) return null;
  const o = out === undefined ? 0 : glide(clamp01((f - out) / 10));
  if (o >= 1) return null;
  return <div style={{ opacity: clamp01((f - at) / 8) * (1 - o), transform: `scale(${(from + (1 - from) * s) * (1 - o * 0.1)})`, transformOrigin: origin, filter: o > 0 ? `blur(${o * 8}px)` : undefined, ...style }}>{children}</div>;
};

/** Absolutely positions its children centred on (x, y). */
export const At: React.FC<{ x: number; y: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, style, children }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", ...style }}>{children}</div>
);
/** overlapping action: child i of a group starts `step` frames after child i-1 (2-4 frames), secondary parts lag by 3-6 */
export const stag = (base: number, i: number, step = 3) => base + i * step;

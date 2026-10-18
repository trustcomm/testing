import React from "react";
import { spring } from "remotion";
import { BLUR_IN, FPS, RISE, SPRING, STAGGER } from "./theme";
import { useFrame } from "./clock";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
export const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;
export const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
export const smooth = (a: number, b: number, x: number) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
export const rand = (i: number, k = 0) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };

/** The Apple spring (stiffness 170, damping 22), 0 -> 1, starting at `atSeconds`. */
export function useSpring(atSeconds: number, extraFrames = 0): number {
  const frame = useFrame();
  const local = frame - Math.round(atSeconds * FPS) - extraFrames;
  return local < 0 ? 0 : Math.min(1.02, spring({ frame: local, fps: FPS, config: SPRING }));
}
/** Same, from a plain frame number (for lists computed in a loop). */
export const springAt = (frame: number, startFrame: number) => (frame < startFrame ? 0 : Math.min(1.02, spring({ frame: frame - startFrame, fps: FPS, config: SPRING })));

/**
 * The entrance every element uses: it rises 24 px, from an 8 px blur to sharp, and fades in, on the Apple spring, starting
 * on `at` (seconds, a cue) plus `i` x 4 frames of stagger. Optional exit (`until`, seconds): the reverse over `exit` frames.
 */
export const Enter: React.FC<{ at: number; i?: number; dy?: number; blur?: number; until?: number; exit?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ at, i = 0, dy = RISE, blur = BLUR_IN, until, exit = 8, style, children }) => {
  const frame = useFrame();
  const p = useSpring(at, i * STAGGER);
  if (p <= 0) return null;
  let out = 0;
  if (until !== undefined) { const f1 = Math.round(until * FPS); out = clamp01((frame - f1) / exit); if (out >= 1) return null; }
  const k = clamp01(p), settled = k > 0.995 && out === 0;
  // once settled there is no filter and no opacity at all: an ancestor with either is a "backdrop root", which would stop the glass inside from blurring what is behind it
  return <div style={{ opacity: settled ? undefined : clamp01(k * 1.25) * (1 - out), transform: settled ? undefined : `translateY(${(1 - k) * dy - out * 10}px)`, filter: settled ? undefined : `blur(${(1 - k) * blur + out * 8}px)`, ...style }}>{children}</div>;
};

/** Absolutely positions its children centred on (x, y). */
export const At: React.FC<{ x: number; y: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, style, children }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", ...style }}>{children}</div>
);

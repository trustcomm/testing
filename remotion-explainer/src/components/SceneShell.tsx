import React, { createContext, useContext } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C, H, PUSH, W, WIPE_FRAMES, WIPE_LEAD } from "../theme";
import { clamp01, inOutCubic } from "./motion";
import { Background } from "./Background";

/** 'full' renders everything; 'bg' only the backgrounds (the verify script diffs the two to find where content sits). */
export const ModeContext = createContext<"full" | "bg">("full");

// A masked wipe per scene, never a hard cut. p goes 0 -> 1 over the wipe.
type Wipe = "circle" | "left" | "up" | "right" | "down" | "circleTop";
const WIPES: Wipe[] = ["circle", "left", "up", "right", "circleTop", "down", "circle"];
function maskOf(kind: Wipe, p: number): string {
  const slant = 260;
  switch (kind) {
    case "circle": return `circle(${p * 1700}px at 540px 960px)`;
    case "circleTop": return `circle(${p * 1900}px at 540px 420px)`;
    case "left": { const x = p * (W + slant); return `polygon(0 0, ${x}px 0, ${x - slant}px ${H}px, 0 ${H}px)`; }
    case "right": { const x = W - p * (W + slant); return `polygon(${W}px 0, ${x}px 0, ${x + slant}px ${H}px, ${W}px ${H}px)`; }
    case "up": return `inset(${(1 - p) * 100}% 0 0 0)`;
    case "down": return `inset(0 0 ${(1 - p) * 100}% 0)`;
  }
}

/**
 * One scene. It mounts 4 frames before its start (its first word), wipes in over the previous scene (a violet edge leads
 * the wipe) and is fully in 4 frames after the word; it unmounts when the next scene has finished wiping over it. While it is up the camera pushes in by 4 %.
 */
export const SceneShell: React.FC<{ index: number; start: number; end: number; glow: { x: number; y: number; color?: string }; children: React.ReactNode }> = ({ index, start, end, glow, children }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const mode = useContext(ModeContext);
  const last = index === 6;
  const f0 = Math.round(start * fps) - (index === 0 ? 0 : WIPE_LEAD), f1 = Math.round(end * fps) + (last ? 0 : WIPE_FRAMES - WIPE_LEAD);
  if (frame < f0 || (!last && frame >= f1)) return null;
  const p = index === 0 ? 1 : inOutCubic(clamp01((frame - f0) / WIPE_FRAMES));
  const lead = index === 0 ? 1 : clamp01(p * 1.22);
  const kind = WIPES[index % WIPES.length];
  const push = 1 + PUSH * clamp01((frame - Math.round(start * fps)) / Math.max(1, Math.round(end * fps) - Math.round(start * fps)));
  const wiping = p < 1;
  return (
    <AbsoluteFill>
      {wiping && <AbsoluteFill style={{ background: C.accent, clipPath: maskOf(kind, lead) }} />}
      <AbsoluteFill style={{ clipPath: wiping ? maskOf(kind, p) : undefined }}>
        <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 50%" }}>
          <Background glowX={glow.x} glowY={glow.y} glowColor={glow.color} />
          {mode === "full" && children}
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

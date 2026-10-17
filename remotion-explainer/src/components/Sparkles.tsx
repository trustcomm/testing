import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";
import { Spark } from "./icons";
import { clamp01, outCubic, rand } from "./motion";

/** A burst of four-point sparkles from (x, y) starting on `at`: radius, size and fade are closed-form in time, so it seeks cleanly. */
export const Sparkles: React.FC<{ at: number; x: number; y: number; count?: number; seconds?: number }> = ({ at, x, y, count = 16, seconds = 0.75 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = (frame - Math.round(at * fps)) / (seconds * fps);
  if (p < 0 || p > 1) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const ang = (i / count) * Math.PI * 2 + rand(i) * 0.5, dist = (190 + rand(i, 1) * 170) * outCubic(p), size = 26 + rand(i, 2) * 38;
        const a = clamp01(p * 6) * (1 - clamp01((p - 0.55) / 0.45));
        return (
          <div key={i} style={{ position: "absolute", left: x + Math.cos(ang) * dist, top: y + Math.sin(ang) * dist * 0.5, opacity: a, transform: `translate(-50%, -50%) rotate(${p * 160 * (i % 2 ? 1 : -1)}deg) scale(${0.4 + 0.9 * outCubic(clamp01(p * 3))})` }}>
            <Spark size={size} color={[C.accent, "#fff", C.ok][i % 3]} />
          </div>
        );
      })}
    </>
  );
};

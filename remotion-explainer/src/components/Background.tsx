import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { useT } from "./motion";

/** #0B0B10, a faint 60 px grid, and a soft radial glow behind the hero object (it breathes slowly). */
export const Background: React.FC<{ glowX?: number; glowY?: number; glowColor?: string; glowSize?: number }> = ({ glowX = 540, glowY = 900, glowColor = C.accent, glowSize = 1100 }) => {
  const t = useT();
  const breathe = 1 + 0.05 * Math.sin(t * 1.6);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div style={{ position: "absolute", left: glowX - (glowSize * breathe) / 2, top: glowY - (glowSize * breathe) / 2, width: glowSize * breathe, height: glowSize * breathe, borderRadius: "50%", background: `radial-gradient(circle, ${glowColor}59 0%, ${glowColor}22 38%, transparent 68%)` }} />
    </AbsoluteFill>
  );
};

import React from "react";
import { FONT, FPS } from "../theme";
import { CUE } from "../cues";
import { At, clamp01, easeOutCubic } from "../motion";
import { useT } from "../clock";

const TEXT = "One more thing.";

/** 4. Pure black, "One more thing." fading in letter by letter across the three words, then held still. */
export const OneMore: React.FC = () => {
  const t = useT(), a = CUE.s4.one, b = CUE.s4.thing - 0.12;
  const chars = TEXT.split("");
  return (
    <At x={540} y={770}>
      <div style={{ display: "flex", fontFamily: FONT.ui, fontWeight: 600, fontSize: 96, letterSpacing: "-0.02em", color: "#fff", whiteSpace: "pre" }}>
        {chars.map((ch, i) => {
          const start = a + (i / (chars.length - 1)) * (b - a), p = easeOutCubic(clamp01((t - start) / 0.28));
          return <span key={i} style={{ opacity: p, filter: p < 0.99 ? `blur(${(1 - p) * 8}px)` : undefined }}>{ch}</span>;
        })}
      </div>
    </At>
  );
};

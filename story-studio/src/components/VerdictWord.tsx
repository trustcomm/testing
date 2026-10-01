import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { progress } from "../brand/motion";
import { useTheme } from "../brand/theme";
import { distance, fonts, type, weights } from "../brand/tokens";

export type VerdictWordProps = {
  /** One word. */
  text: string;
  /** Override colour; defaults to the theme foreground. */
  color?: string;
  /** Font size in px. */
  size?: number;
};

/** One huge word, centred. Fast fade + 8px rise and nothing else — stillness is the drama. */
export const VerdictWord: React.FC<VerdictWordProps> = ({ text, color, size = type.verdict }) => {
  const frame = useCurrentFrame();
  const { fg } = useTheme();
  const p = progress(frame, 0, "fast");
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: fonts.display,
          fontWeight: weights.heavy,
          fontSize: size,
          letterSpacing: "0.02em",
          lineHeight: 1,
          color: color ?? fg,
          opacity: p,
          transform: `translateY(${(1 - p) * distance.rise}px)`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

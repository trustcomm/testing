import React from "react";
import { useCurrentFrame } from "remotion";
import { progress } from "../brand/motion";
import { useTheme } from "../brand/theme";
import { distance, fonts, type, weights } from "../brand/tokens";

export type LabelProps = {
  /** Short supporting text. */
  text: string;
  /** Override colour (e.g. colors.stone once the fact is no longer current). */
  color?: string;
  /** Font size in px. Default type.label. */
  size?: number;
};

/** Small supporting label. Fades up a short distance over the standard duration. */
export const Label: React.FC<LabelProps> = ({ text, color, size = type.label }) => {
  const frame = useCurrentFrame();
  const { fg } = useTheme();
  const p = progress(frame, 0, "standard");
  return (
    <div
      style={{
        fontFamily: fonts.display,
        fontWeight: weights.regular,
        fontSize: size,
        color: color ?? fg,
        opacity: p,
        transform: `translateY(${(1 - p) * distance.rise}px)`,
      }}
    >
      {text}
    </div>
  );
};

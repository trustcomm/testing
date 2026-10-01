import React from "react";
import { useCurrentFrame } from "remotion";
import { progress } from "../brand/motion";
import { useTheme } from "../brand/theme";
import { direction, distance, fonts, type, weights } from "../brand/tokens";

export type WordmarkProps = {
  /** Company name set as type (never a logo), e.g. "BYJU'S". */
  text: string;
  /** "past" enters from the left, "future" from the right. Default "past". */
  tense?: "past" | "future";
  /** Font size in px. */
  size?: number;
  /** Override colour; defaults to theme foreground. */
  color?: string;
};

/** A company wordmark in Anek heavy. Used instead of logos. */
export const Wordmark: React.FC<WordmarkProps> = ({ text, tense = "past", size = type.wordmark, color }) => {
  const frame = useCurrentFrame();
  const { fg } = useTheme();
  const p = progress(frame, 0, "standard");
  return (
    <div
      style={{
        fontFamily: fonts.display,
        fontWeight: weights.heavy,
        fontSize: size,
        lineHeight: 0.9,
        letterSpacing: "-0.01em",
        color: color ?? fg,
        opacity: p,
        transform: `translateX(${(1 - p) * direction[tense] * distance.standard}px)`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

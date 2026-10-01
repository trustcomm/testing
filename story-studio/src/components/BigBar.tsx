import React from "react";
import { useTheme } from "../brand/theme";
import { stroke } from "../brand/tokens";

export type BigBarProps = {
  /** Current value. Animate it from the parent with `tween()` to grow (up) or collapse (down). */
  value: number;
  /** Value that fills `maxHeight`. */
  maxValue: number;
  /** Bar colour by data role: fg/ink = neutral, green = growth, crimson = loss, stone = inactive. */
  color?: string;
  /** Bar width in px. */
  width?: number;
  /** Height in px at `maxValue`. */
  maxHeight?: number;
};

/** A single vertical bar standing on an ink baseline. Grows upward, collapses downward. */
export const BigBar: React.FC<BigBarProps> = ({ value, maxValue, color, width = 220, maxHeight = 560 }) => {
  const { fg } = useTheme();
  const h = Math.max(0, Math.min(1, value / maxValue)) * maxHeight;
  return (
    <div style={{ position: "relative", width: width + 80, height: maxHeight }}>
      <div style={{ position: "absolute", left: 40, bottom: 0, width, height: h, backgroundColor: color ?? fg }} />
      <div style={{ position: "absolute", left: 0, bottom: -stroke.line, width: width + 80, height: stroke.line, backgroundColor: fg }} />
    </div>
  );
};

import React from "react";
import { useCurrentFrame } from "remotion";
import { tween } from "../brand/motion";
import { useTheme } from "../brand/theme";
import { fonts, tabularNums, type, weights, type DurationKey } from "../brand/tokens";

export type NumberCounterProps = {
  /** Start value of the count. */
  from: number;
  /** End value of the count. */
  to: number;
  /** Text before the number, e.g. "$". */
  prefix?: string;
  /** Text after the number, e.g. "B". */
  suffix?: string;
  /** Number colour (role: ink/fg by default, green = growth, crimson = loss). */
  color?: string;
  /**
   * Optional final label that replaces the number once the count lands,
   * e.g. "~$0" when a valuation collapses to roughly nothing.
   */
  value?: string;
  /** Local frame the count starts on (inside its <Sequence>). */
  startFrame?: number;
  /** Token duration of the count. Default "slow". */
  duration?: DurationKey;
  /** Decimal places while counting. */
  decimals?: number;
  /** Font size in px. Default type.number. */
  size?: number;
};

/** A big tabular number that counts between two values with the brand ease. */
export const NumberCounter: React.FC<NumberCounterProps> = ({
  from,
  to,
  prefix = "",
  suffix = "",
  color,
  value,
  startFrame = 0,
  duration = "slow",
  decimals = 0,
  size = type.number,
}) => {
  const frame = useCurrentFrame();
  const { fg } = useTheme();
  const n = tween(frame, startFrame, from, to, duration);
  const landed = n === to;
  const text = landed && value ? value : `${prefix}${n.toFixed(decimals)}${suffix}`;
  return (
    <div
      style={{
        fontFamily: fonts.numeric,
        fontWeight: weights.heavy,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        color: color ?? fg,
        whiteSpace: "nowrap",
        ...tabularNums,
      }}
    >
      {text}
    </div>
  );
};

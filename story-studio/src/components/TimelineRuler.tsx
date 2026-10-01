import React from "react";
import { useCurrentFrame } from "remotion";
import { progress } from "../brand/motion";
import { useTheme } from "../brand/theme";
import { colors, fonts, span, stroke, tabularNums, type, weights } from "../brand/tokens";

export type TimelineRulerProps = {
  /** Years shown as ticks, left (past) to right (future). */
  years: number[];
  /** Highlighted year (saffron tick + label). */
  activeYear: number;
  /** Ruler width in px. Default: full 12-column content width. */
  width?: number;
};

/** A thin line with year ticks. Lines use the theme foreground; the active year is the brand highlight. */
export const TimelineRuler: React.FC<TimelineRulerProps> = ({ years, activeYear, width = span(12) }) => {
  const frame = useCurrentFrame();
  const { fg } = useTheme();
  const p = progress(frame, 0, "standard");
  const step = years.length > 1 ? width / (years.length - 1) : 0;
  return (
    <div style={{ position: "relative", width, height: 104, opacity: p }}>
      <div style={{ position: "absolute", left: 0, top: 30, width: width * p, height: stroke.hairline, backgroundColor: fg }} />
      {years.map((y, i) => {
        const active = y === activeYear;
        const x = i * step;
        return (
          <React.Fragment key={y}>
            <div
              style={{
                position: "absolute",
                left: x - (active ? 3 : 1),
                top: active ? 12 : 22,
                width: active ? 6 : stroke.hairline,
                height: active ? 38 : 18,
                backgroundColor: active ? colors.saffron : fg,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x - 70,
                width: 140,
                top: 56,
                textAlign: "center",
                fontFamily: fonts.numeric,
                fontWeight: active ? weights.heavy : weights.regular,
                fontSize: type.year,
                color: active ? colors.saffron : fg,
                ...tabularNums,
              }}
            >
              {y}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

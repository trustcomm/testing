import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { progress } from "../brand/motion";
import { useTheme } from "../brand/theme";
import { colors, distance, fonts, span, stroke, tabularNums, type, weights } from "../brand/tokens";
import { GeoIcon, type IconName } from "./GeoIcon";

export type ReasonCardProps = {
  /** Card number shown top-left (1, 2, 3…). */
  index: number;
  /** One short reason. */
  title: string;
  /** Flat geometric icon. */
  icon: IconName;
  /** Optional text drawn on the icon (e.g. "$1.2B" on the weight). */
  iconText?: string;
  /** "drop" makes the icon fall into place (decline/burden); default "fade". */
  iconEntrance?: "fade" | "drop";
  /** 0 = active (foreground), 1 = dimmed to stone. Animate with tween() when the next reason is spoken. */
  dim?: number;
  /** Card width in px. Default 4 grid columns. */
  width?: number;
};

/**
 * A numbered reason card. Enters from the left (reasons are the past) over a
 * standard duration; the first frame of its <Sequence> is its entrance.
 */
export const ReasonCard: React.FC<ReasonCardProps> = ({
  index,
  title,
  icon,
  iconText,
  iconEntrance = "fade",
  dim = 0,
  width = span(4),
}) => {
  const frame = useCurrentFrame();
  const { fg, bg } = useTheme();
  const p = progress(frame, 0, "standard");
  const ip = iconEntrance === "drop" ? progress(frame, 3, "standard") : p;
  const c = interpolateColors(dim, [0, 1], [fg, colors.stone]);
  return (
    <div
      style={{
        width,
        height: 440,
        boxSizing: "border-box",
        border: `${stroke.card}px solid ${c}`,
        padding: 44,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        opacity: p,
        transform: `translateX(${(1 - p) * -distance.standard}px)`,
        color: c,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontFamily: fonts.numeric, fontWeight: weights.heavy, fontSize: 72, lineHeight: 1, ...tabularNums }}>
          {index}
        </div>
        <div
          style={{
            opacity: ip,
            transform: iconEntrance === "drop" ? `translateY(${(1 - ip) * -60}px)` : undefined,
          }}
        >
          <GeoIcon name={icon} color={c} size={130} text={iconText} textColor={bg} />
        </div>
      </div>
      <div style={{ fontFamily: fonts.display, fontWeight: weights.bold, fontSize: type.title - 6, lineHeight: 1.08 }}>
        {title}
      </div>
    </div>
  );
};

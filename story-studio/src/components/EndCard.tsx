import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { progress } from "../brand/motion";
import { useTheme } from "../brand/theme";
import { colors, distance, durations, fonts, type, weights } from "../brand/tokens";

export type EndCardProps = {
  /** The closing line (Hinglish/Hindi supported). */
  line: string;
  /** Channel name, set in saffron. */
  channelName: string;
};

/** Closing card: the line, a short saffron rule, then the channel name. */
export const EndCard: React.FC<EndCardProps> = ({ line, channelName }) => {
  const frame = useCurrentFrame();
  const { fg } = useTheme();
  const a = progress(frame, 0, "standard");
  const b = progress(frame, durations.fast, "standard");
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div
        style={{
          fontFamily: fonts.display,
          fontWeight: weights.bold,
          fontSize: type.title + 8,
          color: fg,
          opacity: a,
          transform: `translateY(${(1 - a) * distance.standard}px)`,
        }}
      >
        {line}
      </div>
      <div style={{ width: 120 * b, height: 6, backgroundColor: colors.saffron }} />
      <div
        style={{
          fontFamily: fonts.display,
          fontWeight: weights.heavy,
          fontSize: type.title,
          letterSpacing: "0.04em",
          color: colors.saffron,
          opacity: b,
          transform: `translateY(${(1 - b) * distance.standard}px)`,
        }}
      >
        {channelName}
      </div>
    </AbsoluteFill>
  );
};

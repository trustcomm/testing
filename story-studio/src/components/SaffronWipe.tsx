import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { progress } from "../brand/motion";
import { colors, durations } from "../brand/tokens";

/** Total length of the wipe (cover + reveal). Put it in a <Sequence durationInFrames={WIPE_FRAMES}>. */
export const WIPE_FRAMES = durations.standard * 2;
/** Local frame at which the frame is fully covered — flip themes / swap scenes here. */
export const WIPE_COVERED = durations.standard;

/**
 * The signature act transition: a solid saffron bar crosses the full frame
 * left→right (standard duration in), then exits to the right (standard duration out).
 */
export const SaffronWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const cover = progress(frame, 0, "standard");
  const reveal = progress(frame, WIPE_COVERED, "standard");
  const left = frame < WIPE_COVERED ? 0 : reveal * 100;
  const right = frame < WIPE_COVERED ? (1 - cover) * 100 : 0;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${left}%`,
          right: `${right}%`,
          backgroundColor: colors.saffron,
        }}
      />
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import "../brand/fonts";
import { progress } from "../brand/motion";
import { colors, durations, SCENE_FADE_S, themes, type ThemeMode } from "../brand/tokens";

/**
 * Wraps every scene: theme background, 0.2 s fade from/to the background at both ends
 * (so hard concat joins are invisible), and the optional saffron wipe-in for act changes.
 * The wipe starts on the PREVIOUS scene's background, covers (15 f), then reveals (15 f).
 */
export const SceneFrame: React.FC<{
  theme: ThemeMode;
  prevTheme: ThemeMode;
  wipeIn: boolean;
  children?: React.ReactNode;
}> = ({ theme, prevTheme, wipeIn, children }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeF = Math.round(SCENE_FADE_S * fps);
  const bg = themes[theme].bg;

  const fadeInOpacity = wipeIn ? 0 : interpolate(frame, [0, fadeF], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOutOpacity = interpolate(frame, [durationInFrames - fadeF, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cover = progress(frame, 0, "standard");
  const reveal = progress(frame, durations.standard, "standard");
  const covered = frame < durations.standard;

  return (
    <AbsoluteFill style={{ backgroundColor: bg, color: themes[theme].fg }}>
      {children}
      <AbsoluteFill style={{ backgroundColor: bg, opacity: Math.max(fadeInOpacity, fadeOutOpacity) }} />
      {wipeIn && frame < durations.standard * 2 ? (
        <AbsoluteFill>
          {covered ? <AbsoluteFill style={{ backgroundColor: themes[prevTheme].bg }} /> : null}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: covered ? 0 : `${reveal * 100}%`,
              right: covered ? `${(1 - cover) * 100}%` : 0,
              backgroundColor: colors.saffron,
            }}
          />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

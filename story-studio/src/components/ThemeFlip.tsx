import React from "react";
import { AbsoluteFill } from "remotion";
import { ThemeProvider } from "../brand/theme";
import { themes, type ThemeMode } from "../brand/tokens";

export type ThemeFlipProps = {
  /** "paper" = paper background + ink text; "ink" = ink background + paper text. */
  mode: ThemeMode;
  children?: React.ReactNode;
};

/**
 * Sets the background and the foreground colour for everything inside it.
 * Swap modes under a <SaffronWipe /> so the flip itself is never seen.
 */
export const ThemeFlip: React.FC<ThemeFlipProps> = ({ mode, children }) => (
  <ThemeProvider mode={mode}>
    <AbsoluteFill style={{ backgroundColor: themes[mode].bg, color: themes[mode].fg }}>{children}</AbsoluteFill>
  </ThemeProvider>
);

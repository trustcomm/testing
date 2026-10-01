import { interpolate, interpolateColors } from "remotion";
import { durations, ease, type DurationKey } from "./tokens";

/**
 * 0 → 1 progress of an entrance that starts at `start` and lasts one of the
 * token durations. Always uses the shared ease-out curve; clamped both ends.
 */
export const progress = (frame: number, start: number, duration: DurationKey = "standard") =>
  interpolate(frame, [start, start + durations[duration]], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Tween a number between two values with the brand curve. */
export const tween = (
  frame: number,
  start: number,
  from: number,
  to: number,
  duration: DurationKey = "standard",
) => from + (to - from) * progress(frame, start, duration);

/** Tween between two brand colours with the brand curve. */
export const tweenColor = (
  frame: number,
  start: number,
  from: string,
  to: string,
  duration: DurationKey = "fast",
) => interpolateColors(progress(frame, start, duration), [0, 1], [from, to]);

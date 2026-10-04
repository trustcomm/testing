import { interpolate, interpolateColors, random } from "remotion";
import { durations, ease, type DurationKey } from "./tokens";

/** 0→1 progress of an entrance starting at `start` with a token duration and the one ease. */
export const progress = (frame: number, start: number, d: DurationKey = "standard") =>
  interpolate(frame, [start, start + durations[d]], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const tween = (frame: number, start: number, from: number, to: number, d: DurationKey = "standard") =>
  from + (to - from) * progress(frame, start, d);

export const tweenColor = (frame: number, start: number, from: string, to: string, d: DurationKey = "fast") =>
  interpolateColors(progress(frame, start, d), [0, 1], [from, to]);

/** Deterministic pseudo-random in [0,1) — the only randomness allowed. */
export const rand = (seed: string | number) => random(seed);

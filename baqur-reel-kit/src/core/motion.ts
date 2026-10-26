// ─────────────────────────────────────────────────────────────
// Motion Quality Spec v2: the only easings and springs allowed.
// ─────────────────────────────────────────────────────────────
import {Easing, interpolate, spring} from 'remotion';

export const EASE = {
  glide: Easing.bezier(0.25, 0.1, 0.25, 1), // default UI move
  settle: Easing.bezier(0.16, 1, 0.3, 1), // fast in, long soft landing (camera, entrances)
  launch: Easing.bezier(0.7, 0, 0.84, 0), // exits: slow start, fast leave
  swing: Easing.bezier(0.65, 0, 0.35, 1), // symmetric, for FLY-TO
} as const;

export const SPRING = {
  soft: {stiffness: 120, damping: 24, mass: 1}, // big panels
  snappy: {stiffness: 180, damping: 20, mass: 1}, // chips, numbers
  pop: {stiffness: 170, damping: 18, mass: 0.9}, // a little overshoot for hits
} as const;

export const MIN_ENTRANCE = 8; // frames. Nothing appears faster than this.

/** 0→1 over [from, from+dur] with an easing. Clamped. */
export const ramp = (
  frame: number,
  from: number,
  dur: number,
  ease: (t: number) => number = EASE.settle,
) =>
  interpolate(frame, [from, from + Math.max(dur, 1)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

/** Spring that starts at `from` frames. */
export const springAt = (
  frame: number,
  fps: number,
  from: number,
  cfg: keyof typeof SPRING = 'snappy',
) => spring({frame: frame - from, fps, config: SPRING[cfg]});

/**
 * Standard entrance: fade + rise + de-blur, with overlapping action
 * (opacity leads, position follows, blur clears last).
 */
export const enter = (frame: number, from: number, dur = 18, rise = 40) => {
  const d = Math.max(dur, MIN_ENTRANCE);
  const o = ramp(frame, from, d * 0.7, EASE.glide);
  const p = ramp(frame, from, d, EASE.settle);
  const b = ramp(frame, from + d * 0.15, d, EASE.settle);
  return {
    opacity: o,
    transform: `translate3d(0, ${(1 - p) * rise}px, 0)`,
    filter: `blur(${(1 - b) * 12}px)`,
  } as const;
};

/** Standard exit (launch easing): fade + slight scale down. */
export const exit = (frame: number, from: number, dur = 12) => {
  const k = ramp(frame, from, Math.max(dur, MIN_ENTRANCE), EASE.launch);
  return {opacity: 1 - k, scale: 1 - 0.04 * k, blur: k * 10};
};

/** Stagger helper for overlapping action: i-th child starts later. */
export const stagger = (i: number, gap = 4) => i * gap;

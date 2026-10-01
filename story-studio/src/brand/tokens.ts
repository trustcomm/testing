import { Easing } from "remotion";

/**
 * Brand tokens — the ONLY source of colour, type, motion and layout values.
 * Components must never hardcode a value that belongs here.
 */

/* ------------------------------------------------------------------ colour */
/** Semantic palette. Never use a colour outside its role. Max 3 accents per frame. */
export const colors = {
  /** Default background. */
  paper: "#F2EFE8",
  /** All text and lines; dark-mode background. */
  ink: "#121212",
  /** BRAND ONLY: titles, wipes, highlights. Never for data. */
  saffron: "#FF7A00",
  /** Growth / rising numbers only. */
  green: "#1F9D55",
  /** Loss / falling numbers only. */
  crimson: "#D7263D",
  /** Second entity in comparisons only. */
  cobalt: "#2B4CFF",
  /** Muted / inactive data. */
  stone: "#B8B2A7",
} as const;

export type ColorRole = keyof typeof colors;

/** Theme = which neutral is the background and which is the foreground. */
export const themes = {
  paper: { bg: colors.paper, fg: colors.ink },
  ink: { bg: colors.ink, fg: colors.paper },
} as const;

export type ThemeMode = keyof typeof themes;

/* -------------------------------------------------------------- typography */
export const fonts = {
  /** Headlines + body. Latin first, Devanagari fallback for Hindi glyphs. */
  display: '"Anek Latin", "Anek Devanagari", sans-serif',
  /** Numbers. Always paired with tabular figures. */
  numeric: '"Inter", sans-serif',
} as const;

export const weights = {
  regular: 500,
  bold: 700,
  heavy: 800,
} as const;

/** Type scale in px (1080p). */
export const type = {
  label: 34,
  body: 44,
  title: 64,
  wordmark: 150,
  number: 210,
  verdict: 220,
  year: 30,
} as const;

/** Apply to every number so counters never wobble. */
export const tabularNums = { fontVariantNumeric: "tabular-nums" as const };

/* ------------------------------------------------------------------ motion */
/** The one shared ease-out curve for all entrances. No linear, no bounce, no overshoot. */
export const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** The only allowed durations, in frames (30 fps). */
export const durations = {
  fast: 9,
  standard: 15,
  slow: 24,
} as const;

export type DurationKey = keyof typeof durations;

/** Entrance travel distances in px. */
export const distance = {
  /** Quiet moments (e.g. VerdictWord). */
  rise: 8,
  /** Default entrance offset. */
  standard: 24,
} as const;

/** Key numbers must stay on screen at least this long. */
export const KEY_NUMBER_MIN_HOLD = 60;

/**
 * Direction grammar:
 *   past   → enters from the left   (x: -distance → 0)
 *   future → enters from the right  (x: +distance → 0)
 *   growth → moves up, decline → moves down
 */
export const direction = {
  past: -1,
  future: 1,
} as const;

/* ------------------------------------------------------------------ layout */
export const canvas = { width: 1920, height: 1080, fps: 30 } as const;

export const grid = {
  columns: 12,
  margin: 120,
  gutter: 24,
} as const;

/** Width of one grid column in px. */
export const colWidth =
  (canvas.width - grid.margin * 2 - grid.gutter * (grid.columns - 1)) / grid.columns;

/** Left edge (px) of column `i` (0-based). */
export const colX = (i: number) => grid.margin + i * (colWidth + grid.gutter);

/** Width (px) of a span of `n` columns including the gutters between them. */
export const span = (n: number) => n * colWidth + (n - 1) * grid.gutter;

/** Line weights. */
export const stroke = {
  hairline: 2,
  line: 3,
  card: 3,
} as const;

import { Easing } from "remotion";

/**
 * Brand tokens: the ONLY source of colour, type, motion and layout values.
 * Scene files may not hardcode anything that belongs here.
 */

/* ------------------------------------------------------------------ colour */
export const colors = {
  /** Default background. */
  paper: "#F2EFE8",
  /** All text and lines; dark-theme background. */
  ink: "#121212",
  /** BRAND ONLY: titles, wipes, highlights, active caption word. Never data. */
  saffron: "#FF7A00",
  /** Growth / rising numbers only. */
  green: "#1F9D55",
  /** Loss / falling numbers only. */
  crimson: "#D7263D",
  /** Second entity in comparisons only. */
  cobalt: "#2B4CFF",
  /** Muted / inactive. */
  stone: "#B8B2A7",
} as const;
export type ColorName = keyof typeof colors;

/** Max accent colours (saffron/green/crimson/cobalt) visible in any one frame. */
export const MAX_ACCENTS_PER_FRAME = 3;

export const themes = {
  paper: { bg: colors.paper, fg: colors.ink, muted: colors.stone },
  ink: { bg: colors.ink, fg: colors.paper, muted: "#6E6A63" },
} as const;
export type ThemeMode = keyof typeof themes;

/** Data semantics → colour. Saffron is deliberately absent (brand only). */
export const semanticColor = (s: "neutral" | "growth" | "loss" | "second" | "muted", theme: ThemeMode) =>
  ({
    neutral: themes[theme].fg,
    growth: colors.green,
    loss: colors.crimson,
    second: colors.cobalt,
    muted: themes[theme].muted,
  })[s];

/* -------------------------------------------------------------- typography */
export const fonts = {
  /** Headlines + body: Latin first, Devanagari for Hindi glyphs. */
  display: '"Anek Latin", "Anek Devanagari", sans-serif',
  /** Numbers: always with tabular figures. */
  numeric: '"Inter", sans-serif',
} as const;

export const weights = { regular: 500, bold: 700, heavy: 800 } as const;

/** Type scale (px at 1080p). */
export const type = {
  caption: 52,
  label: 44,
  body: 48,
  title: 96,
  wordmark: 150,
  number: 220,
  verdict: 230,
  year: 40,
} as const;

export const tabularNums = { fontVariantNumeric: "tabular-nums" as const };

/* ------------------------------------------------------------------ motion */
/** The ONE easing curve. No linear, no bounce, no overshoot. */
export const ease = Easing.bezier(0.16, 1, 0.3, 1);
/** The only durations (frames @ 30 fps). */
export const durations = { fast: 9, standard: 15, slow: 24 } as const;
export type DurationKey = keyof typeof durations;
/** Entrance travel (px). */
export const distance = { rise: 8, standard: 24 } as const;
/** Key numbers stay on screen at least this long. */
export const KEY_NUMBER_MIN_HOLD = 60;
/** Every scene fades from/to the background over this long at both ends (seconds). */
export const SCENE_FADE_S = 0.2;
/** Past enters from the left (−1), future from the right (+1). */
export const direction = { past: -1, future: 1 } as const;

/* ------------------------------------------------------------------ layout */
export const canvas = { width: 1920, height: 1080, fps: 30 } as const;

/** Content area: 160 px side margins, nothing below y = 860 (captions band). */
export const safe = { left: 160, right: 1760, top: 110, bottom: 860 } as const;
export const safeWidth = safe.right - safe.left;
export const safeHeight = safe.bottom - safe.top;

/** Captions band (in-canvas). */
export const captionsBand = { top: 880, bottom: 1040 } as const;

/** 12-column grid inside the safe area. */
export const grid = { columns: 12, gutter: 24 } as const;
export const colWidth = (safeWidth - grid.gutter * (grid.columns - 1)) / grid.columns;
export const colX = (i: number) => safe.left + i * (colWidth + grid.gutter);
export const span = (n: number) => n * colWidth + (n - 1) * grid.gutter;

export const stroke = { hairline: 2, line: 3, card: 3 } as const;

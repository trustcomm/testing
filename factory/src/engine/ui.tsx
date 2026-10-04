import React from "react";
import { useCurrentFrame } from "remotion";
import { formatValue, type NumberFormat } from "../brand/format";
import { progress, tween } from "../brand/motion";
import { colors, direction, distance, durations, fonts, stroke, tabularNums, type, weights, type DurationKey } from "../brand/tokens";
import { fit } from "./fit";

/**
 * Shared visual primitives used by scene files. All animation starts at an explicit
 * scene-local frame (`at`) so scenes can pace reveals across the voice.
 */

/** Text revealed PER WORD (never per character — Devanagari conjuncts stay shaped). */
export const Words: React.FC<{
  text: string;
  at: number;
  stagger?: number;
  color: string;
  size: number;
  weight?: number;
  family?: string;
  align?: "left" | "center";
  maxWidth?: number;
  lineHeight?: number;
}> = ({ text, at, stagger = 3, color, size, weight = weights.heavy, family = fonts.display, align = "left", maxWidth, lineHeight = 1.05 }) => {
  const frame = useCurrentFrame();
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap: `0 ${0.25 * size}px`,
        fontFamily: family,
        fontWeight: weight,
        fontSize: size,
        lineHeight,
        color,
        maxWidth,
      }}
    >
      {words.map((w, i) => {
        const p = progress(frame, at + i * stagger, "standard");
        return (
          <span key={i} style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * distance.standard}px)` }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Fade + short rise entrance wrapper. `tense` picks horizontal direction (past ← / future →). */
export const Enter: React.FC<{
  at: number;
  d?: DurationKey;
  from?: "below" | "past" | "future" | "none";
  rise?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ at, d = "standard", from = "below", rise = distance.standard, children, style }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, d);
  const tx = from === "past" ? direction.past * rise : from === "future" ? direction.future * rise : 0;
  const ty = from === "below" ? rise : 0;
  return (
    <div style={{ opacity: p, transform: `translate(${(1 - p) * tx}px, ${(1 - p) * ty}px)`, ...style }}>{children}</div>
  );
};

/** Company name set as type — never a logo. */
export const Wordmark: React.FC<{ text: string; color: string; maxWidth: number; size?: number }> = ({ text, color, maxWidth, size = type.wordmark }) => {
  const s = fit(text, { maxWidth, max: size, min: 60, family: fonts.display, weight: weights.heavy });
  return (
    <div style={{ fontFamily: fonts.display, fontWeight: weights.heavy, fontSize: s, lineHeight: 0.9, color, whiteSpace: "nowrap" }}>{text}</div>
  );
};

/** Counter between two values (counts up or down), Indian-formatted, tabular. Lands exactly on `to`. */
export const Counter: React.FC<{
  from: number;
  to: number;
  at: number;
  format: NumberFormat;
  approx?: boolean;
  color: string;
  size?: number;
  maxWidth: number;
  d?: DurationKey;
}> = ({ from, to, at, format, approx, color, size = type.number, maxWidth, d = "slow" }) => {
  const frame = useCurrentFrame();
  const v = tween(frame, at, from, to, d);
  const landed = frame >= at + durations[d] || v === to;
  const dec = Number.isInteger(from) && Number.isInteger(to) ? 0 : 1;
  const text = formatValue(landed ? to : v, format, { decimals: landed ? undefined : dec, approx: landed && approx });
  const widest = [formatValue(from, format, { approx }), formatValue(to, format, { approx })].sort((a, b) => b.length - a.length)[0];
  const s = fit(widest, { maxWidth, max: size, min: 80, family: fonts.numeric, weight: weights.heavy });
  return (
    <div style={{ fontFamily: fonts.numeric, fontWeight: weights.heavy, fontSize: s, lineHeight: 1, letterSpacing: "-0.03em", color, whiteSpace: "nowrap", ...tabularNums }}>
      {text}
    </div>
  );
};

/** Single vertical bar on a baseline. Height follows `value / max`. */
export const Bar: React.FC<{ value: number; max: number; color: string; baseColor: string; width: number; height: number }> = ({ value, max, color, baseColor, width, height }) => {
  const h = Math.max(0, Math.min(1, max ? value / max : 0)) * height;
  return (
    <div style={{ position: "relative", width: width + 60, height }}>
      <div style={{ position: "absolute", left: 30, bottom: 0, width, height: h, backgroundColor: color }} />
      <div style={{ position: "absolute", left: 0, bottom: -stroke.line, width: width + 60, height: stroke.line, backgroundColor: baseColor }} />
    </div>
  );
};

/** Small label text. */
export const Label: React.FC<{ text: string; color: string; size?: number; maxWidth: number; weight?: number }> = ({ text, color, size = type.label, maxWidth, weight = weights.regular }) => {
  const s = fit(text, { maxWidth, max: size, min: 28, family: fonts.display, weight, maxLines: 2 });
  return <div style={{ fontFamily: fonts.display, fontWeight: weight, fontSize: s, lineHeight: 1.15, color, maxWidth }}>{text}</div>;
};

/** Year tag (numbers in Inter, tabular). */
export const Year: React.FC<{ year: number; color: string; size?: number }> = ({ year, color, size = type.year }) => (
  <div style={{ fontFamily: fonts.numeric, fontWeight: weights.heavy, fontSize: size, color, ...tabularNums }}>{year}</div>
);

export const accent = colors;

import React from "react";
import { C, FONT } from "../theme";
import { useFrame, useT } from "../clock";
import { clamp01, easeOutCubic, lerp, useSpring } from "../motion";
import { FPS } from "../theme";

/** A four-point sparkle in Apple blue; it twinkles slowly (scale 0.9 -> 1.1) once it has sprung in. Keep at most three on screen. */
export const Sparkle: React.FC<{ x: number; y: number; size: number; at: number; until?: number; phase?: number }> = ({ x, y, size, at, until, phase = 0 }) => {
  const t = useT(), frame = useFrame();
  const p = useSpring(at);
  if (p <= 0) return null;
  const out = until === undefined ? 0 : clamp01((frame - Math.round(until * FPS)) / 8);
  if (out >= 1) return null;
  const twinkle = 1 + 0.1 * Math.sin(t * 2.4 + phase);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: size, height: size, transform: `translate(-50%, -50%) scale(${Math.min(1, p) * twinkle}) rotate(${(1 - Math.min(1, p)) * -40}deg)`, opacity: Math.min(1, p * 1.4) * (1 - out), filter: `drop-shadow(0 4px 12px ${C.accent}55)` }}>
      <svg viewBox="0 0 24 24" width={size} height={size}><path d="M12 0C12.9 6.9 17.1 11.1 24 12C17.1 12.9 12.9 17.1 12 24C11.1 17.1 6.9 12.9 0 12C6.9 11.1 11.1 6.9 12 0Z" fill={C.accent} /></svg>
    </div>
  );
};

/** The hand-drawn underline swoosh: a stroke that draws itself left to right, starting on `at`. */
export const Swoosh: React.FC<{ at: number; w: number; h?: number; color?: string; width?: number; seconds?: number; variant?: 0 | 1 }> = ({ at, w, h = 40, color = C.accent, width = 9, seconds = 0.5, variant = 0 }) => {
  const frame = useFrame();
  const p = easeOutCubic(clamp01((frame - Math.round(at * FPS)) / (seconds * FPS)));
  if (p <= 0) return null;
  const d = variant === 0 ? `M6 ${h * 0.62} C ${w * 0.2} ${h * 0.12}, ${w * 0.55} ${h * 0.95}, ${w - 8} ${h * 0.3}` : `M6 ${h * 0.35} C ${w * 0.3} ${h * 0.9}, ${w * 0.6} ${h * 0.05}, ${w - 8} ${h * 0.55}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", display: "block" }}>
      <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - p} />
    </svg>
  );
};

/**
 * An odometer: every digit column is a strip 0-9 that rolls when the digit below it carries, like a mechanical counter.
 * `value` is the number to show now; `size` the font size; `prefix` / `suffix` are static text; digits are tabular.
 */
export const Odometer: React.FC<{ value: number; digits: number; size: number; color?: string; font?: string; weight?: number; prefix?: string; commas?: boolean }> = ({ value, digits, size, color = C.text, font = FONT.display, weight = 700, prefix = "", commas = true }) => {
  const cols: React.ReactNode[] = [];
  const lh = size * 1.0, cw = size * 0.6;
  for (let k = digits - 1; k >= 0; k--) {
    const v = value / 10 ** k, whole = Math.floor(v), frac = v - whole;
    // the column rolls only as the digit below it carries: eased over the last 20 % of the fraction
    const pos = (whole % 10) + (k === 0 ? frac : easeOutCubic(clamp01((frac - 0.8) / 0.2)));
    const visible = value >= 10 ** k || k === 0;
    cols.push(
      <div key={k} style={{ display: "flex" }}>
        <div style={{ position: "relative", width: cw, height: lh, overflow: "hidden", opacity: visible ? 1 : 0 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, transform: `translateY(${-pos * lh}px)` }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, j) => <div key={j} style={{ height: lh, lineHeight: `${lh}px`, textAlign: "center" }}>{d}</div>)}
          </div>
        </div>
        {commas && k > 0 && k % 3 === 0 && <div style={{ width: size * 0.28, height: lh, lineHeight: `${lh}px`, textAlign: "center", opacity: value >= 10 ** k ? 1 : 0 }}>,</div>}
      </div>,
    );
  }
  return <div style={{ display: "flex", alignItems: "center", fontFamily: font, fontWeight: weight, fontSize: size, letterSpacing: "-0.03em", color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}><span>{prefix}</span>{cols}</div>;
};

export const lerpN = lerp;

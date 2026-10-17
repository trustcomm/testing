import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EXIT_FRAMES, FONT, SPRING_DAMPING, C } from "../theme";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
export const outCubic = (x: number) => 1 - (1 - x) ** 3;
export const inOutCubic = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
export const smooth = (a: number, b: number, x: number) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
/** Absolute time in seconds: every element reads the same clock, so a cue time from cues.ts means the same thing everywhere. */
export const useT = () => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return f / fps; };
/** A deterministic 0..1 from an integer: no Math.random in a render. */
export const rand = (i: number, k = 0) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };

/**
 * A springy pop-in (damping 12) that starts on `at` seconds and, if `until` is given, ease-outs over 2 frames from `until`.
 * It renders nothing before `at` and nothing after the exit.
 */
export const Pop: React.FC<{ at: number; until?: number; from?: number; dy?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ at, until, from = 0.5, dy = 0, style, children }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const local = frame - Math.round(at * fps);
  if (local < 0) return null;
  let exit = 1;
  if (until !== undefined) {
    const f1 = Math.round(until * fps);
    if (frame >= f1 + EXIT_FRAMES) return null;
    exit = interpolate(frame, [f1, f1 + EXIT_FRAMES], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  }
  const s = spring({ frame: local, fps, config: { damping: SPRING_DAMPING } });
  const fadeIn = clamp01(local / 3);
  return <div style={{ opacity: fadeIn * exit, transform: `translateY(${dy * (1 - s)}px) scale(${(from + (1 - from) * s) * (0.96 + 0.04 * exit)})`, ...style }}>{children}</div>;
};

/** Centres its children on (x, y) of the 1080x1920 frame. */
export const At: React.FC<{ x: number; y: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, style, children }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", ...style }}>{children}</div>
);

/** A hand-drawn highlight bar that wipes in behind its text, starting on `at`. */
export const HL: React.FC<{ at: number; color?: string; children?: React.ReactNode }> = ({ at, color = C.accent, children }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = outCubic(clamp01((frame - Math.round(at * fps)) / 10));
  return (
    <span style={{ position: "relative", display: "inline-block", padding: "0 0.14em", margin: "0 -0.06em" }}>
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: "0.02em", width: "100%", height: "0.84em", zIndex: 0, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}>
        <path d="M3 20 Q28 5 66 13 T139 7 T198 15 L194 72 Q172 96 121 87 T52 93 T5 85 Z" fill={color} />
      </svg>
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </span>
  );
};

export type HeadWord = { text: string; at: number; hl?: number };
/** Headline: ExtraBold, centred, words pop in on their own cues (typically 6 frames apart), an optional highlight bar on a word. */
export const Headline: React.FC<{ lines: HeadWord[][]; size: number; top: number; until: number }> = ({ lines, size, top, until }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.04, letterSpacing: "-0.02em", color: C.text }}>
    {lines.map((line, li) => (
      <div key={li} style={{ display: "flex", gap: "0.24em", justifyContent: "center", whiteSpace: "nowrap" }}>
        {line.map((hw, wi) => (
          <Pop key={wi} at={hw.at} until={until} from={0.4} dy={30}>
            {hw.hl !== undefined ? <HL at={hw.hl}>{hw.text}</HL> : hw.text}
          </Pop>
        ))}
      </div>
    ))}
  </div>
);

/** "01 PROBLEM" pill above a headline. */
export const Pill: React.FC<{ num?: string; label: string; at: number; until: number; color?: string; top?: number }> = ({ num, label, at, until, color = C.accent, top = 262 }) => (
  <Pop at={at} until={until} from={0.6} style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>
    <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "12px 30px", borderRadius: 999, border: `3px solid ${color}`, background: `${color}26`, fontFamily: FONT, fontWeight: 800, fontSize: 38, letterSpacing: "0.14em", color: C.text }}>
      {num && <span style={{ color }}>{num}</span>}<span>{label}</span>
    </div>
  </Pop>
);

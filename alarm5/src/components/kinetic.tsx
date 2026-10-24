import React from "react";
import { C, FONT } from "../theme";
import { useFrame } from "../clock";
import { clamp01 } from "../motion";
import { settle } from "../easing";
const easeOutCubic = settle;

/** Key words pop 1.0 -> 1.08 -> 1.0 when spoken (frame `at`); `underline` wipes a red (danger) or green (trust) line under the word. */
export const KWord: React.FC<{ at: number; underline?: "danger" | "trust"; underlineAt?: number; pop?: boolean; style?: React.CSSProperties; children: React.ReactNode }> = ({ at, underline, underlineAt, pop = true, style, children }) => {
  const f = useFrame();
  const t = (f - at) / 18, s = pop && t >= 0 && t <= 1 ? 1 + 0.08 * Math.sin(Math.PI * t) : 1;
  const u = underline ? easeOutCubic((f - (underlineAt ?? at)) / 20) : 0;
  return (
    <span style={{ position: "relative", display: "inline-block", transform: `scale(${s})`, transformOrigin: "50% 60%", ...style }}>
      {children}
      {underline && u > 0 && <span style={{ position: "absolute", left: 0, bottom: "-0.12em", height: 5, width: `${clamp01(u) * 100}%`, borderRadius: 3, background: underline === "danger" ? C.alarm : C.trust }} />}
    </span>
  );
};

/** Inter Display 700 headline, tracking -0.03em. */
export const headline = (size: number): React.CSSProperties => ({ fontFamily: FONT.display, fontWeight: 700, fontSize: size, letterSpacing: "-0.03em", lineHeight: 1.02, color: C.text });
export const mono = (size: number, color: string = C.text): React.CSSProperties => ({ fontFamily: FONT.mono, fontWeight: 500, fontSize: size, color, letterSpacing: "0.01em" });
export const body = (size: number, color: string = C.text): React.CSSProperties => ({ fontFamily: FONT.body, fontWeight: 500, fontSize: size, color });
/** accent words: Instrument Serif Italic */
export const serif = (size: number, color: string = C.text): React.CSSProperties => ({ fontFamily: FONT.serif, fontStyle: "italic", fontWeight: 400, fontSize: size, color, letterSpacing: "-0.01em" });

/** Types text in character by character: `chars` per second from frame `at`; the caret blinks while typing. */
export const TypeIn: React.FC<{ text: string; at: number; cps?: number; caret?: boolean; style?: React.CSSProperties }> = ({ text, at, cps = 22, caret = true, style }) => {
  const f = useFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor(((f - at) / 60) * cps)));
  if (f < at) return null;
  return <span style={style}>{text.slice(0, n)}{caret && n < text.length && <span style={{ opacity: Math.floor(f / 16) % 2 ? 0.2 : 1 }}>▍</span>}</span>;
};

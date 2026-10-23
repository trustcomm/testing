import React from "react";
import { C, FONT } from "../theme";

export type Tone = "default" | "danger" | "trust";
const COLOR: Record<Tone, string> = { default: C.text, danger: C.alarm, trust: C.trust };
/** A label pill: mono 26 px caps, 1 px stroke, 999 px radius. Danger pills have a red stroke and red text. */
export const Pill: React.FC<{ children: React.ReactNode; tone?: Tone; size?: number; style?: React.CSSProperties }> = ({ children, tone = "default", size = 26, style }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: `${size * 0.42}px ${size * 0.95}px`, borderRadius: 999, border: `1px solid ${COLOR[tone]}`, color: COLOR[tone], fontFamily: FONT.mono, fontWeight: 500, fontSize: size, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap", lineHeight: 1, ...style }}>{children}</div>
);

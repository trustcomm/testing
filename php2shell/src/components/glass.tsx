import React from "react";
import { C } from "../theme";

/** A glass panel: rgba(255,255,255,0.06), 24 px backdrop blur, a 1 px rgba(255,255,255,0.12) stroke, a 28 px radius. */
export const Glass: React.FC<{ w: number; h: number; r?: number; tint?: string; stroke?: string; style?: React.CSSProperties; children?: React.ReactNode }> = ({ w, h, r = 28, tint, stroke, style, children }) => (
  <div style={{ position: "relative", width: w, height: h, borderRadius: r, background: tint ?? C.glass, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: `1px solid ${stroke ?? C.glassStroke}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)", boxSizing: "border-box", ...style }}>{children}</div>
);

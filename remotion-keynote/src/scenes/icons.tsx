import React from "react";
import { C } from "../theme";
import { clamp01 } from "../motion";

/** A green check in a circle (success #34C759). */
export const Check: React.FC<{ size?: number; draw?: number }> = ({ size = 48, draw = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill={C.ok} /><path d="M13 25l8 8 15-17" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp01(draw)} /></svg>
);
export const Person: React.FC<{ size?: number; color?: string }> = ({ size = 36, color = C.secondary }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4.5 4.2-6 8-6s7 1.5 8 6" /></svg>
);

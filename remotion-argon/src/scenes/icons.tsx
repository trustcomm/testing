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

const line = (size: number, color: string) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
export const Bolt: React.FC<{ size?: number; color?: string }> = ({ size = 36, color = C.accent }) => <svg {...line(size, color)}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>;
export const Coin: React.FC<{ size?: number; color?: string }> = ({ size = 36, color = C.accent }) => <svg {...line(size, color)}><circle cx="12" cy="12" r="9" /><path d="M14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.4 0-2.5.7-2.5 1.8 0 2.6 5 1.2 5 3.8 0 1.2-1.1 2-2.6 2-1.2 0-2.2-.5-2.7-1.4M12 6v2M12 16v2" /></svg>;
export const Frames: React.FC<{ size?: number; color?: string }> = ({ size = 36, color = C.text }) => <svg {...line(size, color)}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 9h18M8 5v14M16 5v14" /></svg>;
export const Stopwatch: React.FC<{ size?: number; color?: string }> = ({ size = 36, color = C.accent }) => <svg {...line(size, color)}><circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.5 1.5M9.5 2.5h5M12 2.5v3.5" /></svg>;
export const Lens: React.FC<{ size?: number; color?: string }> = ({ size = 36, color = C.accent }) => <svg {...line(size, color)}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.8-4.8M8 10.5h5M10.5 8v5" /></svg>;
export const Cloud: React.FC<{ size?: number; color?: string }> = ({ size = 36, color = C.accent }) => <svg {...line(size, color)}><path d="M7 18a4.5 4.5 0 0 1-.7-8.9 6 6 0 0 1 11.5 1.4A3.8 3.8 0 0 1 17.5 18H7Z" /></svg>;
export const Train: React.FC<{ size?: number; color?: string }> = ({ size = 36, color = C.accent }) => <svg {...line(size, color)}><rect x="5" y="3" width="14" height="14" rx="3" /><path d="M5 11h14M9 21l2-4M15 21l-2-4M9 14h.01M15 14h.01" /></svg>;
export const Camera: React.FC<{ size?: number; color?: string }> = ({ size = 36, color = C.accent }) => <svg {...line(size, color)}><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H8l1.5-2h5L16 6h2.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-9Z" /><circle cx="12" cy="13" r="3.8" /></svg>;

import React from "react";

type P = { size?: number; color?: string };
const base = (size: number, color: string) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
export const Heart: React.FC<P> = ({ size = 40, color = "#fff" }) => <svg {...base(size, color)}><path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.4 3.2 5 6.6 5c2 0 3.5 1.1 5.4 3.2C13.9 6.1 15.4 5 17.4 5c3.4 0 5.4 3.4 4.1 6.8C19.5 16.4 12 21 12 21Z" /></svg>;
export const Send: React.FC<P> = ({ size = 40, color = "#fff" }) => <svg {...base(size, color)}><path d="M22 3 11 14" /><path d="M22 3l-7 18-4-7-7-4 18-7Z" /></svg>;
export const LinkIcon: React.FC<P> = ({ size = 40, color = "#fff" }) => <svg {...base(size, color)}><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>;
export const Bubble: React.FC<P> = ({ size = 40, color = "#fff" }) => <svg {...base(size, color)}><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12Z" /></svg>;
export const Check: React.FC<P & { draw?: number }> = ({ size = 40, color = "#3DDC97", draw = 1 }) => (
  <svg {...base(size, color)} strokeWidth={3.4}><path d="M4 12.5l5 5L20 6.5" strokeDasharray={26} strokeDashoffset={26 * (1 - draw)} /></svg>
);
/** A four-point sparkle. */
export const Spark: React.FC<P> = ({ size = 40, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 0c.9 6.6 4.8 10.5 12 12-7.2 1.5-11.1 5.4-12 12-.9-6.6-4.8-10.5-12-12C7.2 10.5 11.1 6.6 12 0Z" fill={color} /></svg>
);
export const Person: React.FC<{ size: number; bg: string }> = ({ size, bg }) => (
  <svg width={size} height={size} viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill={bg} /><circle cx="20" cy="15" r="7" fill="rgba(255,255,255,0.82)" /><path d="M6 36c1.6-8 7-11 14-11s12.4 3 14 11a20 20 0 0 1-28 0Z" fill="rgba(255,255,255,0.82)" /></svg>
);

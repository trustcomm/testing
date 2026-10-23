// The login box of S8: a UI panel ("USERNAME / PASSWORD", two fields) that stands in front of the racks. It writes on, listens (carets blink),
// and when the hacker walks past without using it, gets a red strike-through and dims.
import React from "react";
import { C, FONT } from "../theme";
import { useFrame } from "../clock";
import { Stroke, line, rrect } from "./draw";
import { clamp01, easeOutCubic } from "../motion";

export const LOGIN = { x: 320, y: 530, w: 440, h: 318 };

export const LoginBox: React.FC<{
  at: number;                 // write-on starts on this frame
  listen?: number;            // from this frame the fields pulse (the box waits for input)
  strike?: number;            // frame the red strike-through wipes across
  fade?: number;              // frame the box leaves (dissolve, 9 frames)
}> = ({ at, listen = Infinity, strike = Infinity, fade = Infinity }) => {
  const f = useFrame(), { x, y, w, h } = LOGIN;
  const off = clamp01((f - fade) / 9), s = easeOutCubic((f - strike) / 7), denied = clamp01((f - strike) / 6);
  if (off >= 1 || f < at) return null;
  const dim = 1 - 0.55 * denied, textIn = easeOutCubic((f - at - 8) / 8), pulse = f >= listen ? 0.5 + 0.5 * Math.sin(((f - listen) / 30) * Math.PI * 2 * 1.4) : 0;
  const field = (fy: number, k: number) => (
    <g>
      <Stroke d={rrect(x + 36, fy, w - 72, 60, 14)} at={at + 4 + k * 3} frames={14} color={f >= listen && f < strike ? `rgba(245,245,247,${0.7 + 0.3 * pulse})` : C.text} />
      {f >= listen && f < strike + 1 && Math.floor((f - listen) / 8) % 2 === 0 && <line x1={x + 56} y1={fy + 15} x2={x + 56} y2={fy + 45} stroke={C.text} strokeWidth={3} strokeLinecap="round" />}
    </g>
  );
  return (
    <>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: (1 - off) * dim, filter: off > 0 ? `blur(${off * 8}px)` : undefined }}>
        <rect x={x} y={y} width={w} height={h} rx={28} fill="#000" opacity={clamp01((f - at - 9) / 8)} />
        <Stroke d={rrect(x, y, w, h, 28)} at={at} frames={18} />
        {field(y + 92, 0)}
        {field(y + 214, 1)}
      </svg>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: textIn * (1 - off) * dim, filter: off > 0 ? `blur(${off * 8}px)` : undefined }}>
        {[["USERNAME", y + 62], ["PASSWORD", y + 184]].map(([t, ty]) => (
          <div key={t as string} style={{ position: "absolute", left: x + 40, top: (ty as number) - 15, fontFamily: FONT.mono, fontWeight: 500, fontSize: 28, letterSpacing: "0.1em", color: C.secondary, lineHeight: "30px" }}>{t}</div>
        ))}
      </div>
      {s > 0 && (
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: 1 - off, filter: `drop-shadow(0 0 10px rgba(255,59,48,0.7))` }}>
          <Stroke d={line(x - 34, y + h / 2 + 4, x + w + 34, y + h / 2 + 4)} p={s} color={C.alarm} w={6} />
        </svg>
      )}
    </>
  );
};

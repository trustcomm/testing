import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { useFrame } from "../clock";
import { clamp01, Rise, smooth } from "../motion";
import { settle } from "../easing";
import { headline, KWord } from "../components/kinetic";
import { cue } from "../cues/s02";

/** "Darr nahi, sach.": three words rise one by one; a thin green underline wipes under "sach" (the first hint of trust) */
export const S2Screen: React.FC = () => {
  const f = useFrame();
  const out = cue.textOut;
  if (f < cue.darr - 2 || f > out + 20) return null;
  const o = smooth(out, out + 14, f);
  const u = settle(clamp01((f - cue.underline) / 26));
  return (
    <AbsoluteFill style={{ opacity: 1 - o, filter: o > 0 ? `blur(${o * 8}px)` : undefined, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 590, display: "flex", justifyContent: "center", gap: "0 28px", ...headline(150), whiteSpace: "nowrap" }}>
        <Rise at={cue.darr} frames={22}><span>Darr</span></Rise>
        <Rise at={cue.nahi} frames={22}><span>nahi,</span></Rise>
        <Rise at={cue.sach} frames={22}>
          <span style={{ position: "relative", display: "inline-block" }}>sach.<span style={{ position: "absolute", left: 0, bottom: -10, height: 6, width: `${u * 100}%`, borderRadius: 3, background: C.trust, boxShadow: "0 0 16px rgba(52,199,89,0.6)" }} /></span>
        </Rise>
      </div>
    </AbsoluteFill>
  );
};

import React from "react";
import { C, CAPTION_Y, CAPTION_Y_S11, FONT, FPS } from "../theme";
import { captionAt, groups } from "../captions";
import { CAPTION_LIFT } from "../timeline";
import { useFrame } from "../clock";
import { clamp01, easeOutCubic, lerp } from "../motion";

/** Inter 700 44 px, white, a soft dark shadow, centred above the bottom zone; the spoken word is red in S1-S9 and green from S10; they lift during the versions panel. */
export const Captions: React.FC = () => {
  const f = useFrame(), c = captionAt(f / FPS);
  if (!c) return null;
  const g = c.group, trust = ["S10", "S11", "S12", "S13"].includes(g.words[c.current].scene);
  const lift = clamp01((f - CAPTION_LIFT.from) / 8) * (1 - clamp01((f - CAPTION_LIFT.to) / 8));
  const y = lerp(CAPTION_Y, CAPTION_Y_S11, lift);
  const p = easeOutCubic((f - g.show * FPS) / 6);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, transform: "translateY(-50%)", display: "flex", justifyContent: "center", opacity: p, pointerEvents: "none" }}>
      <div style={{ display: "flex", gap: "0 0.28em", fontFamily: FONT.body, fontWeight: 700, fontSize: 44, letterSpacing: "-0.01em", whiteSpace: "nowrap", textShadow: "0 2px 14px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.9)", transform: `translateY(${(1 - p) * 8}px)` }}>
        {g.words.map((wd, i) => <span key={wd.i} style={{ color: i === c.current ? (trust ? C.trust : C.alarm) : C.text }}>{wd.text}</span>)}
      </div>
    </div>
  );
};

import React from "react";
import { C, CAPTION_Y, FONT, FPS } from "../theme";
import { captionAt } from "../captions";
import { LIFTS } from "../timeline";
import { useFrame } from "../clock";
import { clamp01, lerp } from "../motion";
import { settle, glide } from "../easing";

/** Inter 700 44 px, white, a soft dark shadow, centred above the bottom zone (screen space: the camera never touches it). Each chunk slides up 12 px and fades in over 6 frames.
 *  The spoken word is red in S1-S12 and green in S13-S15. Captions move up while a fact line or action card occupies their place. */
export const Captions: React.FC = () => {
  const f = useFrame(), c = captionAt(f / FPS);
  if (!c) return null;
  const g = c.group, trust = ["S13", "S14", "S15"].includes(g.words[c.current].scene);
  let lift = 0;
  for (const [a, b] of LIFTS) lift = Math.max(lift, clamp01((f - a) / 12) * (1 - clamp01((f - b) / 12)));
  const y = lerp(CAPTION_Y, CAPTION_Y - 90, glide(lift));
  const p = settle(clamp01((f - g.show * FPS) / 6)), out = clamp01((f - (g.hide * FPS - 4)) / 4);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, transform: "translateY(-50%)", display: "flex", justifyContent: "center", opacity: p * (1 - out), pointerEvents: "none" }}>
      <div style={{ display: "flex", gap: "0 0.28em", fontFamily: FONT.body, fontWeight: 700, fontSize: 44, letterSpacing: "-0.01em", whiteSpace: "nowrap", textShadow: "0 2px 14px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.9)", transform: `translateY(${(1 - p) * 12}px)` }}>
        {g.words.map((wd, i) => <span key={wd.i} style={{ color: i === c.current ? (trust ? C.trust : C.alarm) : C.text }}>{wd.text}</span>)}
      </div>
    </div>
  );
};

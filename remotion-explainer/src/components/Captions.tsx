import React from "react";
import { C, FONT, LAYOUT } from "../theme";
import { groups } from "../captions";
import { Pop, useT } from "./motion";

/** Burned-in captions: 2-4 words at a time, the word being spoken in the accent colour. Lower third, above the bottom 420 px. */
export const Captions: React.FC = () => {
  const t = useT();
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: LAYOUT.captionTop, height: LAYOUT.captionBottom - LAYOUT.captionTop, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {groups.map((g, gi) => {
        if (t < g.show - 0.02 || t > g.hide + 0.1) return null;
        let cur = 0;
        g.words.forEach((wd, i) => { if (t >= wd.start) cur = i; });
        return (
          <Pop key={gi} at={g.show} until={g.hide} from={0.88} dy={12} style={{ position: "absolute", left: 0, right: 0, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 0.28em", fontFamily: FONT, fontWeight: 800, fontSize: 72, lineHeight: 1.12, letterSpacing: "-0.01em", textAlign: "center" }}>
            {g.words.map((wd, wi) => (
              <span key={wi} style={{ color: wi === cur ? C.accent : C.text, WebkitTextStroke: "11px #0B0B10", paintOrder: "stroke fill", textShadow: "0 6px 22px rgba(0,0,0,0.6)", transform: wi === cur ? "scale(1.06)" : undefined, display: "inline-block" }}>{wd.text}</span>
            ))}
          </Pop>
        );
      })}
    </div>
  );
};

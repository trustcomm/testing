import React from "react";
import { C, FONT } from "../theme";
import { CUE } from "../cues";
import { At, Enter } from "../motion";
import { useT } from "../clock";
import { Sparkle } from "../components/bits";
import { HEAD, SERIF } from "./text";

/** 8. "Fair test ka poora prompt chahiye? Comment karo PROMPT." A blue glass PROMPT pill pulses in on the last word. */
export const Cta: React.FC = () => {
  const t = useT(), c = CUE.s8;
  const bump = t >= c.prompt ? Math.exp(-(t - c.prompt) * 4.5) : 0;
  const scale = t >= c.prompt ? 1 + 0.022 * Math.sin(t * 3.4) + 0.07 * bump : 1;
  const ripple = (k: number) => { const d = t - c.prompt - k * 0.5; return d >= 0 && d < 1.5 ? d / 1.5 : -1; };
  const word = (text: string, at: number) => <Enter at={at} dy={32} blur={10}>{text}</Enter>;
  return (
    <>
      <At x={540} y={560} style={{ width: 1000, textAlign: "center" }}>
        <div style={{ ...HEAD, fontSize: 124, display: "flex", justifyContent: "center", gap: "0.22em", whiteSpace: "nowrap" }}>{word("Fair", c.fair)}{word("test", c.test)}{word("ka", c.ka)}</div>
        <div style={{ ...SERIF, fontSize: 122, display: "flex", justifyContent: "center", gap: "0.2em", marginTop: 10, whiteSpace: "nowrap" }}>{word("poora", c.poora)}{word("prompt?", c.prompt23)}</div>
      </At>
      <At x={540} y={860} style={{ display: "flex", gap: "0.26em", ...HEAD, fontSize: 92, whiteSpace: "nowrap" }}>
        <Enter at={c.comment} dy={28} blur={10}>Comment</Enter><Enter at={c.karo} dy={28} blur={10}>karo</Enter>
      </At>
      {[0, 1, 2].map((k) => { const r = ripple(k); return r < 0 ? null : <At key={k} x={540} y={1100} style={{ width: 560 + r * 330, height: 176 + r * 330, borderRadius: 999, border: `3px solid ${C.accent}`, opacity: 0.5 * (1 - r) }} />; })}
      <At x={540} y={1100}>
        <Enter at={c.prompt} dy={50} blur={10}>
          <div style={{ transform: `scale(${scale})` }}>
            <div style={{ position: "relative", width: 560, height: 176, borderRadius: 88, background: `linear-gradient(180deg, #3D9BFF 0%, ${C.accent} 100%)`, boxShadow: `0 2px 6px rgba(0,0,0,0.06), 0 26px 60px rgba(0,113,227,${0.34 + 0.2 * bump}), inset 0 1px 0 rgba(255,255,255,0.55)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "52%", background: "linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0))" }} />
              <span style={{ position: "relative", fontFamily: FONT.display, fontWeight: 700, fontSize: 98, letterSpacing: "0.05em", color: "#fff" }}>PROMPT</span>
            </div>
          </div>
        </Enter>
      </At>
      <Sparkle x={150} y={1000} size={44} at={c.prompt} phase={0} />
      <Sparkle x={935} y={1200} size={32} at={c.prompt} phase={1.7} />
    </>
  );
};

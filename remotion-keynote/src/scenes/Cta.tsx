import React from "react";
import { C, FONT } from "../theme";
import { CUE } from "../cues";
import { At, Enter, clamp01, easeOutCubic, useSpring } from "../motion";
import { useT } from "../clock";
import { Sparkle } from "../components/bits";
import { HEAD } from "./text";

/** 7. A glass MOTION pill in Apple blue pulses in the centre; "Comment karo" above, the DM line and the handle below. */
export const Cta: React.FC = () => {
  const t = useT(), c = CUE.s7;
  const hit = useSpring(c.motion), bump = t >= c.motion ? Math.exp(-(t - c.motion) * 4.5) : 0;
  const scale = 1 + 0.022 * Math.sin(t * 3.4) + 0.07 * bump;
  const ripple = (k: number) => { const d = t - c.motion - k * 0.55; return d >= 0 && d < 1.6 ? d / 1.6 : -1; };
  return (
    <>
      {[0, 1, 2].map((k) => { const r = ripple(k); return r < 0 ? null : <At key={k} x={540} y={760} style={{ width: 560 + r * 330, height: 176 + r * 330, borderRadius: 999, border: `3px solid ${C.accent}`, opacity: 0.5 * (1 - r) }} />; })}
      <At x={540} y={760}>
        <Enter at={c.prompt} dy={50} blur={10}>
          <div style={{ transform: `scale(${scale})` }}>
            <div style={{ position: "relative", width: 560, height: 176, borderRadius: 88, background: `linear-gradient(180deg, #3D9BFF 0%, ${C.accent} 100%)`, boxShadow: `0 2px 6px rgba(0,0,0,0.06), 0 26px 60px rgba(0,113,227,${0.34 + 0.2 * bump}), inset 0 1px 0 rgba(255,255,255,0.55)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "52%", background: "linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0))" }} />
              <span style={{ position: "relative", fontFamily: FONT.display, fontWeight: 700, fontSize: 98, letterSpacing: "0.05em", color: "#fff" }}>MOTION</span>
            </div>
          </div>
        </Enter>
      </At>
      <At x={540} y={540} style={{ display: "flex", gap: "0.26em", ...HEAD, fontSize: 92, whiteSpace: "nowrap" }}>
        <Enter at={c.comment} dy={28} blur={10}>Comment</Enter><Enter at={c.karo} dy={28} blur={10}>karo</Enter>
      </At>
      <At x={540} y={990} style={{ textAlign: "center" }}>
        <Enter at={c.motion} dy={24}><div style={{ fontFamily: FONT.ui, fontWeight: 600, fontSize: 60, color: C.text, whiteSpace: "nowrap" }}>prompt seedha DMs me</div></Enter>
        <Enter at={c.motion} i={2} dy={24}><div style={{ marginTop: 18, fontFamily: FONT.ui, fontWeight: 500, fontSize: 52, color: C.secondary }}>@baqur.ai</div></Enter>
      </At>
      <Sparkle x={160} y={700} size={44} at={c.motion} phase={0} />
      <Sparkle x={930} y={820} size={32} at={c.motion} phase={1.7} />
    </>
  );
};

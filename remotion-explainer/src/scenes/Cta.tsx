import React from "react";
import { C, FONT, FPS, STAGGER } from "../theme";
import { CUE } from "../cues";
import { At, HL, Headline, Pop, clamp01, outCubic, useT } from "../components/motion";

/** 7. CTA: a MOTION keyword pill pulses in the centre, COMMENT → PROMPT IN YOUR DMs, then the handle. */
export const Cta: React.FC<{ end: number }> = ({ end }) => {
  const t = useT(); const c = CUE.cta, st = STAGGER / FPS;
  const hit = outCubic(clamp01((t - c.pulse) / 0.25));
  const scale = 1 + 0.03 * Math.sin(t * 5) + (t >= c.pulse ? 0.09 * (1 - hit) + 0.04 * Math.sin((t - c.pulse) * 8) : 0);
  const rings = t >= c.pulse ? [0, 1, 2].map((k) => t - c.pulse - k * 0.5).filter((d) => d >= 0).map((d) => (d % 1.5) / 1.5) : [];
  return (
    <>
      {rings.map((r, k) => <At key={k} x={540} y={715} style={{ width: 640 + r * 340, height: 230 + r * 150, borderRadius: 999, border: `4px solid ${C.accent}`, opacity: 0.65 * (1 - r) }} />)}
      <At x={540} y={715}>
        <Pop at={c.pill} until={end} from={0.3}>
          <div style={{ transform: `scale(${scale})`, padding: "26px 78px", borderRadius: 999, background: C.accent, boxShadow: `0 0 ${70 + 40 * (1 - hit)}px ${C.accent}, 0 24px 60px rgba(0,0,0,0.55)`, fontFamily: FONT, fontWeight: 900, fontSize: 150, letterSpacing: "0.03em", color: "#fff", lineHeight: 1.1 }}>MOTION</div>
        </Pop>
      </At>
      <Headline size={64} top={945} until={end} lines={[
        [{ text: "COMMENT", at: c.comment }, { text: "→", at: c.comment + st }],
        [{ text: "PROMPT", at: c.comment + 2 * st }, { text: "IN", at: c.comment + 3 * st }, { text: "YOUR", at: c.comment + 4 * st }, { text: "DMs", at: c.comment + 5 * st }],
      ]} />
      <At x={540} y={1185}>
        <Pop at={c.handle} until={end} from={0.4}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 76, color: C.text, letterSpacing: "-0.01em" }}><HL at={c.handle + st}>@baqur.ai</HL></div>
        </Pop>
      </At>
    </>
  );
};

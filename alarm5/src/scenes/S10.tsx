import React from "react";
import { C } from "../theme";
import { useFrame } from "../clock";
import { clamp01, smooth, Rise } from "../motion";
import { settle, swing } from "../easing";
import { Local, Stroke, check, rrect } from "../components/draw";
import { Abs, Panel, T, WPill } from "../components/art";
import { Obj } from "../world";
import { stationAt } from "../components/map";
import { ART } from "../timeline";
import { cue } from "../cues/s10";
import { PHONE } from "./S09";

/** S10: a green Update ring completes around the phone; the card "Fix aa gaya" and the grey "No known exploitation" line */
export const S10World: React.FC = () => {
  const f = useFrame();
  const [a, b] = ART.window[2];
  if (f < cue.ringStart - 10 || f > b + 40) return null;
  const p = swing(clamp01((f - cue.ringStart) / (cue.ringEnd - cue.ringStart)));
  const done = f >= cue.ringEnd, flash = done ? Math.exp(-(f - cue.ringEnd) / 14) : 0;
  return (
    <Obj at={stationAt(2)} r={820} art z={3}>
      <Local>
        <g transform={`translate(0 ${PHONE.y})`}>
          <Stroke d={rrect(-176, -326, 352, 612, 66)} p={p} color={C.trust} w={5} glow={`rgba(52,199,89,${0.35 + 0.5 * flash})`} />
          <g opacity={smooth(cue.ringEnd - 4, cue.ringEnd + 10, f)}><Stroke d={check(0, 0, 150)} at={cue.ringEnd} frames={22} color={C.trust} w={7} glow="rgba(52,199,89,0.5)" /></g>
        </g>
      </Local>
      <WPill x={0} y={-376} at={cue.ringStart} size={28} tone="trust">UPDATE</WPill>
      <Panel x={0} y={402} w={900} h={190} at={cue.card} tone="trust">
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <T size={66} display>Fix aa gaya <span style={{ color: C.trust }}>✓</span></T>
          <T size={40} display weight={700} color={C.secondary}>Signal update karo</T>
        </div>
      </Panel>
      <Abs x={0} y={530}><Rise at={cue.grey} frames={22}><T size={26} mono color={C.secondary}>No known exploitation</T></Rise></Abs>
    </Obj>
  );
};

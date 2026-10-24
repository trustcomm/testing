import React from "react";
import { C } from "../theme";
import { useFrame } from "../clock";
import { clamp01 } from "../motion";
import { settle } from "../easing";
import { Local } from "../components/draw";
import { Lock, Panel, T } from "../components/art";
import { Obj } from "../world";
import { stationAt } from "../components/map";
import { cue } from "../cues/s04";

/** a green underline that wipes under inline text starting on frame `at` */
export const UL: React.FC<{ at: number; frames?: number; children: React.ReactNode }> = ({ at, frames = 22, children }) => {
  const f = useFrame(), u = settle(clamp01((f - at) / frames));
  return <span style={{ position: "relative", display: "inline-block" }}>{children}<span style={{ position: "absolute", left: 0, bottom: -4, height: 4, width: `${u * 100}%`, borderRadius: 2, background: C.trust, boxShadow: "0 0 12px rgba(52,199,89,0.6)" }} /></span>;
};

export const S4World: React.FC = () => {
  const f = useFrame();
  if (f < cue.card - 4 || f > cue.lock + 200) return null;
  const closed = settle(clamp01((f - (cue.lock - 8)) / 10));
  const bump = f >= cue.lock && f < cue.lock + 14 ? 1 + 0.06 * Math.sin(((f - cue.lock) / 14) * Math.PI) : 1;
  return (
    <Obj at={stationAt(5)} r={760} art z={3}>
      <Panel x={0} y={246} w={900} h={350} at={cue.card} tone="trust">
        <div style={{ position: "absolute", left: 0, top: 0, width: 900, height: 350 }}>
          <Local style={{ left: 0, top: 0 }}>
            <g transform={`translate(0 0) scale(${bump})`} style={{ transformOrigin: "140px 175px" }}><Lock x={140} y={175} s={1.55} at={cue.card + 10} closed={closed} /></g>
          </Local>
          <div style={{ position: "absolute", left: 262, top: 74 }}>
            <T size={30} mono color={C.secondary} style={{ marginBottom: 14, opacity: settle(clamp01((f - cue.card - 6) / 16)) }}>ACTION</T>
            <div style={{ opacity: settle(clamp01((f - cue.card - 10) / 18)), transform: `translateY(${(1 - settle(clamp01((f - cue.card - 10) / 18))) * 14}px)` }}>
              <T size={72} display><UL at={cue.password}>Bank password</UL></T>
              <T size={52} display weight={700} color={C.text} style={{ marginTop: 14 }}><span style={{ color: C.trust }}>→</span> kisi <UL at={cue.aiAgent}>AI agent</UL> ko nahi</T>
            </div>
          </div>
        </div>
      </Panel>
    </Obj>
  );
};

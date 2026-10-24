import React from "react";
import { C, FONT } from "../theme";
import { useFrame } from "../clock";
import { clamp01, smooth } from "../motion";
import { settle } from "../easing";
import { Local, Stroke, arc, circle, cross, check } from "../components/draw";
import { Panel, T } from "../components/art";
import { Obj, useCam } from "../world";
import { stationAt } from "../components/map";
import { cue } from "../cues/s06";

const Row: React.FC<{ n: number; at: number; y: number; children: React.ReactNode }> = ({ n, at, y, children }) => {
  const f = useFrame(), p = settle(clamp01((f - at) / 20));
  return (
    <div style={{ position: "absolute", left: 40, top: y, display: "flex", alignItems: "center", gap: 26, opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}>
      <div style={{ width: 62, height: 62, borderRadius: 31, border: `3px solid ${C.trust}`, color: C.trust, fontFamily: FONT.mono, fontWeight: 700, fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>{n}</div>
      {children}
    </div>
  );
};
/** S6: the action card on the package station: 1. version check (1.107.0 x)  2. rotate all keys */
export const S6World: React.FC = () => {
  const f = useFrame(), cam = useCam();
  if (f < cue.card - 4 || f > cue.beaconGreen + 400) return null;
  const shell = 1 - smooth(1.7, 5.0, cam.s);
  const x = settle(clamp01((f - cue.cross) / 14)), spin = f >= cue.morph ? ((f - cue.morph) * 7) % 360 : 0;
  return (
    <Obj at={stationAt(4)} r={760} art z={3}>
      <div style={{ opacity: shell }}>
        <Panel x={0} y={340} w={920} h={300} at={cue.card} tone="trust">
          <div style={{ position: "absolute", left: 0, top: 0, width: 920, height: 300 }}>
            <Row n={1} at={cue.line1} y={52}>
              <T size={58} display>Version check</T>
              <div style={{ marginLeft: 12, opacity: x, display: "flex", alignItems: "center", gap: 16 }}>
                <T size={36} mono color={C.alarm} style={{ textDecoration: "line-through", textDecorationThickness: 3 }}>1.107.0</T>
                <svg width={44} height={44} viewBox="-22 -22 44 44" style={{ overflow: "visible" }}><Stroke d={cross(0, 0, 32)} at={cue.cross} frames={14} color={C.alarm} w={5} /></svg>
              </div>
            </Row>
            <Row n={2} at={cue.line2} y={168}>
              <T size={58} display>Saari keys rotate karo</T>
              <svg width={56} height={56} viewBox="-28 -28 56 56" style={{ overflow: "visible", marginLeft: 8, opacity: smooth(cue.morph - 4, cue.morph + 8, f) }}>
                <g transform={`rotate(${spin})`}><Stroke d={arc(0, 0, 20, -30, 240)} p={1} color={C.trust} w={4} /><Stroke d="M14 -30L24 -14L8 -14Z" p={1} color={C.trust} w={3} fill={C.trust} /></g>
              </svg>
            </Row>
          </div>
        </Panel>
      </div>
    </Obj>
  );
};

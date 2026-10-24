import React from "react";
import { AbsoluteFill } from "remotion";
import { C, STATION, StationNo } from "../theme";
import { useFrame } from "../clock";
import { clamp01, smooth } from "../motion";
import { Canvas, Stroke, circle } from "../components/draw";
import { Pill } from "../components/pill";
import { Pop } from "../motion";
import { CAMERA, START } from "../timeline";
import { project } from "../world";
import { cue } from "../cues/s13";

const ITEMS: { n: StationNo; at: number; text: string; side: "below" | "left" }[] = [
  { n: 5, at: cue.khatra, text: "AI AGENT = KHATRA", side: "below" },
  { n: 4, at: cue.target, text: "AI TOOL = TARGET", side: "left" },
  { n: 1, at: cue.chowkidaar, text: "AI-ERA RESEARCH = CHOWKIDAAR", side: "left" },
];
/** S13 in screen space (positions follow the camera): a thin white ring on each highlighted station, exactly on its word, and its pill */
export const S13Screen: React.FC = () => {
  const f = useFrame();
  const out = START.S14 + 12;
  if (f < cue.khatra - 20 || f > out + 24) return null;
  const cam = CAMERA.at(f), o = smooth(out, out + 14, f);
  return (
    <AbsoluteFill style={{ opacity: 1 - o, filter: o > 0 ? `blur(${o * 8}px)` : undefined, pointerEvents: "none" }}>
      <Canvas>{ITEMS.map((it) => { const p = project(cam, STATION[it.n].x, STATION[it.n].y, 1); return <Stroke key={it.n} d={circle(p.sx, p.sy, 62)} at={it.at - 14} frames={26} color={C.text} w={2.5} glow="rgba(245,245,247,0.35)" />; })}</Canvas>
      {ITEMS.map((it) => {
        const p = project(cam, STATION[it.n].x, STATION[it.n].y, 1), pw = it.text.length * 17.9 + 58;
        const x = it.side === "below" ? p.sx : p.sx - 62 - 16 - pw / 2, y = it.side === "below" ? p.sy + 108 : p.sy;
        return <div key={it.n} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)" }}><Pop at={it.at}><Pill size={28} style={{ background: "rgba(10,10,12,0.78)", borderColor: C.text }}>{it.text}</Pill></Pop></div>;
      })}
    </AbsoluteFill>
  );
};

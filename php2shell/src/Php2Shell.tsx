import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import "./fonts";
import { C, DISSOLVE } from "./theme";
import { SCENES, cameraAt, shakeAt, trustAt } from "./timeline";
import { useFrame } from "./clock";
import { clamp01, easeInOutCubic } from "./motion";
import { Background } from "./components/background";
import { Captions } from "./components/captions";
import { S1 } from "./scenes/S01"; import { S2 } from "./scenes/S02"; import { S3 } from "./scenes/S03"; import { S4 } from "./scenes/S04"; import { S5 } from "./scenes/S05";
import { S6 } from "./scenes/S06"; import { S7 } from "./scenes/S07"; import { S8 } from "./scenes/S08"; import { S9 } from "./scenes/S09"; import { S10 } from "./scenes/S10";
import { S11 } from "./scenes/S11"; import { S12 } from "./scenes/S12"; import { S13 } from "./scenes/S13";

const SCENE_COMPONENTS: Record<string, React.FC> = { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13 };

/**
 * One scene's layer. It lives from `from` (6 frames before the scene's first word) to `to` (the next scene's layer + 9 frames). The incoming layer
 * fades in over 9 frames with an ADDITIVE blend, so a shape that is drawn identically in both scenes (a match cut) neither dips nor doubles; the outgoing
 * layer blurs and fades out over the same 9 frames ("blur + fade 0.3 s"). No hard cuts.
 */
const Layer: React.FC<{ from: number; to: number; first?: boolean; last?: boolean; children: React.ReactNode }> = ({ from, to, first, last, children }) => {
  const f = useFrame();
  if (f < from || (!last && f >= to)) return null;
  const inP = first ? 1 : easeInOutCubic(clamp01((f - from) / DISSOLVE));
  const outP = last ? 0 : easeInOutCubic(clamp01((f - (to - DISSOLVE)) / DISSOLVE));
  const settled = inP >= 1 && outP === 0;
  return <AbsoluteFill style={{ opacity: settled ? undefined : inP * (1 - outP), filter: outP > 0 ? `blur(${outP * 8}px)` : undefined, mixBlendMode: inP < 1 ? "plus-lighter" : undefined }}>{children}</AbsoluteFill>;
};

export type Php2ShellProps = { mode?: "full" | "bg"; captions?: boolean; audio?: boolean };

export const Php2Shell: React.FC<Php2ShellProps> = ({ mode = "full", captions = true, audio = true }) => {
  const f = useFrame();
  const sh = shakeAt(f), s = cameraAt(f);
  return (
    <AbsoluteFill style={{ background: C.black }}>
      {audio && <Audio src={staticFile("mix.wav")} />}
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${s})`, transformOrigin: "50% 50%" }}>
        <Background trust={trustAt(f)} />
        {mode === "full" && SCENES.map((sc, i) => { const Scene = SCENE_COMPONENTS[sc.id]; return <Layer key={sc.id} from={sc.from} to={sc.to} first={i === 0} last={i === SCENES.length - 1}><Scene /></Layer>; })}
      </AbsoluteFill>
      {mode === "full" && captions && <Captions />}
    </AbsoluteFill>
  );
};

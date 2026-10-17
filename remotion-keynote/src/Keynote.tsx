import React from "react";
import { AbsoluteFill } from "remotion";
import "./fonts";
import { C, FPS, TRANSITION } from "./theme";
import { cameraAt, darkAt, DARK_FRAMES, sceneStart } from "./cues";
import { frameOf } from "./anchors";
import { useFrame, useT } from "./clock";
import { clamp01, easeInOutCubic } from "./motion";
import { Background } from "./components/Background";
import { Captions } from "./components/Captions";
import { Mix } from "./audio";
import { Stage12 } from "./scenes/Stage12";
import { Calculator } from "./scenes/Calculator";
import { OneMore } from "./scenes/OneMore";
import { Terminal } from "./scenes/Terminal";
import { Statement } from "./scenes/Statement";
import { Cta } from "./scenes/Cta";

/** One scene's layer: a blur-dissolve in at `from`, a blur-dissolve out ending at `to` (never a hard cut). */
const Layer: React.FC<{ from: number; to: number; enterFrames?: number; exitFrames?: number; first?: boolean; last?: boolean; children: React.ReactNode }> = ({ from, to, enterFrames = TRANSITION, exitFrames = TRANSITION, first, last, children }) => {
  const frame = useFrame();
  const f0 = frameOf(from), f1 = frameOf(to);
  if (frame < f0 || (!last && frame >= f1)) return null;
  const inP = first ? 1 : easeInOutCubic(clamp01((frame - f0) / enterFrames));
  const outP = last ? 0 : easeInOutCubic(clamp01((frame - (f1 - exitFrames)) / exitFrames));
  const k = inP * (1 - outP), blur = (1 - inP) * 14 + outP * 14, settled = inP >= 0.999 && outP === 0;
  // settled: no opacity, no filter, so the glass inside can blur what is behind it
  return <AbsoluteFill style={{ opacity: settled ? undefined : k, filter: settled ? undefined : `blur(${blur}px)` }}>{children}</AbsoluteFill>;
};

export type KeynoteProps = { mode: "full" | "bg"; captions?: boolean; audio?: boolean };

export const Keynote: React.FC<KeynoteProps> = ({ mode, captions = true, audio = true }) => {
  const t = useT();
  const S = (i: number) => sceneStart(i);
  const D = DARK_FRAMES / FPS;
  return (
    <AbsoluteFill style={{ background: C.canvas }}>
      {audio && <Mix />}
      <AbsoluteFill style={{ transform: `scale(${cameraAt(t)})`, transformOrigin: "50% 50%" }}>
        <Background dark={darkAt(t)} />
        {mode === "full" && (
          <>
            <Layer from={0} to={S(2) + TRANSITION / FPS} first><Stage12 /></Layer>
            <Layer from={S(2)} to={S(3) + D} exitFrames={DARK_FRAMES}><Calculator /></Layer>
            <Layer from={S(3) + 0.25} to={S(4) + 8 / FPS} enterFrames={8} exitFrames={8}><OneMore /></Layer>
            <Layer from={S(4)} to={S(5) + TRANSITION / FPS}><Terminal /></Layer>
            <Layer from={S(5)} to={S(6) + TRANSITION / FPS}><Statement /></Layer>
            <Layer from={S(6)} to={S(6) + 99} last><Cta /></Layer>
          </>
        )}
      </AbsoluteFill>
      {mode === "full" && captions && <Captions />}
    </AbsoluteFill>
  );
};

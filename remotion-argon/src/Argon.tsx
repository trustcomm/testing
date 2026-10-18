import React from "react";
import { AbsoluteFill } from "remotion";
import "./fonts";
import { C, TRANSITION } from "./theme";
import { cameraAt, dimAt, sceneStart } from "./cues";
import { frameOf } from "./anchors";
import { useFrame, useT } from "./clock";
import { clamp01, easeInOutCubic } from "./motion";
import { Background } from "./components/Background";
import { Captions } from "./components/Captions";
import { Credit } from "./components/Credit";
import { Mix } from "./audio";
import { Stage123 } from "./scenes/Stage123";
import { Twist } from "./scenes/Twist";
import { Decide } from "./scenes/Decide";
import { Test } from "./scenes/Test";
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

export type ArgonProps = { mode: "full" | "bg"; captions?: boolean; credit?: boolean; audio?: boolean };

export const Argon: React.FC<ArgonProps> = ({ mode, captions = true, credit = true, audio = true }) => {
  const t = useT();
  const S = (i: number) => sceneStart(i);
  const D = TRANSITION / 30;
  return (
    <AbsoluteFill style={{ background: C.canvas }}>
      {audio && <Mix />}
      <AbsoluteFill style={{ transform: `scale(${cameraAt(t)})`, transformOrigin: "50% 50%" }}>
        <Background dim={dimAt(t) * 0.6} />
        {mode === "full" && (
          <>
            {/* the twist: S1-S3 dissolve out in 8 frames, then a 6-frame hold on the dimmed canvas before "THE TWIST" */}
            <Layer from={0} to={S(3) + 8 / 30} exitFrames={8} first><Stage123 /></Layer>
            <Layer from={S(3) + 8 / 30} to={S(4) + D} enterFrames={2}><Twist /></Layer>
            <Layer from={S(4)} to={S(6) + D}><Decide /></Layer>
            <Layer from={S(6)} to={S(7) + D}><Test /></Layer>
            <Layer from={S(7)} to={S(7) + 99} last><Cta /></Layer>
          </>
        )}
      </AbsoluteFill>
      {mode === "full" && credit && <Credit />}
      {mode === "full" && captions && <Captions />}
    </AbsoluteFill>
  );
};

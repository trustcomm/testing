import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import "./fonts";
import { C } from "./theme";
import { useFrame } from "./clock";
import { BLUR } from "./timeline";
import { Background, Vignette } from "./components/background";
import { Captions } from "./components/captions";
import { Hud } from "./components/hud";
import { Grid, Routes, Beacons, StationIcons } from "./components/map";
import { World, MotionBlur } from "./world";
import { S1Screen } from "./scenes/S01";
import { S2Screen } from "./scenes/S02";
import { S3World } from "./scenes/S03";
import { S4World } from "./scenes/S04";
import { S5World } from "./scenes/S05";
import { S6World } from "./scenes/S06";
import { S7World } from "./scenes/S07";
import { S8World } from "./scenes/S08";
import { S9World } from "./scenes/S09";
import { S10World } from "./scenes/S10";
import { S11World, S11Screen } from "./scenes/S11";
import { S12World } from "./scenes/S12";
import { S13Screen } from "./scenes/S13";
import { S14Screen } from "./scenes/S14";
import { S15Screen } from "./scenes/S15";

/** routes: false hides the map's grid and the dotted route paths (they run off the frame on purpose); only scripts/layout.mjs turns it off */
export type Alarm5Props = { mode?: "full" | "bg"; captions?: boolean; audio?: boolean; routes?: boolean };

/** the world layers (they move with the camera; motion-blurred while it moves fast) */
const WorldLayers: React.FC<{ routes: boolean }> = ({ routes }) => (
  <World>
    {routes && <Grid />}
    {routes && <Routes />}
    <StationIcons />
    <Beacons />
    <S3World />
    <S4World />
    <S5World />
    <S6World />
    <S7World />
    <S8World />
    <S9World />
    <S10World />
    <S11World />
    <S12World />
  </World>
);
/** the screen layers (never touched by the camera: headlines, numerals, HUD, captions) */
const ScreenLayers: React.FC = () => (
  <>
    <S1Screen />
    <S2Screen />
    <S11Screen />
    <S13Screen />
    <S14Screen />
    <S15Screen />
  </>
);

export const Alarm5: React.FC<Alarm5Props> = ({ mode = "full", captions = true, audio = true, routes = true }) => {
  useFrame();
  return (
    <AbsoluteFill style={{ background: C.black }}>
      {audio && <Audio src={staticFile("mix.wav")} />}
      {/* the background is part of every motion-blur sample: each sample is then an opaque picture and their running average is exact */}
      {mode === "bg" && <Background />}
      {mode === "full" && <MotionBlur extra={BLUR}><Background /><WorldLayers routes={routes} /></MotionBlur>}
      {mode === "full" && <ScreenLayers />}
      {mode === "full" && <Hud />}
      <Vignette />
      {mode === "full" && captions && <Captions />}
    </AbsoluteFill>
  );
};

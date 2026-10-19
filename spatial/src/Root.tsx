import React from "react";
import { AbsoluteFill, Composition, useCurrentFrame } from "remotion";
import { DURATION, FPS, SCENES, sceneOf } from "./timeline";

// Scaffold only: a black frame with the frame counter and scene id. The scenes are built one at a time (WORK PLAN step 4).
const Placeholder: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: "#0B0D10", color: "#EAF2FF", fontFamily: "monospace", fontSize: 28, padding: 60 }}>{sceneOf(f)} · {SCENES.find((s) => s.id === sceneOf(f))?.name}<br />frame {f} / {DURATION}</AbsoluteFill>;
};
export const Root: React.FC = () => (
  <>
    <Composition id="Spatial9x16" component={Placeholder} width={1080} height={1920} fps={FPS} durationInFrames={DURATION} />
    <Composition id="Spatial16x9" component={Placeholder} width={1920} height={1080} fps={FPS} durationInFrames={DURATION} />
  </>
);

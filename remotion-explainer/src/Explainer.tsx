import React from "react";
import { AbsoluteFill } from "remotion";
import "./fonts";
import { C } from "./theme";
import { SCENE_IDS, sceneEnd, sceneStart } from "./cues";
import { SceneShell, ModeContext } from "./components/SceneShell";
import { Captions } from "./components/Captions";
import { Mix } from "./audio";
import { Hook } from "./scenes/Hook";
import { Problem } from "./scenes/Problem";
import { Fix1 } from "./scenes/Fix1";
import { Fix2 } from "./scenes/Fix2";
import { Fix3 } from "./scenes/Fix3";
import { Reveal } from "./scenes/Reveal";
import { Cta } from "./scenes/Cta";

type Scene = React.FC<{ end: number }>;
// the scenes, in order, and where the radial glow sits behind each one's hero object
const SCENES: { id: (typeof SCENE_IDS)[number]; Component: Scene; glow: { x: number; y: number; color?: string } }[] = [
  { id: "hook", Component: Hook, glow: { x: 540, y: 770 } },
  { id: "problem", Component: Problem, glow: { x: 540, y: 925, color: C.warn } },
  { id: "fix1", Component: Fix1, glow: { x: 540, y: 800 } },
  { id: "fix2", Component: Fix2, glow: { x: 540, y: 925 } },
  { id: "fix3", Component: Fix3, glow: { x: 540, y: 925 } },
  { id: "reveal", Component: Reveal, glow: { x: 540, y: 925 } },
  { id: "cta", Component: Cta, glow: { x: 540, y: 760 } },
];

export type ExplainerProps = { mode: "full" | "bg"; captions?: boolean; audio?: boolean };

export const Explainer: React.FC<ExplainerProps> = ({ mode, captions = true, audio = true }) => (
  <ModeContext.Provider value={mode}>
    <AbsoluteFill style={{ background: C.bg }}>
      {audio && <Mix />}
      {SCENES.map(({ id, Component, glow }, i) => (
        <SceneShell key={id} index={i} start={sceneStart(i)} end={sceneEnd(i)} glow={glow}>
          <Component end={sceneEnd(i)} />
        </SceneShell>
      ))}
      {mode === "full" && captions && <Captions />}
    </AbsoluteFill>
  </ModeContext.Provider>
);

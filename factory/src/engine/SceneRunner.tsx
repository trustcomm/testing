import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { SCENES } from "../scenes";
import type { ThemeMode } from "../brand/tokens";
import { Captions } from "./Captions";
import type { SceneT } from "./manifest";
import { findWordIndices } from "./pace";
import { SceneFrame } from "./SceneFrame";
import type { Word } from "./types";

/** Props of the "Scene" composition: one manifest scene + its planned timing. */
export type RenderSceneProps = {
  scene: SceneT;
  /** Caption-word timings in scene-local seconds (lead included). */
  words: Word[];
  durationInFrames: number;
  prevTheme: ThemeMode;
  channelName: string;
  showCaptions: boolean;
};

/** Resolves anchors to frames and renders SceneFrame + scene content + captions. */
export const SceneRunner: React.FC<RenderSceneProps> = ({ scene, words, prevTheme, channelName, showCaptions }) => {
  const { fps } = useVideoConfig();
  const mod = SCENES[scene.type];
  const captionText = scene.captions ?? scene.narration;
  const anchors = useMemo(() => {
    const scriptWords = captionText.split(/\s+/).filter(Boolean);
    const out: Record<string, number[]> = {};
    for (const [name, val] of Object.entries(scene.anchor ?? {})) {
      const list = Array.isArray(val) ? val : [val];
      out[name] = findWordIndices(scriptWords, list).map((i) => (i >= 0 && words[i] ? Math.round(words[i].start * fps) : -1));
    }
    return out;
  }, [scene.anchor, captionText, words, fps]);
  const voiceStart = words[0]?.start ?? 0.5;
  const voiceEnd = words[words.length - 1]?.end ?? voiceStart + 2;
  const C = mod.Component;
  return (
    <SceneFrame theme={scene.theme} prevTheme={prevTheme} wipeIn={scene.wipeIn}>
      <C
        id={scene.id}
        data={scene.data}
        narration={scene.narration}
        captions={captionText}
        words={words}
        anchors={anchors}
        theme={scene.theme}
        prevTheme={prevTheme}
        wipeIn={scene.wipeIn}
        showCaptions={showCaptions}
        channelName={channelName}
        voiceStart={voiceStart}
        voiceEnd={voiceEnd}
      />
      {showCaptions ? <Captions words={words} theme={scene.theme} /> : null}
    </SceneFrame>
  );
};

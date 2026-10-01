import React from "react";
import { Composition, getStaticFiles, staticFile, type CalculateMetadataFunction } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { parseTimestamps } from "./brand/timing";
import { canvas } from "./brand/tokens";
import { ByjusDemo, type ByjusDemoProps } from "./episodes/byjus/ByjusDemo";

const MIN_FRAMES = 900; // 30 s design length

/**
 * Reads what exists in public/: the VO length sets the duration (never shorter than 30 s),
 * vo-timestamps.json (if present) drives every cue, and missing audio files are skipped.
 */
const calculateMetadata: CalculateMetadataFunction<ByjusDemoProps> = async ({ props }) => {
  const available = getStaticFiles().map((f) => f.name);
  let durationInFrames = MIN_FRAMES;
  if (available.includes("vo.mp3")) {
    const seconds = await getAudioDurationInSeconds(staticFile("vo.mp3"));
    durationInFrames = Math.max(MIN_FRAMES, Math.ceil(seconds * canvas.fps) + 6);
  }
  let words = null;
  if (available.includes("vo-timestamps.json")) {
    const json = await fetch(staticFile("vo-timestamps.json")).then((r) => r.json());
    const parsed = parseTimestamps(json);
    words = parsed.length ? parsed : null;
  }
  return { durationInFrames, props: { ...props, available, words } };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ByjusDemo"
    component={ByjusDemo}
    width={canvas.width}
    height={canvas.height}
    fps={canvas.fps}
    durationInFrames={MIN_FRAMES}
    defaultProps={{ available: [], words: null, channelName: "[CHANNEL NAME]" }}
    calculateMetadata={calculateMetadata}
  />
);

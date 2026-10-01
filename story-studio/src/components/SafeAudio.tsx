import React from "react";
import { Html5Audio, Sequence, staticFile } from "remotion";

export type SafeAudioProps = {
  /** Path inside public/, e.g. "sfx/tick.mp3". */
  src: string;
  /** Files known to exist in public/ (from calculateMetadata → getStaticFiles()). */
  available: string[];
  /** Frame to start on. */
  from?: number;
  /** Optional length in frames. */
  durationInFrames?: number;
  /** 0–1 volume, or a per-frame function. */
  volume?: number | ((f: number) => number);
};

/** An <Audio> slot that silently renders nothing if the file is missing, so renders never break. */
export const SafeAudio: React.FC<SafeAudioProps> = ({ src, available, from = 0, durationInFrames, volume = 1 }) => {
  if (!available.includes(src)) return null;
  return (
    <Sequence from={from} durationInFrames={durationInFrames} layout="none">
      <Html5Audio src={staticFile(src)} volume={volume} />
    </Sequence>
  );
};

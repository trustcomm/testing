import React from "react";
import { Composition } from "remotion";
import { Argon, ArgonProps } from "./Argon";
import { FPS, H, W } from "./theme";
import { totalFrames } from "./anchors";

// The length is the voiceover's: ffprobe's duration of public/vo.mp3 (stored by scripts/timings.py as audioDuration) + 0.5 s,
// rounded up to a whole frame. (The browser's own MP3 decode reads a few milliseconds short, which would cut the last frame.)
export const Root: React.FC = () => (
  <Composition id="Argon" component={Argon} width={W} height={H} fps={FPS} durationInFrames={totalFrames()} defaultProps={{ mode: "full" } as ArgonProps} />
);

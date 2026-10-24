import React from "react";
import { Composition } from "remotion";
import { Alarm5, Alarm5Props } from "./Alarm5";
import { FPS, H, W } from "./theme";
import { TOTAL } from "./timeline";

// The length is the voiceover's: ffprobe's duration of public/vo.mp3 (stored in timings.json) + 0.4 s of silence in front + 0.4 s after = vo + 0.8 s, rounded up to a whole frame, at 60 fps.
export const Root: React.FC = () => (
  <Composition id="Alarm5" component={Alarm5} width={W} height={H} fps={FPS} durationInFrames={TOTAL} defaultProps={{ mode: "full" } as Alarm5Props} />
);

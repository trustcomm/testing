import React from "react";
import { Composition } from "remotion";
import { Php2Shell, Php2ShellProps } from "./Php2Shell";
import { FPS, H, W } from "./theme";
import { TOTAL } from "./timeline";

// The length is the voiceover's: ffprobe's duration of public/vo.mp3 (stored in timings.json) + 0.4 s of silence in front + 0.4 s after = vo + 0.8 s, rounded up to a whole frame.
export const Root: React.FC = () => (
  <Composition id="Php2Shell" component={Php2Shell} width={W} height={H} fps={FPS} durationInFrames={TOTAL} defaultProps={{ mode: "full" } as Php2ShellProps} />
);

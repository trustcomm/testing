import React from "react";
import { Composition, staticFile } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { Explainer, ExplainerProps } from "./Explainer";
import { FPS, H, W } from "./theme";
import { durationInFrames } from "./timing";

export const Root: React.FC = () => (
  <Composition
    id="Explainer"
    component={Explainer}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={durationInFrames()}
    defaultProps={{ mode: "full" } as ExplainerProps}
    // the video is exactly as long as the voiceover
    calculateMetadata={async () => ({ durationInFrames: durationInFrames(await getAudioDurationInSeconds(staticFile("vo.mp3"))) })}
  />
);

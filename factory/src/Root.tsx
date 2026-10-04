import React from "react";
import { Composition, type CalculateMetadataFunction } from "remotion";
import { canvas } from "./brand/tokens";
import { EmptyFrame } from "./engine/EmptyFrame";
import { SceneRunner, type RenderSceneProps } from "./engine/SceneRunner";

/** The pipeline renders each scene through this composition; duration comes from the props (plan step). */
const sceneMetadata: CalculateMetadataFunction<RenderSceneProps> = ({ props }) => ({
  durationInFrames: Math.max(1, props.durationInFrames),
});

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Scene"
      component={SceneRunner}
      width={canvas.width}
      height={canvas.height}
      fps={canvas.fps}
      durationInFrames={150}
      calculateMetadata={sceneMetadata}
      defaultProps={
        {
          scene: {
            id: "s010",
            type: "verdict",
            narration: "Demo verdict scene for the studio preview.",
            theme: "ink",
            wipeIn: false,
            anchor: {},
            sfx: [],
            data: { word: "DEMO" },
          },
          words: [],
          durationInFrames: 150,
          prevTheme: "paper",
          channelName: "[CHANNEL NAME]",
          showCaptions: true,
        } as RenderSceneProps
      }
    />
    <Composition
      id="EmptyFrame"
      component={EmptyFrame}
      width={canvas.width}
      height={canvas.height}
      fps={canvas.fps}
      durationInFrames={1}
      defaultProps={{ theme: "paper" as const, guides: false }}
    />
  </>
);

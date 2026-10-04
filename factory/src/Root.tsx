import React from "react";
import { Composition } from "remotion";
import { canvas } from "./brand/tokens";
import { EmptyFrame } from "./engine/EmptyFrame";

export const RemotionRoot: React.FC = () => (
  <>
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

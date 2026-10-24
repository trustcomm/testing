// Keys: the stolen secrets of station #4 (S5, S6). A key is a round bow, a shaft and two teeth, in the 3 px line art.
import React from "react";
import { C } from "../theme";
import { Stroke, circle, line } from "./draw";
import { useScale } from "./draw";

export const KeyIcon: React.FC<{ x: number; y: number; s?: number; deg?: number; at: number; color?: string; opacity?: number; frames?: number; glow?: string }> = ({ x, y, s = 1, deg = 0, at, color = C.text, opacity = 1, frames = 20, glow }) => (
  <g transform={`translate(${x} ${y}) rotate(${deg}) scale(${s})`} opacity={opacity}>
    <Stroke d={circle(-38, 0, 24)} at={at} frames={frames} color={color} glow={glow} w={3 / s} />
    <Stroke d={line(-14, 0, 60, 0)} at={at + 3} frames={frames} color={color} glow={glow} w={3 / s} />
    <Stroke d={line(40, 0, 40, 18)} at={at + 6} frames={Math.round(frames * 0.6)} color={color} w={3 / s} />
    <Stroke d={line(58, 0, 58, 13)} at={at + 8} frames={Math.round(frames * 0.6)} color={color} w={3 / s} />
  </g>
);

/** wraps content authored at `scale` of its parent (an object's inner world seen only when the camera dives in): strokes stay 3 px on screen */
export const Inner: React.FC<{ x: number; y: number; scale: number; opacity?: number; children: React.ReactNode }> = ({ x, y, scale, opacity = 1, children }) => {
  const k = useScale();
  return (
    <ScaleProvider value={k * scale}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transform: `translate(${x}px, ${y}px) scale(${scale})`, transformOrigin: "0 0", opacity }}>{children}</div>
    </ScaleProvider>
  );
};
import { ScaleCtx } from "./draw";
const ScaleProvider = ScaleCtx.Provider;

// A server rack outline, shared by S7 (the houses morph into racks) and S8 (the hacker walks past the login; the racks turn red). Draw inside <Canvas>.
// The "server hall" is the contract between S7 and S8: S7 ends with these six racks, S8 starts with the same six racks in the same places.
import React from "react";
import { C } from "../theme";
import { Stroke, circle, line, rrect } from "./draw";

export const HALL = { top: 470, h: 600, w: 110, xs: [180, 324, 468, 612, 756, 900] } as const;   // six racks, like the six houses they morph from

export const ServerRack: React.FC<{
  x: number;                 // centre x
  top?: number; w?: number; h?: number;
  p?: number;                // write-on progress 0..1
  at?: number; frames?: number;
  color?: string;            // stroke colour (white, or red for the S8 wave)
  led?: string;              // LED colour (defaults to `color`)
  glow?: string; opacity?: number;
  slots?: number;
}> = ({ x, top = HALL.top, w = HALL.w, h = HALL.h, p, at, frames, color = C.text, led, glow, opacity = 1, slots = 6 }) => {
  const sx = x - w / 2, gap = h / slots, props = { p, at, frames, color, glow, opacity } as const;
  return (
    <g>
      <Stroke d={rrect(sx, top, w, h, 14)} {...props} />
      {Array.from({ length: slots - 1 }, (_, i) => <Stroke key={i} d={line(sx, top + gap * (i + 1), sx + w, top + gap * (i + 1))} {...props} />)}
      {Array.from({ length: slots }, (_, i) => <Stroke key={`l${i}`} d={circle(sx + 22, top + gap * (i + 0.5), 4)} {...props} color={led ?? color} fill={led ?? color} />)}
      {Array.from({ length: slots }, (_, i) => <Stroke key={`v${i}`} d={line(sx + w - 54, top + gap * (i + 0.5), sx + w - 18, top + gap * (i + 0.5))} {...props} />)}
    </g>
  );
};

// A shield icon (S9: the "fix" blinks in at the top-left of the gauge; S10: the first fact card). Local coordinates: centre (0, 0), about 100 x 120.
import React from "react";
import { C } from "../theme";
import { Stroke, check } from "./draw";

export const SHIELD_PATH = "M0 -60L48 -42L48 8C48 34 26 52 0 62C-26 52 -48 34 -48 8L-48 -42Z";
export const SHIELD_CHECK = check(0, 2, 56);

/** the shield outline (and its check) written on in the local frame; `p` / `pc` are the write-on progress of the outline and the check */
export const ShieldGlyph: React.FC<{ p?: number; pc?: number; color?: string; fill?: string; glow?: string; opacity?: number }> = ({ p = 1, pc = 0, color = C.text, fill = "none", glow, opacity = 1 }) => (
  <g style={{ filter: glow ? `drop-shadow(0 0 10px ${glow})` : undefined }}>
    <Stroke d={SHIELD_PATH} p={p} color={color} fill={fill} opacity={opacity} />
    {pc > 0 && <Stroke d={SHIELD_CHECK} p={pc} color={color} opacity={opacity} />}
  </g>
);

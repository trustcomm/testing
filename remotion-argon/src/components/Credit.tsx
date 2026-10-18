import React from "react";
import { C, CREDIT_Y, FONT } from "../theme";
import { CUE, DATA, sceneStart } from "../cues";
import { At, Enter } from "../motion";

/** The source credit: small, secondary, under the captions at the bottom of the safe area. In from the two tracks, out as the twist ends. */
export const Credit: React.FC = () => (
  <At x={540} y={CREDIT_Y} style={{ width: 1000, textAlign: "center" }}>
    <Enter at={CUE.s1.tracks} dy={10} blur={4} until={sceneStart(4)}>
      <div style={{ fontFamily: FONT.ui, fontWeight: 500, fontSize: 28, letterSpacing: "0.01em", color: C.secondary, whiteSpace: "nowrap" }}>{DATA.credit}</div>
    </Enter>
  </At>
);

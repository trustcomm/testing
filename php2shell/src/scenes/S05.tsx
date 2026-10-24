import React from "react";
import { CUES } from "../timeline";
import { useFrame } from "../clock";
import { At, Pop } from "../motion";
import { Pill } from "../components/pill";
import { toScreen } from "../components/b-geom";
import { BWorld, GROUND, camAt } from "../components/b-world";

/**
 * S5 "Ab samjho, hua kya. Mumbai ka dabbawala. Roz hazaaron tiffin, ek ghar se doosre ghar."
 * Dots drift in (S4 ended in dust), the ground line and the dabbawala write on; on "dabbawala" his cap fills white, a bicycle bell, the pill springs in.
 * On "hazaaron" the camera pulls wide: six tiny houses, dotted arcs, and a ripple of tiffins hopping from house to house (all in b-world.tsx).
 */
export const S5: React.FC = () => {
  const f = useFrame(), c = CUES.S5.cue, [x, y] = toScreen(camAt(f), 540, GROUND + 58);
  return (
    <>
      <BWorld />
      <At x={x} y={y}><Pop at={c.hit}><Pill size={28}>DABBAWALA</Pill></Pop></At>
    </>
  );
};

import React from "react";
import { C, FONT } from "../theme";
import { CUES } from "../timeline";
import { useFrame } from "../clock";
import { At, Pop } from "../motion";
import { Pill } from "../components/pill";
import { KWord } from "../components/kinetic";
import { BWorld, heroPose } from "../components/b-world";

/**
 * S6 "Socho ek tiffin wapas aata hai... aur uske andar pichhle ghar ki chaabi reh gayi. Agla aadmi dabba kholta hai... aur chaabi uske haath mein."
 * The camera follows ONE tiffin back along its arc (b-world.tsx); on "chaabi" the lid opens slightly and an X-ray shows a red key inside; a second person lifts the
 * lid on "kholta"; the red key floats up into his hand on "haath": eyes widen, a small red "!" (all in b-world.tsx except the pill and the "!").
 */
export const S6: React.FC = () => {
  const f = useFrame(), c = CUES.S6.cue, p = heroPose(f), top = p.person.top;
  return (
    <>
      <BWorld />
      <At x={540} y={1255}>
        <Pop at={c.pill}>
          <Pill tone="danger" size={28} style={{ background: "rgba(255,59,48,0.08)", boxShadow: "0 0 28px rgba(255,59,48,0.18)" }}>PICHHLE GHAR KI <KWord at={c.chaabi} underline="danger">CHAABI</KWord></Pill>
        </Pop>
      </At>
      <At x={top[0] + 14} y={top[1] - 84}>
        <Pop at={c.keyHand} from={0.3}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 190, lineHeight: 1, color: C.alarm, textShadow: "0 0 34px rgba(255,59,48,0.7)" }}>!</div>
        </Pop>
      </At>
    </>
  );
};

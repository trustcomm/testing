import React from "react";
import { C, FPS, STAGGER } from "../theme";
import { CUE } from "../cues";
import { At, Headline, Pill, Pop, clamp01, outCubic, useT } from "../components/motion";
import { Check } from "../components/icons";
import { Phone, ProfileScreen } from "../components/Phone";

export const BIO = "Claude builds it. I give you the prompt.";

/** 4. FIX 2: "ONE-LINE PROMISE": an Instagram profile whose bio types out while it is said, then a green tick. */
export const Fix2: React.FC<{ end: number }> = ({ end }) => {
  const t = useT(); const c = CUE.fix2, st = STAGGER / FPS;
  const typed = Math.floor(BIO.length * clamp01((t - c.typing[0]) / (c.typing[1] - c.typing[0])));
  const typing = t >= c.typing[0] && typed < BIO.length;
  const caret = typing || Math.floor(t * 3) % 2 === 0;
  const tick = clamp01((t - c.tick) / 0.25);
  return (
    <>
      <Pill num="03" label="FIX" at={c.pill} until={end} />
      <Headline size={102} top={342} until={end} lines={[
        [{ text: "ONE-LINE", at: c.headline }],
        [{ text: "PROMISE", at: c.headline + st, hl: c.hl }],
      ]} />
      <At x={540} y={925}>
        <Pop at={c.phone} until={end} from={0.7} dy={60}><Phone><ProfileScreen bio={BIO} typed={typed} caret={caret} /></Phone></Pop>
      </At>
      <At x={790} y={835}>
        <Pop at={c.tick} until={end} from={0.2}>
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: `${C.ok}26`, border: `5px solid ${C.ok}`, boxShadow: `0 0 60px ${C.ok}88`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Check size={72} color={C.ok} draw={outCubic(tick)} />
          </div>
        </Pop>
      </At>
    </>
  );
};

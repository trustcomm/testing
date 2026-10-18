import React from "react";
import { C, FONT, FPS } from "../theme";
import { CUE } from "../cues";
import { At, Enter, clamp01, easeOutCubic, lerp, smooth, useSpring } from "../motion";
import { useT } from "../clock";
import { Glass } from "../components/glass";
import { Coin, Lens, Stopwatch } from "./icons";
import { HEAD, SERIF } from "./text";

const CHIPS = [{ text: "Same prompt", w: 330 }, { text: "1 try", w: 190 }, { text: "3 scores", w: 260 }] as const;
const GAP = 24, ROW_W = CHIPS.reduce((a, c) => a + c.w, 0) + GAP * (CHIPS.length - 1);
const CARD = { w: 290, h: 340 }, CARD_X = [220, 540, 860], CARD_Y = 1100;

/** A blank score dial: a dashed ring that draws itself, "– / 10" inside. The viewer fills it in. */
const Dial: React.FC<{ at: number }> = ({ at }) => {
  const t = useT(), p = easeOutCubic(clamp01((t - at) / 0.6));
  return (
    <svg width={196} height={196} viewBox="0 0 196 196" style={{ overflow: "visible" }}>
      <circle cx={98} cy={98} r={84} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={12} />
      <circle cx={98} cy={98} r={84} fill="none" stroke={C.accent} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray="0.012 0.04" strokeDashoffset={1 - p} transform="rotate(-90 98 98)" opacity={p > 0 ? 1 : 0} />
      <text x={98} y={113} textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize={44} letterSpacing="-0.03em" fill={C.text}>– / 10</text>
    </svg>
  );
};

/** 7. "Par yeh sirf ek test hai." n = 1 → a chip; "Apna khud ka karo."; the three constraints; three blank score cards on their words. */
export const Test: React.FC = () => {
  const t = useT(), c = CUE.s7;
  const s = clamp01(useSpring(c.nOut));                     // n = 1 shrinks into a chip at the top
  const word = (text: string, at: number) => <Enter at={at} dy={34} blur={10}>{text}</Enter>;
  const cards = [{ label: "Detail", Icon: Lens, at: c.detail }, { label: "Time", Icon: Stopwatch, at: c.time }, { label: "Cost", Icon: Coin, at: c.cost }];
  let x0 = (1080 - ROW_W) / 2;
  const chipX = CHIPS.map((ch) => { const x = x0 + ch.w / 2; x0 += ch.w + GAP; return x; });
  return (
    <>
      {/* n = 1: large on "ek", then it settles into a chip */}
      <At x={540} y={lerp(680, 360, s)}>
        <Enter at={c.ekTest} dy={40} blur={12}>
          <div style={{ position: "relative", width: 360, height: 112, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, opacity: smooth(0.2, 1, s) }}><Glass w={360} h={112} r={56}><div /></Glass></div>
            <div style={{ ...SERIF, position: "relative", fontSize: 100, whiteSpace: "nowrap", transform: `scale(${lerp(3.3, 1, s)})`, paddingBottom: 6 }}>n = 1</div>
          </div>
        </Enter>
      </At>
      <At x={540} y={930}>
        <Enter at={c.test} dy={20} until={c.nOut + 0.3}><div style={{ fontFamily: FONT.ui, fontWeight: 600, fontSize: 52, color: C.secondary, whiteSpace: "nowrap" }}>just one test</div></Enter>
      </At>

      {/* the headline */}
      <At x={540} y={590} style={{ width: 980, textAlign: "center" }}>
        <div style={{ ...HEAD, fontSize: 168, display: "flex", justifyContent: "center", gap: "0.22em" }}>{word("Apna", c.apna)}{word("khud", c.khud)}</div>
        <div style={{ ...SERIF, fontSize: 168, display: "flex", justifyContent: "center", gap: "0.22em", marginTop: 8 }}>{word("ka", c.ka)}{word("karo.", c.karo)}</div>
      </At>

      {/* same prompt · 1 try · 3 scores */}
      {CHIPS.map((ch, i) => (
        <At key={ch.text} x={chipX[i]} y={830}>
          <Enter at={[c.same, c.ek, c.teen][i]} dy={22}>
            <Glass w={ch.w} h={84} r={42}><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.ui, fontWeight: 600, fontSize: 42, color: C.text, whiteSpace: "nowrap" }}>{ch.text}</div></Glass>
          </Enter>
        </At>
      ))}

      {/* detail · time · cost */}
      {cards.map(({ label, Icon, at }, i) => (
        <At key={label} x={CARD_X[i]} y={CARD_Y}>
          <Enter at={at} dy={36}>
            <Glass w={CARD.w} h={CARD.h} r={44}>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}><Icon size={40} /><span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 48, letterSpacing: "-0.02em", color: C.text }}>{label}</span></div>
                <div style={{ marginTop: 20 }}><Dial at={at + 0.1} /></div>
              </div>
            </Glass>
          </Enter>
        </At>
      ))}
    </>
  );
};
void FPS;

import React from "react";
import { C, FONT } from "../theme";
import { CUE } from "../cues";
import { At, Enter, clamp01, easeOutCubic, lerp, smooth, useSpring } from "../motion";
import { useT } from "../clock";
import { Glass, squircle } from "../components/glass";
import { Bolt, Coin, Frames } from "./icons";
import { SERIF } from "./text";

const COL = { w: 410, h: 480 }, PILL = { w: 420, h: 150 }, CARD = { w: 940, h: 580 };
const COL_AT = { l: { x: 325, y: 820 }, r: { x: 755, y: 820 } }, PILL_AT = { l: { x: 290, y: 830 }, r: { x: 790, y: 830 } };

const Item: React.FC<{ at: number; Icon: React.FC<{ size?: number; color?: string }>; text: string; color: string }> = ({ at, Icon, text, color }) => (
  <Enter at={at} dy={22}>
    <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "0 20px 0 12px", height: 96, borderRadius: 48, background: "rgba(0,0,0,0.045)", marginBottom: 20 }}>
      <div style={{ width: 62, height: 62, borderRadius: 31, background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={34} color={color} /></div>
      <div style={{ fontFamily: FONT.ui, fontWeight: 600, fontSize: 36, color: C.text, lineHeight: 1.1 }}>{text}</div>
    </div>
  </Enter>
);

/** 5. The decision card. 6. Its two columns morph into one flow line: "Draft → Gemini"  →  "Final → Claude". */
export const Decide: React.FC = () => {
  const t = useT(), c5 = CUE.s5, c6 = CUE.s6;
  const mm = clamp01(Math.min(1, useSpring(c6.smart)));
  const ring = (at: number) => { const d = t - at; return d < 0 ? 0 : Math.min(1, d / 0.25) * (1 - smooth(1.0, 1.4, d)); };
  const col = (side: "l" | "r") => {
    const x = lerp(COL_AT[side].x, PILL_AT[side].x, mm), y = lerp(COL_AT[side].y, PILL_AT[side].y, mm);
    const w = lerp(COL.w, PILL.w, mm), h = lerp(COL.h, PILL.h, mm);
    const left = side === "l", r = ring(left ? c5.gemini : c5.claude);
    const hi = clamp01((t - (left ? c6.gemini : c6.claude)) / 0.25);
    return (
      <At key={side} x={x} y={y}>
        <Enter at={c5.card} i={left ? 1 : 2} dy={36}>
          <div style={{ position: "relative", width: w, height: h }}>
            <Glass w={w} h={h} r={44} shadow={mm > 0.5}>
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.04)", opacity: 1 - smooth(0, 0.5, mm) }} />
              <div style={{ position: "absolute", inset: 0, background: left ? C.accent : "#1D1D1F", opacity: easeOutCubic(hi) }} />
              {/* S5: the column */}
              <div style={{ position: "absolute", left: 0, top: 0, width: COL.w, height: COL.h, padding: "40px 32px", opacity: 1 - smooth(0, 0.4, mm) }}>
                <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 70, letterSpacing: "-0.03em", color: left ? C.accent : C.text, marginBottom: 36 }}>{left ? "Gemini" : "Claude"}</div>
                {left ? (
                  <>
                    <Item at={c5.jaldi} Icon={Bolt} text="Fast draft" color={C.accent} />
                    <Item at={c5.kam} Icon={Coin} text="Low budget" color={C.accent} />
                  </>
                ) : <Item at={c5.har} Icon={Frames} text="Every frame perfect" color={C.text} />}
              </div>
              {/* S6: the pill */}
              <div style={{ position: "absolute", left: 0, top: 0, width: PILL.w, height: PILL.h, opacity: smooth(0.5, 1, mm), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.display, fontWeight: 700, fontSize: 52, letterSpacing: "-0.02em", color: hi > 0.5 ? "#fff" : C.text, whiteSpace: "nowrap" }}>
                {left ? "Draft → Gemini" : "Final → Claude"}
              </div>
            </Glass>
            {r > 0 && <svg width={w + 28} height={h + 28} style={{ position: "absolute", left: -14, top: -14, overflow: "visible", pointerEvents: "none", opacity: r }}><path d={squircle(w + 28, h + 28, 56)} fill="none" stroke={C.accent} strokeWidth={4} style={{ filter: `drop-shadow(0 0 12px ${C.accent}77)` }} /></svg>}
          </div>
        </Enter>
      </At>
    );
  };
  const arrow = easeOutCubic(clamp01((t - c6.dono) / 0.4));
  return (
    <>
      <At x={540} y={450}>
        <Enter at={c5.card} until={c6.smart}><div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 34, letterSpacing: "0.34em", color: C.accent, paddingLeft: "0.34em" }}>WHICH ONE?</div></Enter>
      </At>
      <At x={540} y={820} style={{ opacity: 1 - smooth(0, 0.5, mm) }}>
        {/* the card behind the columns */}
        <Enter at={c5.card} dy={30}><Glass w={CARD.w} h={CARD.h} r={48}><div /></Glass></Enter>
      </At>
      {col("l")}{col("r")}
      <At x={540} y={830} style={{ opacity: arrow > 0 ? 1 : 0 }}>
        <svg width={86} height={40} viewBox="0 0 86 40" style={{ overflow: "visible" }}>
          <path d="M4 20H80M62 4l18 16-18 16" pathLength={1} fill="none" stroke={C.accent} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - arrow} />
        </svg>
      </At>
      <At x={540} y={560} style={{ ...SERIF, fontSize: 190, whiteSpace: "nowrap" }}><Enter at={c6.dono} dy={30} blur={10}>Use both.</Enter></At>
      <At x={290} y={990}><Enter at={c6.gemini} dy={14} blur={4}><div style={{ fontFamily: FONT.ui, fontWeight: 500, fontSize: 34, color: C.secondary }}>fast · low budget</div></Enter></At>
      <At x={790} y={990}><Enter at={c6.claude} dy={14} blur={4}><div style={{ fontFamily: FONT.ui, fontWeight: 500, fontSize: 34, color: C.secondary }}>every frame perfect</div></Enter></At>
    </>
  );
};

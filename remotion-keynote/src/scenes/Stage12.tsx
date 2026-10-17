import React from "react";
import { C, FONT, FPS, STAGGER } from "../theme";
import { CUE, sceneEnd } from "../cues";
import { At, Enter, clamp01, easeOutCubic, lerp, useSpring } from "../motion";
import { useFrame, useT } from "../clock";
import { Glass, squircle } from "../components/glass";
import { Odometer, Sparkle, Swoosh } from "../components/bits";
import { HEAD, SERIF } from "./text";
import { Check } from "./icons";

const INV = { w: 800, h: 500 };                 // the invoice at full size
const SUB = { w: 560, h: 640 };                 // the subscription card
const INV_AT = { x: 540, y: 1030 }, INV_SMALL = { x: 236, y: 770, s: 0.4 }, SUB_AT = { x: 700, y: 770 };

/**
 * Scenes 1 and 2 are one stage: the invoice that rises in scene 1 is the same element that slides left and shrinks to 40 %
 * in scene 2 (a shared-element morph), while the subscription card rises beside it.
 */
export const Stage12: React.FC = () => {
  const frame = useFrame(), t = useT(), c1 = CUE.s1, c2 = CUE.s2, end = sceneEnd(1);
  const slide = useSpring(c2.slide);
  const m = Math.min(1, slide);
  const total = Math.round(50000 * (1 - (1 - clamp01((t - c1.total[0]) / (c1.total[1] - c1.total[0]))) ** 3));
  const price = Math.round(2000 * (1 - (1 - clamp01((t - c2.price[0]) / (c2.price[1] - c2.price[0]))) ** 3));
  const ring = easeOutCubic(clamp01((t - c2.ring[0]) / (c2.ring[1] - c2.ring[0])));
  const ringPath = squircle(SUB.w + 36, SUB.h + 36, 50);
  return (
    <>
      {/* scene 1: the headline */}
      <At x={540} y={474} style={{ width: 960, textAlign: "center" }}>
        <Enter at={c1.motion} until={c2.slide} style={{ ...HEAD, fontSize: 140 }}>Motion</Enter>
        <Enter at={c1.designer} until={c2.slide} style={{ ...HEAD, fontSize: 140 }}>designer</Enter>
        <div style={{ display: "flex", justifyContent: "center", gap: "0.22em", ...SERIF, fontSize: 150, marginTop: 4 }}>
          <Enter at={c1.ek} until={c2.slide}>ek</Enter><Enter at={c1.project} until={c2.slide}>project</Enter>
        </div>
      </At>

      {/* the invoice: scene 1 at full size, scene 2 at 40 % on the left */}
      <At x={lerp(INV_AT.x, INV_SMALL.x, m)} y={lerp(INV_AT.y, INV_SMALL.y, m)} style={{ transform: `translate(-50%, -50%) scale(${lerp(1, INV_SMALL.s, m)})` }}>
        <Enter at={c1.invoice} dy={60}>
          <Glass w={INV.w} h={INV.h}>
            <div style={{ position: "absolute", inset: 0, padding: "40px 48px" }}>
              <Enter at={c1.invoice} i={1} dy={14}><div style={{ fontFamily: FONT.ui, fontWeight: 600, fontSize: 24, letterSpacing: "0.16em", color: C.secondary }}>INVOICE</div></Enter>
              <Enter at={c1.invoice} i={2} dy={14}><div style={{ marginTop: 20, fontFamily: FONT.ui, fontWeight: 600, fontSize: 38, color: C.text }}>Motion Design — 1 project</div></Enter>
              <div style={{ marginTop: 26, height: 2, background: "rgba(0,0,0,0.07)" }} />
              <Enter at={c1.invoice} i={3} dy={14}><div style={{ marginTop: 22, fontFamily: FONT.ui, fontWeight: 600, fontSize: 26, color: C.secondary }}>Total</div></Enter>
              <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 18 }}>
                <Enter at={c1.upTo} dy={10} blur={4}><div style={{ fontFamily: FONT.ui, fontWeight: 500, fontSize: 30, color: C.secondary, whiteSpace: "nowrap" }}>*up to</div></Enter>
                <Enter at={c1.invoice} i={4} dy={14}><Odometer value={total} digits={5} size={132} prefix="₹" /></Enter>
              </div>
              <div style={{ position: "absolute", left: 150, top: 378 }}><Swoosh at={c1.swoosh} w={560} h={46} width={10} /></div>
            </div>
          </Glass>
        </Enter>
      </At>

      {/* scene 2: the subscription card, its ring, its price */}
      <At x={SUB_AT.x} y={SUB_AT.y}>
        <Enter at={c2.slide} dy={70} i={2}>
          <div style={{ position: "relative", width: SUB.w, height: SUB.h }}>
            <Glass w={SUB.w} h={SUB.h}>
              <div style={{ position: "absolute", inset: 0, padding: "44px 48px" }}>
                <Enter at={c2.slide} i={4} dy={14}>
                  <div style={{ width: 76, height: 76, borderRadius: 22, background: `linear-gradient(145deg, #3D9BFF, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 10px 24px ${C.accent}44` }}>
                    <svg viewBox="0 0 24 24" width={40} height={40}><path d="M12 1C12.9 7 17 11.1 23 12C17 12.9 12.9 17 12 23C11.1 17 7 12.9 1 12C7 11.1 11.1 7 12 1Z" fill="#fff" /></svg>
                  </div>
                </Enter>
                <Enter at={c2.pro} dy={14}><div style={{ ...HEAD, marginTop: 26, fontSize: 60 }}>Claude Pro</div></Enter>
                <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <Enter at={c2.price[0]} dy={14}><Odometer value={price} digits={4} size={118} prefix="₹" /></Enter>
                  <Enter at={c2.perMonth} i={1} dy={10} blur={4}><div style={{ marginTop: 10, fontFamily: FONT.ui, fontWeight: 600, fontSize: 38, color: C.secondary }}>/ month</div></Enter>
                </div>
                <div style={{ marginTop: 40, height: 2, background: "rgba(0,0,0,0.07)" }} />
                <Enter at={c2.included} i={2} dy={14}>
                  <div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 20, fontFamily: FONT.ui, fontWeight: 600, fontSize: 36, color: C.text }}>
                    <Check size={52} />Claude Code included
                  </div>
                </Enter>
              </div>
            </Glass>
            {/* one month: a thin blue ring that completes one full circle over "poore mahine ke" */}
            <svg width={SUB.w + 36} height={SUB.h + 36} style={{ position: "absolute", left: -18, top: -18, pointerEvents: "none", overflow: "visible", opacity: ring > 0 ? 1 : 0 }}>
              <path d={ringPath} pathLength={1} fill="none" stroke={C.accent} strokeWidth={4} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - ring} style={{ filter: `drop-shadow(0 0 10px ${C.accent}66)` }} />
            </svg>
          </div>
        </Enter>
      </At>
      <Sparkle x={840} y={640} size={46} at={c1.upTo} until={c2.slide} phase={1} />
    </>
  );
};

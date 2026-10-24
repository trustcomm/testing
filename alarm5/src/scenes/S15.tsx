import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT } from "../theme";
import { useFrame } from "../clock";
import { clamp01, lerp, smooth, springAt, Pop } from "../motion";
import { settle, swing } from "../easing";
import { Canvas, Stroke, check, line, rrect } from "../components/draw";
import { Pill } from "../components/pill";
import { cue } from "../cues/s15";

/** S15: the CTA in screen space over the green constellation */
export const S15Screen: React.FC = () => {
  const f = useFrame();
  const pulse = f >= cue.alert ? 1 + 0.03 * Math.sin(((f - cue.alert) / 60) * Math.PI * 2.4) : 1;
  const flip = swing(clamp01((f - cue.flip) / 26));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 540, top: 520, transform: "translate(-50%, -50%)" }}>
        <Pop at={cue.followPill}><Pill size={40} style={{ padding: "22px 46px", borderWidth: 2, background: "rgba(10,10,12,0.78)", textTransform: "none", letterSpacing: "0.02em" }}>Follow <span style={{ color: C.trust, marginLeft: 6 }}>@baqur.ai</span></Pill></Pop>
      </div>
      <div style={{ position: "absolute", left: 540, top: 700, transform: `translate(-50%, -50%) scale(${pulse})` }}>
        <Pop at={cue.comment}>
          <div style={{ background: C.text, color: "#000", borderRadius: 999, padding: "34px 84px", fontFamily: FONT.display, fontWeight: 700, fontSize: 84, letterSpacing: "-0.03em", whiteSpace: "nowrap", boxShadow: "0 0 80px rgba(245,245,247,0.22)" }}>Comment <span style={{ color: "#1a7f37" }}>ALERT</span></div>
        </Pop>
      </div>
      {f >= cue.checklist && (
        <div style={{ position: "absolute", left: 540 - 190, top: 900, width: 380, height: 360, perspective: 1400, opacity: smooth(cue.checklist, cue.checklist + 14, f) }}>
          <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 0%", transform: `rotateX(${(1 - flip) * -78}deg)`, borderRadius: 30, background: "rgba(255,255,255,0.06)", border: `2px solid ${C.glassStroke}`, backdropFilter: "blur(24px)" }}>
            <div style={{ position: "absolute", left: 100, top: -22, width: 180, height: 44, borderRadius: 14, background: "#0B0C0F", border: `2px solid ${C.glassStroke}` }} />
            <svg width={380} height={390} viewBox="0 0 380 390" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <g opacity={flip}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <g key={i}>
                    <Stroke d={rrect(40, 36 + i * 62, 40, 40, 10)} at={cue.tick0 + i * 7 - 4} frames={14} color={C.secondary} />
                    <Stroke d={check(60, 57 + i * 62, 34)} at={cue.tick0 + i * 7} frames={12} color={C.trust} w={4} />
                    <Stroke d={line(110, 56 + i * 62, 330 - (i % 3) * 40, 56 + i * 62)} at={cue.tick0 + i * 7 - 2} frames={20} color={C.secondary} w={3} />
                  </g>
                ))}
              </g>
            </svg>
          </div>
        </div>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1456, textAlign: "center", fontFamily: FONT.body, fontWeight: 500, fontSize: 19, color: C.secondary, opacity: 0.85 * smooth(cue.sources, cue.sources + 30, f), letterSpacing: "0.01em" }}>Sources: PYMNTS · StepSecurity · BleepingComputer · Malwarebytes · The Hacker News</div>
    </AbsoluteFill>
  );
};

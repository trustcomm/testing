import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT } from "../theme";
import { useFrame } from "../clock";
import { clamp01, lerp, smooth, springAt } from "../motion";
import { settle, swing } from "../easing";
import { Canvas, Stroke, circle, line, rrect } from "../components/draw";
import { Lock } from "../components/art";
import { headline } from "../components/kinetic";
import { START } from "../timeline";
import { cue } from "../cues/s14";

const Word: React.FC<{ at: number; y: number; size: number; color?: string; children: React.ReactNode }> = ({ at, y, size, color = C.text, children }) => {
  const f = useFrame(), s = springAt(f, at), o = smooth(START.S15 + 4, START.S15 + 26, f);
  if (f < at) return null;
  return <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", opacity: clamp01((f - at) / 8) * (1 - o), transform: `scale(${0.82 + 0.18 * s}) translateY(${(1 - s) * 26}px)`, filter: o > 0 ? `blur(${o * 8}px)` : undefined, ...headline(size), color, textShadow: "0 0 50px rgba(52,199,89,0.28)" }}>{children}</div>;
};
/** S14 in screen space: UPDATE. / KEYS BADLO. / PASSWORD: KISI KO NAHI. stacking on their words; the tiny robot shakes its head nope beside a green lock */
export const S14Screen: React.FC = () => {
  const f = useFrame();
  const rp = springAt(f, cue.robot), shake = f >= cue.nope ? Math.sin(((f - cue.nope) / 60) * Math.PI * 7) * 16 * Math.exp(-(f - cue.nope) / 40) : 0;
  const o = smooth(START.S15 + 4, START.S15 + 26, f), closed = settle(clamp01((f - cue.lock) / 10));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Word at={cue.update} y={420} size={168}>UPDATE<span style={{ color: C.trust }}>.</span></Word>
      <Word at={cue.keys} y={598} size={132}>KEYS BADLO<span style={{ color: C.trust }}>.</span></Word>
      <Word at={cue.password} y={742} size={92}>PASSWORD:</Word>
      <Word at={cue.kisi} y={846} size={104} color={C.trust}>KISI KO NAHI.</Word>
      {f >= cue.robot && (
        <Canvas style={{ opacity: clamp01((f - cue.robot) / 10) * (1 - o) }}>
          <g transform={`translate(380 1110) scale(${0.6 + 0.4 * rp})`}>
            <g transform={`rotate(${shake} 0 -50)`}>
              <Stroke d={rrect(-34, -96, 68, 56, 16)} at={cue.robot} frames={22} />
              <Stroke d="M0 -96V-116" at={cue.robot + 8} frames={10} /><Stroke d={circle(0, -124, 7)} at={cue.robot + 10} frames={10} />
              <circle cx={-12} cy={-70} r={5} fill={C.text} /><circle cx={12} cy={-70} r={5} fill={C.text} />
            </g>
            <Stroke d={rrect(-40, -34, 80, 76, 14)} at={cue.robot + 6} frames={24} />
            <Stroke d="M-40 -18L-66 22M40 -18L66 22M-16 42V80M16 42V80" at={cue.robot + 12} frames={20} />
          </g>
          <g transform="translate(540 1110)"><Lock x={0} y={0} s={1.2} at={cue.robot + 6} closed={closed} color={C.trust} /></g>
        </Canvas>
      )}
    </AbsoluteFill>
  );
};

// Screen-space countdown: a giant numeral assembles from particles at screen centre, holds, then shrinks into the HUD (top-right, inside the safe zone).
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, H, W } from "../theme";
import { useFrame } from "../clock";
import { clamp01, lerp, smooth } from "../motion";
import { glide, settle, swing } from "../easing";
import { Dust, textPoints } from "./dust";
import { NUMERALS } from "../timeline";

const BIG = 760;
const HUD_POS = { x: 896, y: 316 };

/** one numeral's reveal: `at` = the hit (the frame the number is whole), the particles gather over the 26 frames before it */
const Reveal: React.FC<{ n: number; at: number; end: number; bigger?: boolean }> = ({ n, at, end, bigger }) => {
  const f = useFrame();
  const size = bigger ? BIG * 1.18 : BIG;
  const pts = useMemo(() => textPoints(String(n), { font: `700 ${size}px "Inter Display"`, x: W / 2, y: H / 2 - 40, step: 9 }), [n, size]);
  const gather = 1 - settle(clamp01((f - (at - 26)) / 26));            // 1 (dust) -> 0 (whole), done on the hit
  const shrink = glide(clamp01((f - (at + 22)) / 34));                  // from the hold into the HUD
  const x = lerp(W / 2, HUD_POS.x, shrink), y = lerp(H / 2 - 40, HUD_POS.y, shrink), sc = lerp(1, 0.085 * (bigger ? 1.1 : 1), shrink);
  const whole = f >= at - 4;
  const o = 1 - smooth(end - 6, end, f);
  if (f < at - 28 || f > end) return null;
  const pop = f >= at && f < at + 14 ? 1 + 0.03 * Math.sin(((f - at) / 14) * Math.PI) : 1;       // a tiny settle on the hit
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: "none" }}>
      {gather > 0.001 && <Dust points={pts} p={gather} seed={n * 7} size={3.2} drift={340} dir={-Math.PI / 2} spread={Math.PI} stagger={0.5} color={C.text} />}
      {whole && (
        <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -52%) scale(${sc * pop})`, fontFamily: FONT.display, fontWeight: 700, fontSize: size, lineHeight: 1, letterSpacing: "-0.04em", color: C.text, opacity: smooth(at - 12, at - 1, f), textShadow: `0 0 ${60 * (1 - shrink)}px rgba(255,179,64,${0.5 * (1 - shrink)}), 0 0 ${18}px rgba(255,179,64,${0.25 * (1 - shrink)})` }}>{n}</div>
      )}
    </AbsoluteFill>
  );
};

/** the HUD "0N": amber mono with a small ring. The old number leaves with a blur as the new one lands. */
const HudNumber: React.FC<{ n: number; from: number; to: number }> = ({ n, from, to }) => {
  const f = useFrame();
  if (f < from || f > to) return null;
  const i = settle(clamp01((f - from) / 20)), o = swing(clamp01((f - (to - 20)) / 20));
  const ring = 0.5 + 0.5 * Math.sin(f / 16);
  return (
    <div style={{ position: "absolute", left: HUD_POS.x, top: HUD_POS.y, transform: "translate(-50%, -50%)", opacity: i * (1 - o), filter: o > 0 ? `blur(${o * 8}px)` : i < 1 ? `blur(${(1 - i) * 8}px)` : undefined }}>
      <svg width={150} height={150} viewBox="-75 -75 150 150" style={{ position: "absolute", left: -75 + 0, top: -75, overflow: "visible" }}>
        <circle r={62} fill="none" stroke={C.amber} strokeOpacity={0.5} strokeWidth={3} />
        <circle r={62 + 7 * ring} fill="none" stroke={C.amber} strokeOpacity={0.14 + 0.1 * (1 - ring)} strokeWidth={2} />
      </svg>
      <div style={{ position: "relative", width: 124, textAlign: "center", fontFamily: FONT.mono, fontWeight: 700, fontSize: 64, lineHeight: "124px", height: 124, marginLeft: -62, marginTop: -62 + 62, color: C.amber, textShadow: "0 0 22px rgba(255,179,64,0.55)" }}>{String(n).padStart(2, "0")}</div>
    </div>
  );
};

export const Hud: React.FC = () => {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {NUMERALS.map((nm, i) => <Reveal key={nm.n} n={nm.n} at={nm.at} end={nm.at + 62} bigger={nm.n === 1} />)}
      {NUMERALS.map((nm, i) => <HudNumber key={nm.n} n={nm.n} from={nm.hudFrom ?? nm.at + 40} to={NUMERALS[i + 1] ? NUMERALS[i + 1].at + 40 : nm.hudEnd ?? nm.at + 700} />)}
    </AbsoluteFill>
  );
};

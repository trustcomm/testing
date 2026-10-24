import React, { useId } from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT } from "../theme";
import { useFrame } from "../clock";
import { clamp01, lerp, rand, smooth, Rise } from "../motion";
import { glide, settle, swing } from "../easing";
import { Local, Stroke, circle, line, rrect, poly } from "../components/draw";
import { Abs, T, WPill } from "../components/art";
import { Inner } from "../components/keys";
import { headline } from "../components/kinetic";
import { Obj, useCam } from "../world";
import { stationAt } from "../components/map";
import { ART, START } from "../timeline";
import { cue } from "../cues/s11";
import { BugGlyph } from "./S09";

export const GY = 150;
const SITES = [-330, -110, 110, 330];
/** a website standing on the ground line: a browser window with three dots and content lines */
export const Site: React.FC<{ x: number; at: number; color?: string }> = ({ x, at, color = C.text }) => (
  <g>
    <Stroke d={rrect(x - 75, GY - 118, 150, 118, 12)} at={at} frames={30} color={color} />
    <Stroke d={line(x - 75, GY - 92, x + 75, GY - 92)} at={at + 6} frames={18} color={color} />
    {[-52, -36, -20].map((dx, i) => <circle key={i} cx={x + dx} cy={GY - 105} r={4} fill={color} />)}
    {[0, 1, 2].map((i) => <Stroke key={i} d={line(x - 50, GY - 70 + i * 20, x + (i === 1 ? 20 : 50), GY - 70 + i * 20)} at={at + 10 + i * 3} frames={16} color={color} w={2} />)}
  </g>
);
export const S11World: React.FC = () => {
  const f = useFrame(), cam = useCam(), hid = useId().replace(/:/g, "");
  const [a, b] = ART.window[1];
  if (f < a - 40 || f > b + 40) return null;
  const shell = 1 - smooth(1.7, 5.0, cam.s), inner = smooth(3.2, 6.5, cam.s);
  const year = Math.round(lerp(2016, 2026, swing(clamp01((f - cue.das) / (cue.se - cue.das + 8)))));
  return (
    <Obj at={stationAt(1)} r={760} art z={2}>
      <div style={{ opacity: shell, filter: shell < 1 ? `blur(${(1 - shell) * 16}px)` : undefined }}>
        <Local>
          <Stroke d={line(-480, GY, 480, GY)} at={cue.websites - 8} frames={44} />
          {Array.from({ length: 14 }, (_, i) => <Stroke key={i} d={line(-440 + i * 68, GY + 16, -420 + i * 68, GY + 16)} at={cue.websites + i} frames={18} color={C.secondary} w={2} />)}
          {SITES.map((x, i) => (
            <g key={x} style={{ transform: `translateY(${(1 - settle(clamp01((f - (cue.websites + i * 5)) / 26))) * 36}px)` }}><Site x={x} at={cue.websites + i * 5} /></g>
          ))}
        </Local>
        <WPill x={-220} y={-34} at={cue.wordpress} size={28}>WordPress</WPill>
        <WPill x={220} y={-34} at={cue.websitesLabel} size={28}>Websites</WPill>
      </div>
      {inner > 0.01 && (
        <Inner x={0} y={GY} scale={0.125} opacity={inner}>
          <div style={{ position: "absolute", left: -1400, top: -1500, width: 2800, height: 3000, background: "radial-gradient(ellipse 900px 1000px at 50% 50%, #0a0b0e 0%, #020203 72%)" }} />
          <Local>
            {[-260, -140, 140, 260, 380, 500].map((y, i) => <Stroke key={i} d={line(-540, y, 540, y)} at={cue.dollyEnd + i * 3} frames={30} color={C.hair} w={2} />)}
            <clipPath id={hid}><rect x={-320} y={-170} width={640} height={300} rx={22} /></clipPath>
            <g clipPath={`url(#${hid})`}>{Array.from({ length: 22 }, (_, i) => <Stroke key={i} d={line(-420 + i * 48, 130, -300 + i * 48, -170)} at={cue.neev + 6 + i} frames={26} color={C.secondary} w={2} opacity={0.5} />)}</g>
            <Stroke d={rrect(-320, -170, 640, 300, 22)} at={cue.neev} frames={34} color={C.text} />
            <BugGlyph x={-150} y={-10} s={2.1} at={cue.bugs} /><BugGlyph x={150} y={-10} s={2.1} at={cue.bugs + 10} />
            {/* dust on "das saal" */}
            {f >= cue.das - 6 && Array.from({ length: 70 }, (_, i) => {
              const t0 = cue.das - 6 + rand(i, 1) * 50, age = (f - t0) / 60;
              if (age < 0 || age > 1.6) return null;
              return <circle key={i} cx={(rand(i, 2) - 0.5) * 720 + Math.sin(age * 3 + i) * 20} cy={-170 - age * (110 + rand(i, 3) * 220)} r={2 + rand(i, 4) * 2.5} fill={C.text} opacity={(1 - age / 1.6) * 0.8} />;
            })}
          </Local>
          <div style={{ position: "absolute", left: 0, top: 0 }}>
            <Abs x={0} y={-20}><div style={{ opacity: smooth(cue.php - 6, cue.php + 8, f), transform: `scale(${0.8 + 0.2 * settle(clamp01((f - cue.php) / 20))})` }}><T size={150} mono color={C.text} style={{ fontWeight: 700, letterSpacing: "0.06em" }}>PHP</T></div></Abs>
            <WPill x={-196} y={214} at={cue.bugs + 12} size={30} tone="danger">CVE-2026-109618</WPill>
            <WPill x={196} y={214} at={cue.bugs + 20} size={30} tone="danger">CVE-2026-109619</WPill>
            <Abs x={0} y={-300}>
              <Rise at={cue.das - 10} frames={22}><div style={{ display: "flex", alignItems: "center", gap: 34 }}><T size={96} mono color={C.secondary} style={{ fontWeight: 500 }}>2016</T><svg width={90} height={40} viewBox="-45 -20 90 40" style={{ overflow: "visible" }}><Stroke d="M-40 0H36M18 -16L38 0L18 16" at={cue.das} frames={20} /></svg><T size={96} mono color={C.text} style={{ fontWeight: 500 }}>{year}</T></div></Rise>
            </Abs>
          </div>
        </Inner>
      )}
    </Obj>
  );
};

/** S11 in screen space: the red ring pulse around the 1 and the title PHP2Shell */
export const S11Screen: React.FC = () => {
  const f = useFrame();
  const r1 = clamp01((f - cue.ring) / 40), r2 = clamp01((f - cue.ring - 10) / 44);
  const o = smooth(cue.titleOut, cue.titleOut + 16, f);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {f >= cue.ring && f < cue.ring + 56 && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <circle cx={540} cy={800} r={150 + glide(r1) * 560} fill="none" stroke={C.alarm} strokeWidth={6 * (1 - r1) + 2} opacity={0.85 * (1 - r1)} />
          <circle cx={540} cy={800} r={150 + glide(r2) * 700} fill="none" stroke={C.alarm} strokeWidth={4 * (1 - r2) + 1} opacity={0.6 * (1 - r2)} />
        </svg>
      )}
      {f >= cue.title - 4 && f < cue.titleOut + 30 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 372, textAlign: "center", opacity: 1 - o, filter: o > 0 ? `blur(${o * 10}px)` : undefined }}>
          <Rise at={cue.title} frames={26} dy={26}><div style={{ ...headline(158), letterSpacing: "-0.035em", textShadow: "0 0 60px rgba(255,59,48,0.35)" }}>PHP<span style={{ color: C.alarm }}>2</span>Shell</div></Rise>
        </div>
      )}
    </AbsoluteFill>
  );
};

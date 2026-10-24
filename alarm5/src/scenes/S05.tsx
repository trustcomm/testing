import React from "react";
import { C, FONT } from "../theme";
import { useFrame } from "../clock";
import { clamp01, lerp, rand, smooth, Rise } from "../motion";
import { glide, settle, swing } from "../easing";
import { Local, Stroke, circle, line, poly, rrect } from "../components/draw";
import { Abs, T, WPill } from "../components/art";
import { Inner, KeyIcon } from "../components/keys";
import { Obj, useCam } from "../world";
import { stationAt } from "../components/map";
import { ART } from "../timeline";
import { cue } from "../cues/s05";
import { cue as c6 } from "../cues/s06";

export const HATCH = { x: 430, y: -110 };                                        // interior units
const PULLS = [cue.pull1, cue.pull2, cue.pull3, cue.pull4];
const RISES = [cue.keyCloud - 14, cue.keyAi - 14, 1951, 1962];
const KEYX = [-330, -110, 110, 330];
/** the stolen keys once they are outside the box: a column at the right of it, on a red dotted line heading off the map (S6 turns them green) */
export const OutKeys: React.FC = () => {
  const f = useFrame();
  const morph = swing(clamp01((f - c6.morph) / 34)), rot = morph * 360;
  return (
    <>
      {PULLS.map((p, i) => {
        const a = settle(clamp01((f - (p + 34)) / 22));
        if (a <= 0) return null;
        const y = -150 + i * 84, x = 330;
        return (
          <g key={i} opacity={a}>
            <Stroke d={line(x + 70, y, 620, y)} dotted={11} p={1} color={C.alarm} opacity={0.8 * (1 - morph)} />
            <KeyIcon x={x} y={y} s={0.9} deg={rot} at={0} color={C.alarm} opacity={1 - morph} glow="rgba(255,59,48,0.5)" frames={1} />
            <KeyIcon x={x} y={y} s={0.9} deg={rot} at={0} color={C.trust} opacity={morph} glow="rgba(52,199,89,0.5)" frames={1} />
          </g>
        );
      })}
    </>
  );
};

export const S5World: React.FC = () => {
  const f = useFrame(), cam = useCam();
  const [a, b] = ART.window[4];
  if (f < a - 40 || f > b + 40) return null;
  const shell = 1 - smooth(1.7, 5.0, cam.s), inner = smooth(3.2, 6.5, cam.s);
  // the box rides in on the belt and settles in the middle
  const bx = lerp(-560, 0, settle(clamp01((f - 1498) / 50)));
  const worm = clamp01((f - cue.worm) / 36), gone = smooth(cue.wormIn + 8, cue.wormIn + 44, f);
  const wd = "M430 -150C370 -176 340 -92 280 -104S190 -20 118 -20";
  const belt = ((f - 1480) * 1.35) % 120;
  return (
    <Obj at={stationAt(4)} r={760} art z={2}>
      <Local style={{ opacity: shell, filter: shell < 1 ? `blur(${(1 - shell) * 16}px)` : undefined }}>
        {/* back conveyor: smaller boxes (PyPI, Docker, ...) moving past */}
        <Stroke d={line(-480, -190, 480, -190)} at={1500} frames={40} color={C.secondary} />
        {[0, 1, 2, 3, 4].map((i) => {
          const x = ((i * 250 + (f - 1480) * 1.1) % 1250) - 625;
          return <g key={i} opacity={clamp01((f - 1510 - i * 6) / 16) * smooth(-620, -540, x) * (1 - smooth(540, 620, x))}><rect x={x - 46} y={-190 - 66} width={92} height={66} rx={8} fill="none" stroke={C.secondary} strokeWidth={3} /><line x1={x - 46} y1={-190 - 40} x2={x + 46} y2={-190 - 40} stroke={C.secondary} strokeWidth={2} /></g>;
        })}
        {/* front conveyor and the main box */}
        <Stroke d={rrect(-480, 150, 960, 44, 22)} at={1500} frames={44} />
        {[-420, -300, -180, -60, 60, 180, 300, 420].map((x, i) => <Stroke key={x} d={circle(x, 172, 13)} at={1506 + i * 3} frames={20} color={C.secondary} />)}
        {Array.from({ length: 9 }, (_, i) => { const x = -480 + ((i * 120 + belt) % 1080); return <line key={i} x1={x} y1={152} x2={x + 22} y2={152} stroke={C.secondary} strokeWidth={2} opacity={0.5} />; })}
        <g transform={`translate(${bx} 0)`}>
          <Stroke d={rrect(-115, -60, 230, 200, 10)} at={1496} frames={34} />
          <Stroke d={line(-115, -20, 115, -20)} at={1504} frames={24} />
          <Stroke d={line(-28, -60, -28, -20)} at={1510} frames={14} /><Stroke d={line(28, -60, 28, -20)} at={1510} frames={14} />
          <Stroke d={rrect(-84, 28, 168, 84, 8)} at={1514} frames={26} color={C.secondary} />
        </g>
        {/* the red worm slips into the seam */}
        {f >= cue.worm && <Stroke d={wd} p={worm} from={gone} color={C.alarm} glow="rgba(255,59,48,0.6)" w={4} />}
        <OutKeys />
      </Local>
      <div style={{ opacity: shell, filter: shell < 1 ? `blur(${(1 - shell) * 16}px)` : undefined }}>
        <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${bx}px, 0px)` }}>
          <Abs x={0} y={70}><Rise at={1522} frames={20}><div style={{ textAlign: "center" }}><T size={26} mono color={C.text}>LiteLLM</T><T size={32} mono color={C.secondary} style={{ marginTop: 6 }}>1.107.0</T></div></Rise></Abs>
        </div>
        <WPill x={0} y={-112} at={cue.label} size={30}>LiteLLM 1.107.0</WPill>
        <Abs x={-340} y={-300}><Rise at={cue.others} frames={20}><T size={22} mono color={C.secondary}>PyPI · Docker</T></Rise></Abs>
      </div>
      {/* the dark inner world: only visible while the camera is inside the box */}
      {inner > 0.01 && (
        <Inner x={0} y={40} scale={0.125} opacity={inner}>
          <div style={{ position: "absolute", left: -1400, top: -1500, width: 2800, height: 3000, background: "radial-gradient(ellipse 900px 1000px at 50% 50%, #0a0b0e 0%, #020203 70%)" }} />
          <Local>
            {[0, 1, 2, 3, 4, 5].map((i) => { const w = 1700 - i * 250, h = 2300 - i * 340; return <Stroke key={i} d={rrect(-w / 2, -160 - h / 2, w, h, 40)} at={1806 + i * 4} frames={34} color={C.hair} w={2} />; })}
            {/* the hidden hatch */}
            <Stroke d={rrect(HATCH.x - 74, HATCH.y - 96, 148, 192, 14)} at={1812} frames={30} color={C.text} />
            <Stroke d={line(HATCH.x - 74, HATCH.y, HATCH.x + 74, HATCH.y)} at={1820} frames={20} color={C.secondary} />
            <circle cx={HATCH.x} cy={HATCH.y - 120} r={9} fill={C.alarm} opacity={0.6 + 0.4 * Math.sin(f / 10)} />
            {KEYX.map((kx, i) => {
              const rise = settle(clamp01((f - RISES[i]) / 46)), p = PULLS[i];
              const line1 = glide(clamp01((f - p) / 14)), mv = swing(clamp01((f - p - 8) / 24)), out = glide(clamp01((f - p - 30) / 22));
              const bob = Math.sin(f / 22 + i * 1.7) * 9;
              const baseX = kx, baseY = lerp(300, -150, rise) + bob;
              const x = f < p + 8 ? baseX : lerp(baseX, HATCH.x - 40, mv) + out * 360, y = f < p + 8 ? baseY : lerp(baseY, HATCH.y, mv);
              if (rise <= 0 || out >= 1) return null;
              return (
                <g key={i} opacity={rise * (1 - out)}>
                  {f >= p && <Stroke d={line(HATCH.x - 74, HATCH.y, lerp(HATCH.x - 74, x + 30, line1), lerp(HATCH.y, y, line1))} dotted={13} p={1} color={C.alarm} glow="rgba(255,59,48,0.55)" />}
                  <KeyIcon x={x} y={y} s={1.5} at={RISES[i]} frames={26} color={f >= p ? C.alarm : C.text} glow={f >= p ? "rgba(255,59,48,0.5)" : undefined} />
                </g>
              );
            })}
          </Local>
          <WPill x={KEYX[0]} y={-300} at={cue.keyCloud} out={cue.pull1 + 4} size={26} tone="danger">CLOUD KEY</WPill>
          <WPill x={KEYX[1]} y={-300} at={cue.keyAi} out={cue.pull2 + 4} size={26} tone="danger">AI KEY</WPill>
        </Inner>
      )}
    </Obj>
  );
};

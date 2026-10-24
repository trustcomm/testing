import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, H, W } from "../theme";
import { useFrame } from "../clock";
import { clamp01, lerp, rand, Rise, Pop, smooth } from "../motion";
import { glide, settle, swing } from "../easing";
import { Canvas, Stroke, circle, line, poly, arc, quad } from "../components/draw";
import { headline, serif, TypeIn } from "../components/kinetic";
import { Pill } from "../components/pill";
import { cue } from "../cues/s01";
import { CAMERA, START } from "../timeline";
import { project } from "../world";
import { beaconPoint } from "../geometry";

/** a tiny person: a head circle and shoulders */
const Person: React.FC<{ x: number; y: number; s: number; at: number }> = ({ x, y, s, at }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Stroke d={circle(0, -26, 10)} at={at} frames={22} w={3 / s} />
    <Stroke d={arc(0, 34, 34, 215, 325)} at={at + 4} frames={22} w={3 / s} />
  </g>
);

/** S1 in screen space: the headline, the crowd under a flat sound wave, the red dotted line that shoots at the camera, the YOU pill */
export const S1Screen: React.FC = () => {
  const f = useFrame();
  const ex = START.S2 + 10;
  // the red dotted line: from beacon #1's place on the map to the camera (dots swell as they come at the viewer)
  const cam = CAMERA.at(cue.seedha);
  const p0 = project(cam, beaconPoint(1)[0], beaconPoint(1)[1], 1);
  const shoot = glide(clamp01((f - cue.seedha) / (cue.aapko - cue.seedha)));
  const N = 22;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* headline */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center" }}>
        <Rise at={cue.iss} frames={22} out={cue.headlineOut} outFrames={14}><div style={{ ...serif(92), letterSpacing: 0 }}>iss hafte</div></Rise>
        {f >= cue.headline && f < cue.headlineOut + 14 && (
          <div style={{ ...headline(206), marginTop: 6, opacity: 1 - smooth(cue.headlineOut, cue.headlineOut + 14, f), filter: f > cue.headlineOut ? `blur(${smooth(cue.headlineOut, cue.headlineOut + 14, f) * 8}px)` : undefined, transform: `translateY(${-smooth(cue.headlineOut, cue.headlineOut + 14, f) * 8}px)` }}>
            <TypeIn text="5 ALARM" at={cue.headline} cps={13} caret={false} />
          </div>
        )}
      </div>
      {/* the crowd and the flat sound wave */}
      {f >= cue.crowd && f < cue.crowdOut + 14 && (
        <Canvas style={{ opacity: 1 - smooth(cue.crowdOut, cue.crowdOut + 14, f) }}>
          <g opacity={0.95}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Person key={i} x={250 + i * 82} y={1130 + (i % 2) * 14} s={0.62 + (i % 3) * 0.08} at={cue.crowd + i * 3} />)}
            {/* the speaker and its wave: it stays flat */}
            <Stroke d={poly([[120, 1010], [150, 1010], [186, 984], [186, 1054], [150, 1030], [120, 1030]], true)} at={cue.crowd} frames={22} />
            <Stroke d={line(214, 1020, 960, 1020)} at={cue.crowd + 12} frames={30} color={C.secondary} />
            <Stroke d={`M214 1020${Array.from({ length: 34 }, (_, i) => `L${214 + i * 22.6} ${1020 + (f < cue.flat ? Math.sin(i * 1.7 + f * 0.25) * 22 * Math.exp(-i / 9) * (1 - smooth(cue.flat - 12, cue.flat + 6, f)) : 0)}`).join("")}`} at={cue.crowd + 12} frames={30} color={C.text} opacity={f < cue.flat + 10 ? 0.8 : 0.0} />
          </g>
        </Canvas>
      )}
      {/* the red dotted line shooting at the camera */}
      {f >= cue.seedha && f < cue.aapko + 18 && (
        <Canvas>
          {Array.from({ length: N }, (_, i) => {
            const t = i / (N - 1), show = clamp01((shoot * 1.25 - t * 0.5) * 3);
            const x = lerp(p0.sx, 540, t ** 0.9), y = lerp(p0.sy, 800, t ** 0.9);
            const r = lerp(2.5, 22, t ** 2.4) * (f > cue.aapko ? 1 - smooth(cue.aapko, cue.aapko + 16, f) : 1);
            return <circle key={i} cx={x} cy={y} r={r} fill={C.alarm} opacity={show * (0.35 + 0.65 * t)} style={{ filter: `drop-shadow(0 0 ${6 + t * 14}px rgba(255,59,48,0.7))` }} />;
          })}
        </Canvas>
      )}
      {/* the YOU pill lands at screen centre */}
      <div style={{ position: "absolute", left: 540, top: 800, transform: "translate(-50%, -50%)" }}>
        <Pop at={cue.you} out={ex}><Pill tone="danger" size={52} style={{ borderWidth: 3, padding: "22px 54px", background: "rgba(255,59,48,0.08)", boxShadow: "0 0 60px rgba(255,59,48,0.35)" }}>YOU</Pill></Pop>
      </div>
    </AbsoluteFill>
  );
};

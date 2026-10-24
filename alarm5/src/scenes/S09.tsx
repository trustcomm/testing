import React from "react";
import { C, FONT } from "../theme";
import { useFrame } from "../clock";
import { clamp01, lerp, smooth, springAt, Rise } from "../motion";
import { glide, settle, swing } from "../easing";
import { Local, Stroke, arc, circle, line, poly, rrect } from "../components/draw";
import { Abs, T, WPill } from "../components/art";
import { Obj } from "../world";
import { stationAt } from "../components/map";
import { ART } from "../timeline";
import { cue } from "../cues/s09";
import { cue as c10 } from "../cues/s10";

export const PHONE = { y: -20 };
/** a tiny bug glyph: oval body, a head, six legs and two antennae */
export const BugGlyph: React.FC<{ x: number; y: number; s?: number; at: number; color?: string }> = ({ x, y, s = 1, at, color = C.alarm }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Stroke d="M0 -14C16 -14 22 4 14 20C8 30 -8 30 -14 20C-22 4 -16 -14 0 -14Z" at={at} frames={20} color={color} glow="rgba(255,59,48,0.5)" w={3 / s} />
    <Stroke d={circle(0, -24, 9)} at={at + 4} frames={14} color={color} w={3 / s} />
    {[-1, 1].map((d) => (
      <g key={d}>
        <Stroke d={line(d * 14, -4, d * 34, -14)} at={at + 8} frames={12} color={color} w={3 / s} /><Stroke d={line(d * 16, 6, d * 38, 8)} at={at + 10} frames={12} color={color} w={3 / s} /><Stroke d={line(d * 13, 18, d * 32, 32)} at={at + 12} frames={12} color={color} w={3 / s} />
        <Stroke d={line(d * 5, -32, d * 16, -48)} at={at + 14} frames={10} color={color} w={3 / s} />
      </g>
    ))}
  </g>
);
export const MicIcon: React.FC<{ x: number; y: number; s?: number; at: number; lit: number }> = ({ x, y, s = 1, at, lit }) => {
  const col = lit > 0.5 ? C.alarm : C.secondary;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} style={{ filter: lit > 0.5 ? "drop-shadow(0 0 10px rgba(255,59,48,0.7))" : undefined }}>
      <Stroke d={rrect(-9, -24, 18, 34, 9)} at={at} frames={18} color={col} w={3 / s} />
      <Stroke d="M-18 -4C-18 14 18 14 18 -4" at={at + 4} frames={18} color={col} w={3 / s} />
      <Stroke d={line(0, 12, 0, 26)} at={at + 8} frames={10} color={col} w={3 / s} />
      <Stroke d={line(-10, 26, 10, 26)} at={at + 10} frames={10} color={col} w={3 / s} />
    </g>
  );
};
export const Phone: React.FC<{ at: number; call: number; ended: number; micLit: number; micAt: number }> = ({ at, call, ended, micLit, micAt }) => {
  const f = useFrame();
  const endP = settle(clamp01((f - ended) / 16));
  return (
    <>
      <Stroke d={rrect(-150, -300, 300, 560, 52)} at={at} frames={46} />
      <Stroke d={rrect(-128, -268, 256, 500, 30)} at={at + 8} frames={40} color={C.secondary} />
      <Stroke d={line(-34, -284, 34, -284)} at={at + 14} frames={16} color={C.secondary} />
      {/* the call screen */}
      <g opacity={smooth(at + 30, at + 50, f)}>
        <Stroke d={circle(0, -185, 34)} at={at + 30} frames={26} />
        <Stroke d={arc(0, -112, 44, 215, 325)} at={at + 34} frames={26} />
        <g opacity={1 - endP}><text x={0} y={-34} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={42} fill={C.text}>Call</text></g>
        <g opacity={endP}><text x={0} y={-34} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={36} fill={C.secondary}>Call ended</text></g>
        <text x={0} y={8} textAnchor="middle" fontFamily={FONT.mono} fontWeight={500} fontSize={26} fill={C.secondary} opacity={1 - endP}>00:42</text>
        {/* the red hang-up button */}
        <circle cx={0} cy={118} r={50} fill={endP > 0.5 ? "#2a2a2c" : C.alarm} opacity={0.95} style={{ filter: endP < 0.5 ? "drop-shadow(0 0 16px rgba(255,59,48,0.55))" : undefined }} />
        <g transform="translate(0 118) rotate(135)"><Stroke d="M-22 6C-22 -14 22 -14 22 6" p={1} color={C.text} w={7} /><Stroke d={line(-22, 6, -22, 16)} p={1} color={C.text} w={7} /><Stroke d={line(22, 6, 22, 16)} p={1} color={C.text} w={7} /></g>
      </g>
      <MicIcon x={0} y={-322} s={1.1} at={micAt} lit={micLit} />
    </>
  );
};

export const S9World: React.FC = () => {
  const f = useFrame();
  const [a, b] = ART.window[2];
  if (f < a - 30 || f > b + 40) return null;
  const micOff = smooth(c10.micOff, c10.micOff + 14, f), lit = f >= cue.micOn ? 1 - micOff : 0, micStarted = f >= cue.micOn - 14;
  // the finger tap
  const tapP = clamp01((f - (cue.tap - 12)) / 12), tapHit = f - cue.tap;
  const ring1 = clamp01(tapHit / 30), ring2 = clamp01((tapHit - 6) / 30);
  const fade10 = smooth(c10.ringStart - 10, c10.ringStart + 14, f);
  return (
    <Obj at={stationAt(2)} r={820} art z={2}>
      <Local>
        <g transform={`translate(0 ${PHONE.y})`}>
          <Phone at={cue.phone} call={cue.callTone} ended={cue.ended} micLit={lit} micAt={cue.phone + 30} />
          {/* the finger and its ripple on the red button */}
          {f >= cue.tap - 12 && f < cue.tap + 36 && (
            <>
              <circle cx={lerp(70, 6, glide(tapP))} cy={lerp(210, 124, glide(tapP))} r={lerp(30, 24, tapP)} fill="rgba(245,245,247,0.22)" stroke={C.text} strokeWidth={2.5} opacity={1 - smooth(cue.tap + 10, cue.tap + 26, f)} />
              {tapHit >= 0 && <circle cx={0} cy={118} r={50 + ring1 * 70} fill="none" stroke={C.text} strokeWidth={3} opacity={0.7 * (1 - ring1)} />}
              {tapHit >= 6 && <circle cx={0} cy={118} r={50 + ring2 * 90} fill="none" stroke={C.alarm} strokeWidth={3} opacity={0.6 * (1 - ring2)} />}
            </>
          )}
          {/* sound keeps radiating from the lit mic */}
          {micStarted && lit > 0.05 && [0, 1, 2, 3].map((i) => {
            const t = ((f - cue.micOn) / 64 + i * 0.25) % 1;
            return <path key={i} d={arc(0, -322, 40 + t * 230, 200, 340)} fill="none" stroke={C.alarm} strokeWidth={3} strokeLinecap="round" opacity={(1 - t) * 0.75 * lit * smooth(0, 0.1, t)} />;
          })}
          {/* secure app: a white shield beside the phone; the bug flashes in red */}
          <Stroke d="M236 -230L286 -210V-160C286 -130 262 -112 236 -100C210 -112 186 -130 186 -160V-210Z" at={cue.secure} frames={32} />
          <Stroke d={poly([[214, -160], [232, -142], [262, -178]])} at={cue.secure + 18} frames={18} />
        </g>
        <BugGlyph x={-250} y={-200} s={1.25} at={cue.bug} />
      </Local>
      <div style={{ opacity: 1 - fade10 }}>
        <WPill x={0} y={338} at={cue.fact} out={cue.sun - 24} size={26} tone="danger" style={{ textTransform: "none", letterSpacing: "0.02em" }}>Signal call bug · CVE-2026-113380</WPill>
      </div>
    </Obj>
  );
};

import React from "react";
import { C, FONT } from "../theme";
import { useFrame } from "../clock";
import { clamp01, lerp, smooth, Rise } from "../motion";
import { glide, settle, swing } from "../easing";
import { Local, Stroke, check, line, rrect } from "../components/draw";
import { Abs, Panel, T, WPill } from "../components/art";
import { Obj } from "../world";
import { stationAt } from "../components/map";
import { cue } from "../cues/s08";

const SERVER = { x: 560, y: 0 };
const FIELD = { x: 330, y: 330 };
/** the app icon: a rounded square with a 2x2 grid of dots */
const AppIcon: React.FC<{ x: number; y: number; s: number; glow: number }> = ({ x, y, s, glow }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} style={{ filter: glow > 0 ? `drop-shadow(0 0 ${14 * glow}px rgba(245,245,247,0.6))` : undefined }}>
    <rect x={-46} y={-46} width={92} height={92} rx={22} fill="#0B0C0F" stroke={C.text} strokeWidth={3 / s} />
    {[[-16, -16], [16, -16], [-16, 16], [16, 16]].map(([dx, dy], i) => <circle key={i} cx={dx} cy={dy} r={7} fill={C.text} />)}
  </g>
);
export const S8World: React.FC = () => {
  const f = useFrame();
  if (f < cue.glideStart - 20 || f > cue.beaconGreen + 400) return null;
  const sIn = settle(clamp01((f - cue.server) / 30));
  // the icon: dormant in the city, lifts, flies along an arc, lands on the green server
  const appIn = smooth(cue.app - 4, cue.app + 14, f), fly = swing(clamp01((f - cue.lift) / (cue.land - cue.lift)));
  const p0 = { x: 20, y: 30 }, c = { x: 300, y: -330 }, p1 = { x: SERVER.x, y: SERVER.y - 30 };
  const ax = (1 - fly) ** 2 * p0.x + 2 * (1 - fly) * fly * c.x + fly ** 2 * p1.x, ay = (1 - fly) ** 2 * p0.y + 2 * (1 - fly) * fly * c.y + fly ** 2 * p1.y;
  const lift = f >= cue.lift ? settle(clamp01((f - cue.lift) / 10)) : 0;
  const sc = lerp(1, 1.18, Math.sin(Math.PI * clamp01((f - cue.lift) / (cue.land - cue.lift)))) * (f >= cue.land ? 1 + 0.08 * Math.sin(clamp01((f - cue.land) / 12) * Math.PI) : 1);
  const landed = f >= cue.land;
  const typed = Math.floor(clamp01((f - cue.type1) / 24) * 4.999);
  return (
    <Obj at={stationAt(3)} r={1000} art z={2}>
      <Local>
        {/* the safe server: green outline, three slots, a green LED */}
        <Stroke d={rrect(SERVER.x - 110, SERVER.y - 130, 220, 300, 16)} at={cue.server} frames={36} color={C.trust} glow="rgba(52,199,89,0.25)" />
        {[-70, 0, 70].map((dy, i) => <Stroke key={i} d={line(SERVER.x - 80, SERVER.y + dy, SERVER.x + 80, SERVER.y + dy)} at={cue.server + 8 + i * 4} frames={20} color={C.trust} />)}
        <circle cx={SERVER.x + 74} cy={SERVER.y - 100} r={7} fill={C.trust} opacity={sIn * (0.7 + 0.3 * Math.sin(f / 12))} />
        {f >= cue.app - 4 && <g opacity={appIn}><AppIcon x={f < cue.lift ? p0.x : ax} y={f < cue.lift ? p0.y : ay - lift * 12} s={sc} glow={f < cue.lift ? appIn : 1} /></g>}
        {f >= cue.lift && f < cue.land && <Stroke d={`M${p0.x} ${p0.y}Q${c.x} ${c.y} ${p1.x} ${p1.y}`} dotted={12} p={swing(clamp01((f - cue.lift) / (cue.land - cue.lift)))} color={C.secondary} opacity={0.6} />}
        {/* the password field */}
        <rect x={FIELD.x - 190} y={FIELD.y - 40} width={380} height={80} rx={20} fill={C.glass} stroke={C.glassStroke} strokeWidth={1.5} opacity={settle(clamp01((f - cue.pw + 10) / 22))} />
        {f >= cue.pw - 8 && [0, 1, 2, 3].map((i) => {
          const oldO = 1 - smooth(cue.type1 + i * 6 - 2, cue.type1 + i * 6 + 6, f), newO = i < typed ? 1 : 0;
          return <g key={i}><circle cx={FIELD.x - 100 + i * 66} cy={FIELD.y} r={11} fill={C.secondary} opacity={oldO * settle(clamp01((f - cue.pw + 8) / 16))} /><circle cx={FIELD.x - 100 + i * 66} cy={FIELD.y} r={11} fill={C.trust} opacity={newO} /></g>;
        })}
        <Stroke d={check(FIELD.x + 150, FIELD.y, 40)} at={cue.check} frames={18} color={C.trust} w={4} />
      </Local>
      <WPill x={SERVER.x} y={SERVER.y + 230} at={cue.server + 18} size={26} tone="trust">SAFE SERVER</WPill>
      {f >= cue.shift && f < cue.land + 10 && <WPill x={ax} y={ay - 92} at={cue.shift} out={cue.land - 2} size={26}>SHIFT</WPill>}
      <Abs x={FIELD.x} y={FIELD.y - 88}><Rise at={cue.pw} frames={20}><T size={24} mono color={C.secondary}>PASSWORD</T></Rise></Abs>
    </Obj>
  );
};

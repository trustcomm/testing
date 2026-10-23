import React, { useMemo } from "react";
import { C } from "../theme";
import { CUES } from "../timeline";
import { useFrame } from "../clock";
import { Rise, clamp01, easeInOutCubic, easeOutCubic, lerp, prog, springAt } from "../motion";
import { Canvas, line, pointsOnPath, rrect } from "../components/draw";
import { HALL, ServerRack } from "../components/rack";
import { Dust, type Pt } from "../components/dust";
import { KWord, headline } from "../components/kinetic";
import { HoodedFigure } from "../components/c-figure";
import { LoginBox } from "../components/c-login";
import { walkPhase, walkSpeed, walkX, FLOOR_Y } from "../cues/s08";

const RED = "rgba(255,59,48,";
/** the racks as dust: along every outline, slot line and LED */
let rackPts: Pt[] | null = null;
const getRackPoints = (): Pt[] => {
  if (rackPts) return rackPts;
  const out: Pt[] = [];
  for (const x of HALL.xs) {
    const sx = x - HALL.w / 2, gap = HALL.h / 6;
    out.push(...pointsOnPath(rrect(sx, HALL.top, HALL.w, HALL.h, 14), 190));
    for (let i = 1; i < 6; i++) out.push(...pointsOnPath(line(sx, HALL.top + gap * i, sx + HALL.w, HALL.top + gap * i), 15));
    for (let i = 0; i < 6; i++) { out.push(...pointsOnPath(line(sx + HALL.w - 54, HALL.top + gap * (i + 0.5), sx + HALL.w - 18, HALL.top + gap * (i + 0.5)), 5)); out.push({ x: sx + 22, y: HALL.top + gap * (i + 0.5) }); }
  }
  return (rackPts = out);
};

/** a classic pointer, tip at (0, 0), about 85 x 122 px */
const CURSOR = "M0 0L0 104L25 82L43 122L63 113L45 74L79 74Z";

/** a keyword slot that keeps its place in the line before it rises in */
const Slot: React.FC<{ at: number; out?: number; children: React.ReactNode; hidden: React.ReactNode }> = ({ at, out, children, hidden }) => (
  <div style={{ position: "relative" }}>
    <div style={{ visibility: "hidden" }}>{hidden}</div>
    <div style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap" }}><Rise at={at} frames={10} dy={18} blur={8} out={out}>{children}</Rise></div>
  </div>
);

export const S8: React.FC = () => {
  const f = useFrame(), c = CUES.S8.cue;
  const pts = useMemo(getRackPoints, []);
  // ---- the red wave: a slightly tilted front rises from the floor of the hall to its top; everything under it is red ----
  const since = f - c.hit, k = clamp01(since / c.waveFrames), kk = k ** 1.12;
  const frontY = lerp(HALL.top + HALL.h + 6, HALL.top - 60, kk), tilt = 0.06;
  const yL = frontY - tilt * 560, yR = frontY + tilt * 560;
  const waving = since >= 0 && k < 1, allRed = since >= 0 && k >= 1;
  const dissolve = prog(f, c.dissolve, c.dissolveEnd - c.dissolve), ds = easeInOutCubic(dissolve);
  const rackAlpha = 1 - clamp01(dissolve * 1.5), glowK = since < 0 ? 0 : Math.exp(-since / 16);
  // ---- the hacker ----
  const x = walkX(f), v = walkSpeed(f), figIn = clamp01((f - c.walkStart) / 12), walkAmp = clamp01(v / 5);
  const turn = clamp01((f - c.turnStart) / (c.turnEnd - c.turnStart)), flip = Math.cos(Math.PI * easeInOutCubic(turn));
  const raise = springAt(f, c.hit - 2), figOpacity = 1 - clamp01(dissolve * 1.3);
  // ---- the cursor ----
  const cs = springAt(f, c.cursor - 2), press = f >= c.click && f < c.click + 5 ? 0.9 : 1, ring = easeOutCubic((f - c.click) / 16);
  const CUR = { x: 470, y: 640 };
  return (
    <>
      {since >= 0 && <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: 1 - dissolve, background: `radial-gradient(circle 640px at 540px 770px, ${RED}${0.2 * glowK}) 0%, ${RED}0) 100%)` }} />}
      <Canvas>
        <defs>
          <clipPath id="s8-below"><polygon points={`-200,${yL} 1300,${yR} 1300,1700 -200,1700`} /></clipPath>
          <clipPath id="s8-above"><polygon points={`-200,-300 1300,-300 1300,${yR} -200,${yL}`} /></clipPath>
          <linearGradient id="s8-band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.alarm} stopOpacity="0.5" /><stop offset="1" stopColor={C.alarm} stopOpacity="0" /></linearGradient>
          <linearGradient id="s8-hfade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" /><stop offset="0.12" stopColor="#fff" /><stop offset="0.88" stopColor="#fff" /><stop offset="1" stopColor="#000" /></linearGradient>
          <mask id="s8-bandmask" maskUnits="userSpaceOnUse" x={60} y={-400} width={960} height={2400}><rect x={60} y={-400} width={960} height={2400} fill="url(#s8-hfade)" /></mask>
        </defs>
        {/* the six racks of the hall: exactly as S7 leaves them (white, still) until the wave */}
        {!allRed && (
          <g clipPath={waving ? "url(#s8-above)" : undefined}>
            {HALL.xs.map((rx) => <ServerRack key={rx} x={rx} />)}
          </g>
        )}
        {(waving || allRed) && (
          <g clipPath={waving ? "url(#s8-below)" : undefined} style={{ filter: rackAlpha > 0 ? `drop-shadow(0 0 ${7 + 9 * glowK}px rgba(255,59,48,${0.35 + 0.4 * glowK}))` : undefined }} opacity={rackAlpha}>
            {HALL.xs.map((rx) => <ServerRack key={rx} x={rx} color={C.alarm} />)}
          </g>
        )}
        {waving && (
          <g transform={`rotate(${(Math.atan(tilt) * 180) / Math.PI} 540 ${frontY})`}>
            <g mask="url(#s8-bandmask)">
              <rect x={60} y={frontY} width={960} height={150} fill="url(#s8-band)" opacity={0.9} />
              <line x1={60} y1={frontY} x2={1020} y2={frontY} stroke="#FFD9D5" strokeWidth={3} strokeLinecap="round" opacity={0.95} style={{ filter: `drop-shadow(0 0 10px ${C.alarm})` }} />
            </g>
          </g>
        )}
      </Canvas>
      {dissolve > 0 && <Dust points={pts} p={ds} seed={8} color={C.alarm} size={2.8} drift={340} spread={1.1} stagger={0.5} />}
      {/* the login box (it stands in front of the racks) */}
      <div style={{ opacity: 1 - clamp01(dissolve * 3) }}><LoginBox at={c.boxIn} listen={c.listen} strike={c.strike} fade={c.boxOut} /></div>
      {/* the hooded figure (red stroke, black fill: he stands in front of everything) */}
      <Canvas style={{ opacity: figOpacity }}>
        {f >= c.walkStart - 2 && <HoodedFigure x={x} y={FLOOR_Y} phase={walkPhase(f)} walk={walkAmp} raise={raise} flip={flip} p={easeOutCubic(figIn)} />}
        {cs > 0 && (
          <g transform={`translate(${CUR.x} ${CUR.y - (1 - cs) * 40}) scale(${1.5 * (0.4 + 0.6 * cs) * press})`} opacity={clamp01(cs * 1.6) * (1 - clamp01(dissolve * 2))} style={{ filter: `drop-shadow(0 0 12px rgba(255,59,48,0.7))` }}>
            <path d={CURSOR} fill="#000" stroke={C.alarm} strokeWidth={3 / (1.5 * (0.4 + 0.6 * cs))} strokeLinejoin="round" strokeLinecap="round" />
          </g>
        )}
        {ring > 0 && ring < 1 && <circle cx={CUR.x} cy={CUR.y} r={16 + 110 * ring} fill="none" stroke={C.alarm} strokeWidth={3} opacity={(1 - ring) * 0.9} />}
      </Canvas>
      {/* kinetic type above the hall */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 296, display: "flex", justifyContent: "center", gap: 38, ...headline(108), opacity: 1 - clamp01(dissolve * 3) }}>
        <Slot at={c.headA - 4} out={c.headOut} hidden="No"><KWord at={c.headA}>No</KWord></Slot>
        <Slot at={c.headB - 4} out={c.headOut} hidden="login."><KWord at={c.headB} underline="danger" underlineAt={c.strike}>login.</KWord></Slot>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 296, display: "flex", justifyContent: "center", gap: 38, ...headline(108), opacity: 1 - clamp01(dissolve * 3) }}>
        <Slot at={c.headC - 4} hidden="Full"><KWord at={c.headC - 2} pop={false}>Full</KWord></Slot>
        <Slot at={c.headD - 4} hidden="control."><KWord at={c.headD} underline="danger" underlineAt={c.headD + 2}>control.</KWord></Slot>
      </div>
    </>
  );
};

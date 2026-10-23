import React, { useMemo } from "react";
import { C, FONT } from "../theme";
import { CUES } from "../timeline";
import { useFrame } from "../clock";
import { At, Rise, clamp01, easeOutCubic, prog } from "../motion";
import { Canvas, Stroke, circle, line, pointsOnPath, rrect } from "../components/draw";
import { Globe, SERVERS } from "../components/globe";
import { textPoints, type Pt } from "../components/dust";
import { mono } from "../components/kinetic";

const CAL = { x: 206, y: 470, w: 668, h: 670 }, GRID = { x0: 246, y0: 640, cw: 84, ch: 92 };
const OCT_OFFSET = 3;                         // 1 October 2026 is a Thursday (Monday-first columns)
const dayCell = (d: number) => { const i = d - 1 + OCT_OFFSET; return { cx: GRID.x0 + GRID.cw * (i % 7) + GRID.cw / 2, cy: GRID.y0 + GRID.ch * Math.floor(i / 7) + GRID.ch / 2 }; };
const DAYS = Array.from({ length: 31 }, (_, k) => k + 1);

let calendarPoints: Pt[] | null = null;
/** the calendar as dust: points along its outline, rings, header and every number */
const getCalendarPoints = (): Pt[] => {
  if (calendarPoints) return calendarPoints;
  const pts: Pt[] = [...pointsOnPath(rrect(CAL.x, CAL.y, CAL.w, CAL.h, 28), 520), ...pointsOnPath(line(246, 568, 834, 568), 90), ...pointsOnPath(line(380, 448, 380, 492), 14), ...pointsOnPath(line(700, 448, 700, 492), 14)];
  pts.push(...textPoints("OCTOBER 2026", { font: `500 34px "JetBrains Mono"`, x: 540, y: 528, step: 3 }));
  DAYS.forEach((d) => { const c = dayCell(d); pts.push(...textPoints(String(d), { font: `500 28px "JetBrains Mono"`, x: c.cx, y: c.cy, step: 3 })); });
  return (calendarPoints = pts);
};

export const S1: React.FC = () => {
  const f = useFrame(), c = CUES.S1.cue;
  const cal = useMemo(getCalendarPoints, []);
  const morph = prog(f, c.morphStart, c.morphEnd - c.morphStart);
  const calAlpha = 1 - clamp01((f - c.morphStart) / 6);
  // the 21st cell
  const cell = dayCell(21), glow = easeOutCubic((f - c.f21) / 6), grow = easeOutCubic((f - c.f21) / (c.scaleEnd - c.f21));
  // the globe: servers light one by one, then flash red together
  const lit = SERVERS.map((_, i) => clamp01((f - (c.serversStart + (i * (c.serversEnd - c.serversStart)) / SERVERS.length)) / 4));
  const since = f - c.hit, alarm = clamp01(since / 2), glowK = since < 0 ? 0 : Math.exp(-since / 14);
  const ring = (delay: number) => { const e = easeOutCubic((since - delay) / 30); return since - delay < 0 ? null : <circle key={delay} cx={540} cy={800} r={330 * (0.92 + 1.5 * e)} fill="none" stroke={C.alarm} strokeWidth={3} opacity={(1 - e) * 0.9} />; };
  return (
    <>
      {since >= 0 && <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, background: `radial-gradient(circle 560px at 540px 800px, rgba(255,59,48,${0.16 * glowK}) 0%, rgba(255,59,48,0) 100%)` }} />}
      {morph > 0 && <Globe frame={f} from={cal} morph={morph} lit={lit} alarm={alarm} alarmGlow={glowK} />}
      <Canvas>{since >= 0 && ring(0)}{since >= 5 && ring(5)}</Canvas>
      {calAlpha > 0 && (
        <>
          <Canvas style={{ opacity: calAlpha }}>
            <Stroke d={rrect(CAL.x, CAL.y, CAL.w, CAL.h, 28)} at={0} frames={11} />
            <Stroke d={line(246, 568, 834, 568)} at={4} frames={8} />
            <Stroke d={line(380, 448, 380, 492)} at={2} frames={7} /><Stroke d={line(700, 448, 700, 492)} at={2} frames={7} />
            {/* the 21st cell: red outline + glow on "21" (it starts 4 frames before the word) */}
            <rect x={cell.cx - 40} y={cell.cy - 44} width={80} height={88} rx={14} fill={`rgba(255,59,48,${0.16 * glow})`} stroke={C.alarm} strokeWidth={3} opacity={clamp01((f - (c.f21 - 4)) / 4)} style={{ filter: `drop-shadow(0 0 ${14 * glow}px ${C.alarm})` }} />
          </Canvas>
          <div style={{ opacity: calAlpha }}>
            <At x={540} y={528}><Rise at={6} frames={6} dy={8} blur={4}><div style={{ ...mono(34), letterSpacing: "0.12em" }}>OCTOBER 2026</div></Rise></At>
            {["M", "T", "W", "T", "F", "S", "S"].map((l, i) => <At key={i} x={GRID.x0 + GRID.cw * i + GRID.cw / 2} y={606}><Rise at={8} frames={5} dy={4} blur={2}><div style={mono(20, C.secondary)}>{l}</div></Rise></At>)}
            {DAYS.map((d) => { const q = dayCell(d); if (d === 21) return null; return <At key={d} x={q.cx} y={q.cy}><Rise at={8 + (d % 7)} frames={5} dy={4} blur={2}><div style={mono(28, C.secondary)}>{d}</div></Rise></At>; })}
            <At x={cell.cx} y={cell.cy}><div style={{ ...mono(28, f >= c.f21 ? C.alarm : C.secondary), opacity: clamp01((f - 8) / 5), fontWeight: 700, transform: `scale(${1 + 1.5 * grow})`, textShadow: glow > 0 ? `0 0 ${18 * glow}px rgba(255,59,48,0.8)` : undefined, fontFamily: FONT.mono }}>21</div></At>
          </div>
        </>
      )}
    </>
  );
};

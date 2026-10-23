// The browser window of S2 / S3 / S4 (and the WordPress pill under it). One pose function of the ABSOLUTE frame drives it across the three scenes, so the end of S2
// and the start of S3 (and S3 -> S4) are the same picture by construction: S2 draws it pushed in close to the camera, S3 lifts it away like an X-ray.
import React from "react";
import { C, FONT, STROKE_W } from "../theme";
import { CUES } from "../timeline";
import { useFrame } from "../clock";
import { clamp01, easeInOutCubic, easeOutCubic, lerp, springAt } from "../motion";
import { Canvas, Stroke, circle, line, poly, rrect } from "./draw";
import { Pill } from "./pill";

export const WIN = { x: 180, y: 590, w: 720, h: 420 } as const;      // window box in S2 (centre 540, 800), canvas pixels
export const ADDRESS = "aapki-website.com";
export const TYPE_CPS_ADDR = 30;
const END_S = 1.18, TOP_S = 0.7, TOP_CY = 312 + (WIN.h * TOP_S) / 2, TOP_PILL_Y = 650, PILL_DY = 56;

export interface WinPose { s: number; cx: number; cy: number; alpha: number; pillX: number; pillY: number; pillS: number; lift: number }
/** where the window is at a frame: arrives (S2), pushes in on the second "aapki" (S2), lifts away to the top of the stack on "WordPress ... chalta" (S3) */
export function winPose(f: number): WinPose {
  const c2 = CUES.S2.cue, c3 = CUES.S3.cue;
  const arrive = easeOutCubic((f - c2.winStart) / 22);
  const push = easeInOutCubic((f - c2.pushStart) / (c2.pushEnd - c2.pushStart));
  const lift = easeInOutCubic((f - c3.liftStart) / (c3.liftEnd - c3.liftStart));
  const s0 = lerp(1, END_S, push) * (0.93 + 0.07 * arrive);
  const pillBase = 800 + (WIN.y + WIN.h + PILL_DY - 800) * s0;
  return { s: lerp(s0, TOP_S, lift), cx: 540, cy: lerp(800, TOP_CY, lift), alpha: lerp(1, 0.85, lift) - 0.4 * Math.sin(Math.PI * lift), pillX: 540, pillY: lerp(pillBase, TOP_PILL_Y, lift), pillS: lerp(s0, 1, lift), lift };
}
/** the top of the stack (what S3/S4 connect to): the pill's bottom edge */
export const PILL_BOTTOM = TOP_PILL_Y + 24;

/** the soft red outline: one heartbeat pulse (lub-dub) on the second "aapki" */
const bump = (t: number, rise: number, fall: number) => (t < 0 ? 0 : t < rise ? easeOutCubic(t / rise) : Math.exp(-(t - rise) / fall));
export const pulseAt = (f: number) => { const t = f - CUES.S2.cue.push; return clamp01(bump(t, 2, 7) + 0.6 * bump(t - 5, 2, 8)); };

const caretOn = (f: number) => Math.floor(f / 7) % 2 === 0;
/** the window drawn in its own pose. `out` (0..1): S4 sends it away (blur + fade) */
export const BrowserWindow: React.FC<{ out?: number }> = ({ out = 0 }) => {
  const f = useFrame(), c = CUES.S2.cue, p = winPose(f);
  if (f < c.winStart || out >= 1) return null;
  const sw = STROKE_W / p.s, a = c.winStart;
  const T = `translate(${p.cx} ${p.cy}) scale(${p.s}) translate(${-WIN.w / 2} ${-WIN.h / 2})`;
  const n = Math.max(0, Math.min(ADDRESS.length, Math.floor(((f - c.type) / 30) * TYPE_CPS_ADDR)));
  const typing = f >= c.type && n < ADDRESS.length;
  const showCaret = f >= c.type && f < c.type + (ADDRESS.length * 30) / TYPE_CPS_ADDR + 14 && caretOn(f);
  const fill = clamp01((f - a - 6) / 10), pulse = pulseAt(f), e = clamp01((f - c.push) / 30), g = 6 + 16 * easeOutCubic(e);
  const body = (i: number) => a + 18 + i * 5;       // the page wireframe loads while the line "aapki website WordPress" is spoken
  return (
    <Canvas style={{ opacity: p.alpha * (1 - out), filter: out > 0 ? `blur(${out * 8}px)` : undefined, transform: out > 0 ? `translateY(${-out * 10}px)` : undefined }}>
      <g transform={T}>
        <path d={rrect(0, 0, WIN.w, WIN.h, 26)} fill={`rgba(255,255,255,${0.035 * fill})`} stroke="none" />
        <Stroke d={rrect(0, 0, WIN.w, WIN.h, 26)} at={a} frames={16} w={sw} />
        <Stroke d={line(0, 84, WIN.w, 84)} at={a + 4} frames={10} w={sw} />
        {[0, 1, 2].map((i) => <Stroke key={i} d={circle(46 + 36 * i, 42, 8)} at={a + 6 + i * 2} frames={8} w={sw} />)}
        <Stroke d={rrect(150, 14, 538, 56, 28)} at={a + 5} frames={12} w={sw} />
        <text x={180} y={43} fontFamily={FONT.mono} fontWeight={500} fontSize={38} fill={C.text} dominantBaseline="central" style={{ letterSpacing: "0.01em" }}>{ADDRESS.slice(0, n)}</text>
        {showCaret && <rect x={180 + n * 23.2 + 1} y={22} width={3} height={40} rx={1.5} fill={C.text} opacity={typing ? 1 : 0.8} />}
        {/* the page: a hero image placeholder and three lines of text */}
        <Stroke d={rrect(40, 116, 640, 150, 16)} at={body(0)} frames={14} w={sw} opacity={0.45} />
        <Stroke d={circle(596, 158, 14)} at={body(1)} frames={8} w={sw} opacity={0.45} />
        <Stroke d={poly([[72, 244], [158, 176], [220, 220], [292, 164], [390, 244]])} at={body(1)} frames={14} w={sw} opacity={0.45} />
        <Stroke d={line(40, 312, 460, 312)} at={body(2)} frames={12} w={sw} opacity={0.4} />
        <Stroke d={line(40, 352, 560, 352)} at={body(3)} frames={12} w={sw} opacity={0.4} />
        <Stroke d={line(40, 392, 330, 392)} at={body(4)} frames={12} w={sw} opacity={0.4} />
        {/* the soft red outline pulse (once, heartbeat-shaped) */}
        {pulse > 0.01 && <path d={rrect(-g, -g, WIN.w + 2 * g, WIN.h + 2 * g, 26 + g)} fill="none" stroke={C.alarm} strokeWidth={sw} opacity={0.95 * pulse} style={{ filter: `drop-shadow(0 0 ${12 * pulse}px ${C.alarm})` }} />}
      </g>
    </Canvas>
  );
};

/** the small "WordPress" pill under the window: springs in ON the word (S2), pops again when S3 says "WordPress", stays as the middle tier of the stack */
export const WordPressPill: React.FC<{ out?: number }> = ({ out = 0 }) => {
  const f = useFrame(), c2 = CUES.S2.cue, c3 = CUES.S3.cue, p = winPose(f);
  const s = springAt(f, c2.pill - 4);
  if (s <= 0 || out >= 1) return null;
  const t = (f - c3.wpPop) / 9, pop = t >= 0 && t <= 1 ? 1 + 0.08 * Math.sin(Math.PI * t) : 1;
  return (
    <div style={{ position: "absolute", left: p.pillX, top: p.pillY, transform: `translate(-50%, calc(-50% - ${out * 10}px)) scale(${p.pillS * (0.6 + 0.4 * s) * pop})`, opacity: clamp01(s * 1.6) * (1 - out), filter: out > 0 ? `blur(${out * 8}px)` : undefined }}>
      <Pill size={26}>WordPress</Pill>
    </div>
  );
};

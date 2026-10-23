// The severity gauge of S9: a thin white semicircle (0-10) with tick marks that write on, labels, a needle on a hub and a red value arc that follows the needle.
import React from "react";
import { C, FONT } from "../theme";
import { useFrame } from "../clock";
import { Canvas, Stroke, arc, line } from "./draw";
import { clamp01, easeInOutCubic, easeOutCubic } from "../motion";

export const GAUGE = { cx: 540, cy: 960, R: 330 };
/** angle (degrees, SVG: 0 = right, 90 = down) of a value 0..10: 180 (left) through 270 (up) to 360 (right) */
export const valAngle = (v: number) => 180 + 18 * v;
export const polar = (r: number, v: number) => { const a = (valAngle(v) * Math.PI) / 180; return { x: GAUGE.cx + r * Math.cos(a), y: GAUGE.cy + r * Math.sin(a) }; };
const tick = (i: number, r0: number, r1: number) => { const a = polar(r0, i / 2), b = polar(r1, i / 2); return line(a.x, a.y, b.x, b.y); };

export const Gauge: React.FC<{
  at: number; frames: number;       // the arc writes on over `frames` from frame `at`; ticks follow the pen
  v: number;                        // the needle's value (can overshoot)
  swing: number;                    // frame the needle is released (it is drawn lying at 0 before)
  f10: number;                      // frame the "10" label pops
  hit: number;                      // frame of the 9.2 slam
  glow?: number;                    // 0..1 extra red glow of the arc (decays after the hit)
}> = ({ at, frames, v, swing, f10, hit, glow = 0 }) => {
  const f = useFrame(), { cx, cy, R } = GAUGE;
  const k = 0.5 - 0.5 * Math.cos(Math.PI * clamp01((f - at) / frames));      // sine ease-in-out: it starts drawing at once (the gauge replaces S8's dust)
  const vv = Math.max(0, Math.min(10, v));
  const moving = f >= swing - 1, tipRed = clamp01((f - hit) / 4);
  const nTip = polar(R - 22, vv);
  const labelAt = (val: number, dx: number, dy: number, delay: number, pop = 0) => {
    const p = easeOutCubic((f - at - delay) / 9), pt = polar(R + 64, val);
    const t = (f - pop) / 9, s = pop && t >= 0 && t <= 1 ? 1 + 0.2 * Math.sin(Math.PI * t) : 1;
    if (p <= 0) return null;
    return <div key={val} style={{ position: "absolute", left: pt.x + dx, top: pt.y + dy, transform: `translate(-50%, -50%) scale(${s})`, opacity: p, fontFamily: FONT.mono, fontWeight: 500, fontSize: 30, color: pop && f >= pop ? C.text : C.secondary, letterSpacing: "0.04em" }}>{val}</div>;
  };
  return (
    <>
      <Canvas>
        {/* the track: a thin white arc, written on left to right */}
        <Stroke d={arc(cx, cy, R, 180, 360)} p={k} opacity={0.9} />
        {/* ticks: every whole number long, every half short; each appears when the pen passes it */}
        {Array.from({ length: 21 }, (_, i) => {
          const major = i % 2 === 0, p = clamp01((k - i / 20) * 12);
          return <Stroke key={i} d={tick(i, R + 14, R + (major ? 40 : 28))} p={p} color={major ? C.text : C.secondary} opacity={major ? 0.95 : 0.7} />;
        })}
        {/* the red value arc follows the needle */}
        {moving && vv > 0.05 && (
          <g style={{ filter: `drop-shadow(0 0 ${8 + 14 * glow}px rgba(255,59,48,${0.5 + 0.4 * glow}))` }}>
            <Stroke d={arc(cx, cy, R, 180, valAngle(vv))} p={1} color={C.alarm} w={5} />
          </g>
        )}
        {/* the needle: a thin line with a tail, on a hub */}
        <g transform={`rotate(${valAngle(vv)} ${cx} ${cy})`} opacity={easeOutCubic((f - at - 14) / 8)}>
          <line x1={cx - 38} y1={cy} x2={cx + R - 22} y2={cy} stroke={C.text} strokeWidth={4} strokeLinecap="round" />
        </g>
        {f >= at + 14 && <circle cx={nTip.x} cy={nTip.y} r={7} fill={C.alarm} opacity={tipRed} style={{ filter: `drop-shadow(0 0 8px ${C.alarm})` }} />}
        <circle cx={cx} cy={cy} r={17} fill="#000" stroke={C.text} strokeWidth={3} opacity={easeOutCubic((f - at - 10) / 8)} />
        <circle cx={cx} cy={cy} r={5} fill={C.text} opacity={easeOutCubic((f - at - 10) / 8)} />
      </Canvas>
      {labelAt(0, -6, 38, 6)}
      {labelAt(5, 0, 0, 14)}
      {labelAt(10, 6, 38, 22, f10)}
    </>
  );
};

// The magnifying glass of S4: a line-art lens (3 px ring, faint glass tint, a highlight arc, a capsule handle) that sweeps across the PHP panel and locks over the two bugs.
// `lensGeo` is also what the Stack uses to mask the panel inside the lens and draw it magnified there.
import React from "react";
import { C } from "../theme";
import { CUES } from "../timeline";
import { useFrame } from "../clock";
import { clamp01, easeOutCubic, lerp, springAt } from "../motion";
import { Canvas, arc, rrect } from "./draw";
import { BUG_ROW_Y, type LensGeo } from "./a-stack";

/** the viewfinder brackets that lock around the caught bugs (inside the glass): half-extent and arm length */
export const BRACKET = { hx: 100, hy: 70, arm: 18 };
export const bracketPath = (hx = BRACKET.hx, hy = BRACKET.hy, a = BRACKET.arm) => `M${-hx} ${-hy + a}V${-hy}H${-hx + a}M${hx - a} ${-hy}H${hx}V${-hy + a}M${hx} ${hy - a}V${hy}H${hx - a}M${-hx + a} ${hy}H${-hx}V${hy - a}`;
export const LENS = { r: 130, k: 1.15, x1: 540, y1: BUG_ROW_Y, p0: [150, 806], pc: [430, 840] } as const;
const sweepT = (f: number) => { const c = CUES.S4.cue; return clamp01((f - c.lensStart) / (c.caught - c.lensStart)); };
const pathAt = (e: number) => { const q = 1 - e; return { x: q * q * LENS.p0[0] + 2 * q * e * LENS.pc[0] + e * e * LENS.x1, y: q * q * LENS.p0[1] + 2 * q * e * LENS.pc[1] + e * e * LENS.y1 }; };
const ease = (t: number) => 1 - (1 - t) ** 1.9;     // a swoosh: fast, then it brakes into focus

/** the lens at a frame (null before it exists) */
export const lensGeo = (f: number): LensGeo | null => {
  const c = CUES.S4.cue;
  if (f < c.lensStart) return null;
  const p = pathAt(ease(sweepT(f))), open = easeOutCubic((f - c.lensStart) / 7);
  return { x: p.x, y: p.y, r: lerp(50, LENS.r, open), k: lerp(1, LENS.k, open) };
};

const Star: React.FC<{ x: number; y: number; s: number; rot?: number }> = ({ x, y, s, rot = 0 }) => (
  <path d={`M0 ${-s}Q0 0 ${s} 0Q0 0 0 ${s}Q0 0 ${-s} 0Q0 0 0 ${-s}Z`} transform={`translate(${x} ${y}) rotate(${rot})`} fill={C.text} style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.8))" }} />
);

export const LensArt: React.FC = () => {
  const f = useFrame(), c = CUES.S4.cue, g = lensGeo(f);
  if (!g) return null;
  const al = clamp01((f - c.lensStart) / 4), t = sweepT(f);
  const lock = f >= c.caught ? 1 + 0.035 * Math.sin(Math.PI * clamp01((f - c.caught) / 8)) : 1;
  const r = g.r * lock;
  const spark = (at: number, len: number) => { const u = clamp01((f - at) / len); return u > 0 && u < 1 ? Math.sin(Math.PI * u) ** 0.8 : 0; };
  const bs = springAt(f, c.caught), s1 = spark(c.sparkle, 16), s2 = spark(c.sparkle + 7, 14);
  const hx = g.x + r * 0.7071, hy = g.y + r * 0.7071;
  const ghosts = t < 1 ? [0.07, 0.14, 0.21].map((d, i) => ({ ...pathAt(ease(clamp01(t - d))), a: 0.2 / (i + 1) })) : [];
  return (
    <Canvas style={{ opacity: al }}>
      {ghosts.map((q, i) => <circle key={i} cx={q.x} cy={q.y} r={r} fill="none" stroke={C.text} strokeWidth={3} opacity={q.a * (1 - t)} />)}
      <circle cx={g.x} cy={g.y} r={r} fill="rgba(255,255,255,0.045)" />
      <path d={arc(g.x, g.y, r - 15, 196, 258)} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={3} strokeLinecap="round" />
      <path d={arc(g.x, g.y, r - 15, 270, 286)} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={3} strokeLinecap="round" />
      <circle cx={g.x} cy={g.y} r={r} fill="none" stroke={C.text} strokeWidth={3} />
      <path d={rrect(-13, -3, 26, 72, 13)} transform={`translate(${hx} ${hy}) rotate(-45)`} fill="rgba(0,0,0,0.5)" stroke={C.text} strokeWidth={3} strokeLinejoin="round" />
      {bs > 0 && <path d={bracketPath()} transform={`translate(${g.x} ${g.y}) scale(${1 + 0.45 * (1 - bs)})`} opacity={clamp01(bs * 1.6)} fill="none" stroke={C.text} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />}
      {s1 > 0 && <Star x={g.x - r * 0.62} y={g.y - r * 0.62} s={26 * s1} rot={s1 * 25} />}
      {s2 > 0 && <Star x={g.x + r * 0.5} y={g.y - r * 0.58} s={13 * s2} rot={-s2 * 20} />}
    </Canvas>
  );
};

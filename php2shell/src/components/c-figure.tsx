// The hooded figure of S8: a side-view line-art silhouette (red 3 px stroke, black fill so it stands IN FRONT of the racks), walks with a real
// walk cycle (the phase follows the distance walked, so the feet never slide), a quiet hunch, a turn (flip) and a raised arm.
// Local coordinates: origin = the floor under the figure, the figure faces +x, about 395 px tall.
import React from "react";
import { C } from "../theme";
import { Stroke } from "./draw";
import { clamp01 } from "../motion";

type P = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const dirOf = (deg: number, len: number): P => [Math.sin(rad(deg)) * len, Math.cos(rad(deg)) * len];
const addP = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const fmt = (pts: P[]) => pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L");

/** a closed sleeve (trouser leg, arm) around a polyline, `widths` per point */
const limb = (pts: P[], widths: number[]): string => {
  const left: P[] = [], right: P[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const hw = widths[i] / 2;
    left.push([p[0] - dy * hw, p[1] + dx * hw]); right.push([p[0] + dy * hw, p[1] - dx * hw]);
  });
  return `M${fmt([...left, ...right.reverse()])}Z`;
};

const HOOD = "M20 -110C54 -122 68 -150 64 -180C60 -214 30 -236 -6 -236C-34 -236 -62 -216 -80 -186C-94 -162 -82 -130 -62 -114C-42 -104 -10 -104 20 -110Z";
const FACE = "M62 -204C42 -216 10 -204 4 -172C0 -146 18 -122 48 -122";
const TORSO = "M-22 -116C-56 -92 -66 -46 -62 2L40 -6C46 -46 44 -84 28 -114Q4 -124 -22 -116Z";
const POCKET = "M-30 -32L26 -38";
const EYE: P = [32, -170];

/** the geometry of the figure at a moment of its walk (all paths in local coordinates) */
export const figureShape = (o: { phase: number; walk: number; raise: number }) => {
  const { phase, walk, raise } = o;
  const legs = [0, Math.PI].map((off) => {
    const ps = phase + off, th = walk * 25 * Math.sin(ps) + (1 - walk) * (off === 0 ? 8 : -8), flex = walk * 44 * Math.max(0, Math.cos(ps)) ** 1.2;
    const hip: P = [0, 0], knee = addP(hip, dirOf(th, 88)), ankle = addP(knee, dirOf(th - flex, 80));
    return { hip, knee, ankle };
  });
  const drop = Math.max(...legs.map((l) => l.ankle[1])) + 11;                        // the lowest foot touches the floor (y = 0)
  const place = (p: P): P => [p[0] - 4, p[1] - drop];
  const legPaths = legs.map((l) => {
    const pts = [l.hip, l.knee, l.ankle].map(place);
    const [ax, ay] = pts[2];
    return { pants: limb(pts, [38, 31, 23]), shoe: `M${ax - 12} ${ay - 7}L${ax + 13} ${ay - 7}L${ax + 36} ${ay + 5}L${ax + 36} ${ay + 11}L${ax - 12} ${ay + 11}Z` };
  });
  const hipY = -drop;
  const arms = [0, Math.PI].map((off) => {
    const ps = phase + off + Math.PI, sw = walk * 16 * Math.sin(ps);
    const upper = off === 0 ? 12 + sw + raise * 70 : 8 + sw, fore = upper + 52 + (off === 0 ? raise * (-34) : 0);
    const sh: P = [2, hipY - 104], el = addP(sh, dirOf(upper, 64)), wr = addP(el, dirOf(fore, 58));
    return { sleeve: limb([sh, el, wr], [27, 22, 18]), hand: wr };
  });
  return { legPaths, arms, hipY };
};

/** the shape follows the walk: phase (radians), walk amplitude 0..1, raise 0..1 (arm up), flip +1 (facing right) .. -1 (facing left) */
export const HoodedFigure: React.FC<{ x: number; y: number; phase?: number; walk?: number; raise?: number; flip?: number; lean?: number; p?: number; color?: string; opacity?: number; glow?: boolean }> = ({
  x, y, phase = 0, walk = 0, raise = 0, flip = 1, lean = 7, p = 1, color = C.alarm, opacity = 1, glow = true,
}) => {
  const { legPaths, arms, hipY } = figureShape({ phase, walk, raise });
  const fill = `rgba(0,0,0,${clamp01(p * 2)})`, sp = { p, color, fill, opacity } as const, ed = Math.abs(flip) < 0.04 ? 0.04 : flip;
  const upper = `rotate(${lean} 0 ${hipY}) translate(0 ${hipY})`;
  return (
    <g transform={`translate(${x} ${y}) scale(${ed} 1)`} style={{ filter: glow ? `drop-shadow(0 0 7px rgba(255,59,48,0.45))` : undefined }}>
      <Stroke d={legPaths[1].pants} {...sp} /><Stroke d={legPaths[1].shoe} {...sp} />
      <g transform={`rotate(${lean} 0 ${hipY})`}>
        <Stroke d={arms[1].sleeve} {...sp} />
        <g transform={`translate(0 ${hipY})`}>
          <Stroke d={TORSO} {...sp} /><Stroke d={POCKET} p={p} color={color} opacity={opacity * 0.9} />
        </g>
      </g>
      <Stroke d={legPaths[0].pants} {...sp} /><Stroke d={legPaths[0].shoe} {...sp} />
      <g transform={upper}>
        <Stroke d={HOOD} {...sp} /><Stroke d={FACE} p={p} color={color} opacity={opacity} />
        {p >= 1 && <circle cx={EYE[0]} cy={EYE[1]} r={5} fill={color} opacity={opacity} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />}
      </g>
      <g transform={`rotate(${lean} 0 ${hipY})`}>
        <Stroke d={arms[0].sleeve} {...sp} />
        {p >= 1 && <circle cx={arms[0].hand[0]} cy={arms[0].hand[1]} r={9} fill="#000" stroke={color} strokeWidth={3} opacity={opacity} />}
      </g>
    </g>
  );
};

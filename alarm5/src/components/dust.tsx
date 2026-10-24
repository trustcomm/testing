// Particles: 2-3 px white dots that shapes and text dissolve into and assemble from. Canvas 2D, seeded: every render is identical.
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { C, H, W } from "../theme";
import { rand, clamp01 } from "../motion";
import { swing as easeInOutCubic } from "../easing";

export interface Pt { x: number; y: number }
/** points of text, sampled from an off-screen canvas (the fonts are loaded before the first frame renders) */
export const textPoints = (text: string, o: { font: string; x: number; y: number; align?: CanvasTextAlign; step?: number; maxW?: number }): Pt[] => {
  const c = document.createElement("canvas"); c.width = W; c.height = 420;
  const g = c.getContext("2d")!; g.font = o.font; g.textAlign = o.align ?? "center"; g.textBaseline = "middle"; g.fillStyle = "#fff";
  g.fillText(text, o.align === "left" ? 0 : o.align === "right" ? W : W / 2, 210, o.maxW);
  const img = g.getImageData(0, 0, W, 420).data, step = o.step ?? 4, out: Pt[] = [];
  const dx = (o.align === "left" ? o.x : o.align === "right" ? o.x - W : o.x - W / 2);
  for (let y = 0; y < 420; y += step) for (let x = 0; x < W; x += step) if (img[(y * W + x) * 4 + 3] > 128) out.push({ x: x + dx, y: y + o.y - 210 });
  return out;
};

export interface DustProps {
  points: Pt[];
  /** 0 = every dot at its home (the assembled shape), 1 = fully dust (gone). Animate it up to dissolve, down to assemble. */
  p: number;
  seed?: number; size?: number; color?: string; alpha?: number;
  /** how far (px) the dust drifts, and in which general direction (radians; default: up and out) */
  drift?: number; dir?: number; spread?: number;
  /** 0..1: how much of the dissolve is staggered across the shape (by x position) */
  stagger?: number;
  style?: React.CSSProperties;
}
export const Dust: React.FC<DustProps> = ({ points, p, seed = 1, size = 2.5, color = C.text, alpha = 1, drift = 260, dir = -Math.PI / 2, spread = 1.6, stagger = 0.4, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const info = useMemo(() => {
    const xs = points.map((q) => q.x), lo = Math.min(...xs), hi = Math.max(...xs, lo + 1);
    return points.map((q, i) => ({ d: (q.x - lo) / (hi - lo), a: dir + (rand(i, seed) - 0.5) * spread * 2, s: 0.35 + rand(i, seed + 1) * 0.9, w: rand(i, seed + 2), r: 0.8 + rand(i, seed + 3) * 0.6 }));
  }, [points, seed, dir, spread]);
  useLayoutEffect(() => {
    const c = ref.current; if (!c) return;
    const g = c.getContext("2d")!; g.clearRect(0, 0, W, H); g.fillStyle = color;
    for (let i = 0; i < points.length; i++) {
      const o = info[i], local = clamp01((p - o.d * stagger * (1 - 0.0)) / (1 - stagger)), e = easeInOutCubic(local);
      if (e >= 1) continue;
      const dist = e * drift * o.s, x = points[i].x + Math.cos(o.a) * dist + Math.sin(e * 5 + o.w * 6) * 6 * e, y = points[i].y + Math.sin(o.a) * dist;
      g.globalAlpha = alpha * (1 - e) ** 1.4; g.beginPath(); g.arc(x, y, size * o.r * 0.5 + 0.4, 0, Math.PI * 2); g.fill();
    }
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", left: 0, top: 0, ...style }} />;
};

import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { formatValue } from "../brand/format";
import { progress } from "../brand/motion";
import { fonts, safe, safeWidth, semanticColor, stroke, tabularNums, themes, weights } from "../brand/tokens";
import { fit } from "../engine/fit";
import { revealFrames } from "../engine/pace";
import type { SceneProps } from "../engine/types";
import { NumberFormatSchema } from "./stat";

export const schema = z.object({
  nodes: z
    .array(z.object({ id: z.string().max(16), label: z.string().max(24), kind: z.enum(["company", "investor", "person", "bank"]).default("company") }))
    .min(2)
    .max(6),
  flows: z
    .array(
      z.object({
        from: z.string(),
        to: z.string(),
        amount: z.number().optional(),
        format: NumberFormatSchema.optional(),
        label: z.string().max(32).optional(),
        semantic: z.enum(["neutral", "growth", "loss"]).default("neutral"),
      }),
    )
    .min(1)
    .max(8),
});
export type Data = z.infer<typeof schema>;
/** anchor.flows = one word per flow arrow. */
export const anchorNames = ["flows"] as const;

const NODE_W = 340;
const NODE_H = 120;

/** Wordmark nodes on two rows; flat arrows drawn in sequence with amount labels. */
export const Component: React.FC<SceneProps<Data>> = ({ data, anchors, theme, voiceStart, voiceEnd }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fg = themes[theme].fg;
  const n = data.nodes.length;
  const top = n <= 3 ? [n] : [Math.ceil(n / 2), Math.floor(n / 2)];
  const pos: Record<string, { x: number; y: number }> = {};
  let k = 0;
  top.forEach((count, row) => {
    for (let c = 0; c < count; c++) {
      const x = safe.left + ((c + 0.5) * safeWidth) / count;
      const y = top.length === 1 ? (safe.top + safe.bottom) / 2 : row === 0 ? safe.top + 140 : safe.bottom - 140;
      pos[data.nodes[k++].id] = { x, y };
    }
  });
  const nodeAt = Math.round(voiceStart * fps);
  const at = revealFrames(data.flows.length, fps, voiceStart + 0.6, voiceEnd, anchors.flows ?? []);
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {data.flows.map((f, i) => {
          const a = pos[f.from];
          const b = pos[f.to];
          if (!a || !b) return null;
          const p = progress(frame, at[i], "slow");
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          // start/end at the node box edge (approx: ellipse-ish inset)
          const inset = (vx: number, vy: number) => Math.min(Math.abs(NODE_W / 2 / (vx || 1e-6)), Math.abs(NODE_H / 2 / (vy || 1e-6))) + 14;
          const sx = a.x + ux * inset(ux, uy);
          const sy = a.y + uy * inset(ux, uy);
          const ex = b.x - ux * inset(ux, uy);
          const ey = b.y - uy * inset(ux, uy);
          const cx = sx + (ex - sx) * p;
          const cy = sy + (ey - sy) * p;
          const c = semanticColor(f.semantic, theme);
          const head = 22;
          return (
            <g key={i}>
              <line x1={sx} y1={sy} x2={cx} y2={cy} stroke={c} strokeWidth={stroke.line * 2} />
              {p > 0.98 ? (
                <polygon
                  points={`${ex},${ey} ${ex - ux * head - uy * head * 0.6},${ey - uy * head + ux * head * 0.6} ${ex - ux * head + uy * head * 0.6},${ey - uy * head - ux * head * 0.6}`}
                  fill={c}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
      {data.flows.map((f, i) => {
        const a = pos[f.from];
        const b = pos[f.to];
        if (!a || !b || (f.amount === undefined && !f.label)) return null;
        const p = progress(frame, at[i] + 12, "standard");
        const text = [f.amount !== undefined && f.format ? formatValue(f.amount, f.format) : "", f.label ?? ""].filter(Boolean).join(" · ");
        return (
          <div
            key={`l${i}`}
            style={{
              position: "absolute",
              left: (a.x + b.x) / 2 - 200,
              width: 400,
              // above the arrow, never on it
              top: (a.y + b.y) / 2 - NODE_H / 2 - 64,
              textAlign: "center",
              fontFamily: fonts.numeric,
              fontWeight: weights.heavy,
              fontSize: 38,
              color: semanticColor(f.semantic, theme),
              opacity: p,
              ...tabularNums,
            }}
          >
            {text}
          </div>
        );
      })}
      {data.nodes.map((nd, i) => {
        const p = pos[nd.id];
        const pr = progress(frame, nodeAt + i * 3, "standard");
        const size = fit(nd.label, { maxWidth: NODE_W - 40, max: 52, min: 26, family: fonts.display, weight: weights.heavy });
        return (
          <div
            key={nd.id}
            style={{
              position: "absolute",
              left: p.x - NODE_W / 2,
              top: p.y - NODE_H / 2,
              width: NODE_W,
              height: NODE_H,
              boxSizing: "border-box",
              border: `${stroke.card}px solid ${fg}`,
              backgroundColor: themes[theme].bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.display,
              fontWeight: weights.heavy,
              fontSize: size,
              color: fg,
              opacity: pr,
            }}
          >
            {nd.label}
          </div>
        );
      })}
    </>
  );
};

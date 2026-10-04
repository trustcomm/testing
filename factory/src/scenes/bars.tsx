import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { formatValue } from "../brand/format";
import { progress, tween } from "../brand/motion";
import { fonts, grid, safe, safeWidth, semanticColor, stroke, tabularNums, themes, weights } from "../brand/tokens";
import { fit } from "../engine/fit";
import { revealFrames } from "../engine/pace";
import type { SceneProps } from "../engine/types";
import { Label } from "../engine/ui";
import { NumberFormatSchema } from "./stat";

export const schema = z.object({
  title: z.string().max(60).optional(),
  format: NumberFormatSchema,
  items: z
    .array(
      z.object({
        label: z.string().max(24),
        value: z.number().nonnegative(),
        /** neutral = fg, growth/loss = green/crimson, second = cobalt, muted = stone */
        semantic: z.enum(["neutral", "growth", "loss", "second", "muted"]).default("neutral"),
      }),
    )
    .min(2)
    .max(8),
});
export type Data = z.infer<typeof schema>;
/** anchor.items = one word per bar (in order). */
export const anchorNames = ["items"] as const;

export const Component: React.FC<SceneProps<Data>> = ({ data, anchors, theme, voiceStart, voiceEnd }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fg = themes[theme].fg;
  const n = data.items.length;
  const at = revealFrames(n, fps, voiceStart, voiceEnd, anchors.items ?? []);
  const max = Math.max(...data.items.map((i) => i.value)) || 1;
  const baseY = safe.bottom - 70;
  const chartTop = data.title ? safe.top + 170 : safe.top + 100;
  const maxH = baseY - chartTop - 70;
  const slot = (safeWidth - grid.gutter * (n - 1)) / n;
  const barW = Math.min(220, slot * 0.6);
  return (
    <>
      {data.title ? (
        <div style={{ position: "absolute", left: safe.left, top: safe.top + 10, opacity: progress(frame, Math.max(0, at[0] - 15)) }}>
          <Label text={data.title} color={fg} size={56} weight={weights.bold} maxWidth={safeWidth} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: safe.left, top: baseY, width: safeWidth, height: stroke.line, backgroundColor: fg }} />
      {data.items.map((it, i) => {
        const v = tween(frame, at[i], 0, it.value, "slow");
        const h = (v / max) * maxH;
        const p = progress(frame, at[i], "fast");
        const x = safe.left + i * (slot + grid.gutter);
        const c = semanticColor(it.semantic, theme);
        const valueText = formatValue(it.value, data.format);
        const vSize = fit(valueText, { maxWidth: slot, max: 52, min: 26, family: fonts.numeric, weight: weights.heavy });
        const lSize = fit(it.label, { maxWidth: slot, max: 34, min: 22, family: fonts.display, weight: weights.regular });
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: x + (slot - barW) / 2, top: baseY - h, width: barW, height: h, backgroundColor: c }} />
            <div style={{ position: "absolute", left: x, width: slot, top: baseY - h - vSize - 14, textAlign: "center", opacity: p, fontFamily: fonts.numeric, fontWeight: weights.heavy, fontSize: vSize, color: c, ...tabularNums }}>
              {valueText}
            </div>
            <div style={{ position: "absolute", left: x, width: slot, top: baseY + 16, textAlign: "center", opacity: p, fontFamily: fonts.display, fontWeight: weights.regular, fontSize: lSize, color: fg }}>
              {it.label}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

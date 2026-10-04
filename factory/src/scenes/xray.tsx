import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { formatValue } from "../brand/format";
import { progress } from "../brand/motion";
import { colors, fonts, safe, safeWidth, stroke, tabularNums, themes, weights } from "../brand/tokens";
import { fit } from "../engine/fit";
import { revealFrames } from "../engine/pace";
import type { SceneProps } from "../engine/types";
import { Wordmark } from "../engine/ui";
import { NumberFormatSchema } from "./stat";

export const schema = z.object({
  entity: z.string().max(24),
  format: NumberFormatSchema,
  segments: z
    .array(z.object({ label: z.string().max(24), value: z.number().nonnegative(), kind: z.enum(["revenue", "cost", "loss", "profit"]) }))
    .min(2)
    .max(7),
  total: z.object({ label: z.string().max(24), value: z.number() }).optional(),
});
export type Data = z.infer<typeof schema>;
/** anchor.segments = one word per segment. */
export const anchorNames = ["segments"] as const;

/** X-ray: one stacked horizontal bar of how the money splits. revenue = fg, cost = stone, loss = crimson, profit = green. */
export const Component: React.FC<SceneProps<Data>> = ({ data, anchors, theme, voiceStart, voiceEnd }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { fg, muted } = themes[theme];
  const kindColor = { revenue: fg, cost: muted, loss: colors.crimson, profit: colors.green } as const;
  const at = revealFrames(data.segments.length, fps, voiceStart + 0.5, voiceEnd, anchors.segments ?? []);
  const total = data.segments.reduce((s, x) => s + x.value, 0) || 1;
  const barY = safe.top + 260;
  const barH = 150;
  let x = safe.left;
  return (
    <>
      <div style={{ position: "absolute", left: safe.left, top: safe.top + 30, opacity: progress(frame, Math.round(voiceStart * fps)) }}>
        <Wordmark text={data.entity} color={fg} maxWidth={safeWidth * 0.6} size={110} />
      </div>
      <div style={{ position: "absolute", left: safe.left, top: barY + barH, width: safeWidth, height: stroke.hairline, backgroundColor: fg }} />
      {data.segments.map((s, i) => {
        const w = (s.value / total) * safeWidth;
        const p = progress(frame, at[i], "standard");
        const left = x;
        x += w;
        const c = kindColor[s.kind];
        const valueText = formatValue(s.value, data.format);
        const lSize = fit(s.label, { maxWidth: Math.max(80, w - 12), max: 34, min: 20, family: fonts.display, weight: weights.regular, maxLines: 2 });
        const vSize = fit(valueText, { maxWidth: Math.max(80, w - 12), max: 44, min: 22, family: fonts.numeric, weight: weights.heavy });
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left, top: barY, width: w * p, height: barH, backgroundColor: c, borderRight: `${stroke.line}px solid ${themes[theme].bg}`, boxSizing: "border-box" }} />
            <div style={{ position: "absolute", left, top: barY + barH + 22, width: w, opacity: p, paddingRight: 12, boxSizing: "border-box" }}>
              <div style={{ fontFamily: fonts.numeric, fontWeight: weights.heavy, fontSize: vSize, color: c === muted ? fg : c, ...tabularNums }}>{valueText}</div>
              <div style={{ fontFamily: fonts.display, fontWeight: weights.regular, fontSize: lSize, color: fg, lineHeight: 1.1, marginTop: 6 }}>{s.label}</div>
            </div>
          </React.Fragment>
        );
      })}
      {data.total ? (
        <div style={{ position: "absolute", right: 1920 - safe.right, top: safe.bottom - 80, textAlign: "right", opacity: progress(frame, at[at.length - 1] + 15) }}>
          <span style={{ fontFamily: fonts.display, fontWeight: weights.bold, fontSize: 40, color: fg }}>{data.total.label} </span>
          <span style={{ fontFamily: fonts.numeric, fontWeight: weights.heavy, fontSize: 52, color: data.total.value < 0 ? colors.crimson : fg, ...tabularNums }}>
            {formatValue(data.total.value, data.format)}
          </span>
        </div>
      ) : null}
    </>
  );
};

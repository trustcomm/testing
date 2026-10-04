import React from "react";
import { interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { progress } from "../brand/motion";
import { distance, fonts, grid, safe, safeWidth, stroke, tabularNums, themes, weights } from "../brand/tokens";
import { fit } from "../engine/fit";
import { Icon, IconName } from "../engine/icons";
import { revealFrames } from "../engine/pace";
import type { SceneProps } from "../engine/types";
import { Label } from "../engine/ui";

export const schema = z.object({
  title: z.string().max(50).optional(),
  items: z
    .array(z.object({ title: z.string().max(40), icon: IconName, iconText: z.string().max(8).optional() }))
    .min(2)
    .max(5),
});
export type Data = z.infer<typeof schema>;
/** anchor.items = one word per item; each card appears on its word. */
export const anchorNames = ["items"] as const;

export const Component: React.FC<SceneProps<Data>> = ({ data, anchors, theme, voiceStart, voiceEnd }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { fg, bg, muted } = themes[theme];
  const n = data.items.length;
  const at = revealFrames(n, fps, voiceStart, voiceEnd, anchors.items ?? []);
  const cardW = (safeWidth - grid.gutter * (n - 1)) / n;
  const top = data.title ? safe.top + 150 : safe.top + 90;
  return (
    <>
      {data.title ? (
        <div style={{ position: "absolute", left: safe.left, top: safe.top + 10, opacity: progress(frame, Math.max(0, at[0] - 15), "standard") }}>
          <Label text={data.title} color={fg} size={56} weight={weights.bold} maxWidth={safeWidth} />
        </div>
      ) : null}
      {data.items.map((it, i) => {
        const p = progress(frame, at[i], "standard");
        const dim = i < n - 1 ? progress(frame, at[i + 1], "fast") : 0;
        const c = interpolateColors(dim, [0, 1], [fg, muted]);
        const drop = it.icon === "weight" ? progress(frame, at[i] + 3, "standard") : p;
        const titleSize = fit(it.title, { maxWidth: cardW - 88, max: 58, min: 32, family: fonts.display, weight: weights.bold, maxLines: 2 });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: safe.left + i * (cardW + grid.gutter),
              top,
              width: cardW,
              height: 440,
              boxSizing: "border-box",
              border: `${stroke.card}px solid ${c}`,
              padding: 44,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              opacity: p,
              transform: `translateX(${(1 - p) * -distance.standard}px)`,
              color: c,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontFamily: fonts.numeric, fontWeight: weights.heavy, fontSize: 72, lineHeight: 1, ...tabularNums }}>{i + 1}</div>
              <div style={{ opacity: drop, transform: it.icon === "weight" ? `translateY(${(1 - drop) * -60}px)` : undefined }}>
                <Icon name={it.icon} color={c} size={130} text={it.iconText} textColor={bg} />
              </div>
            </div>
            <div style={{ fontFamily: fonts.display, fontWeight: weights.bold, fontSize: titleSize, lineHeight: 1.08 }}>{it.title}</div>
          </div>
        );
      })}
    </>
  );
};

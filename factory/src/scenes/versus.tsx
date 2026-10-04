import React from "react";
import { useVideoConfig } from "remotion";
import { z } from "zod";
import { colors, fonts, grid, safe, safeWidth, stroke, themes, weights } from "../brand/tokens";
import { revealFrames } from "../engine/pace";
import type { SceneProps } from "../engine/types";
import { Counter, Enter, Label, Wordmark } from "../engine/ui";
import { NumberFormatSchema } from "./stat";

const Side = z.object({
  name: z.string().max(24),
  value: z.number().optional(),
  format: NumberFormatSchema.optional(),
  caption: z.string().max(60).optional(),
});
export const schema = z.object({
  metric: z.string().max(40).optional(),
  left: Side,
  right: Side,
});
export type Data = z.infer<typeof schema>;
/** anchor.left / anchor.right = words on which each side appears. */
export const anchorNames = ["left", "right"] as const;

/** Split screen: left = theme foreground (first entity), right = cobalt (second entity only). */
export const Component: React.FC<SceneProps<Data>> = ({ data, anchors, theme, voiceStart, voiceEnd }) => {
  const { fps } = useVideoConfig();
  const fg = themes[theme].fg;
  const [la, ra] = revealFrames(2, fps, voiceStart, voiceEnd, [anchors.left?.[0] ?? -1, anchors.right?.[0] ?? -1]);
  const half = (safeWidth - grid.gutter * 3) / 2;
  const top = data.metric ? safe.top + 130 : safe.top + 60;
  const side = (s: z.infer<typeof Side>, at: number, x: number, color: string, from: "past" | "future") => (
    <Enter at={at} from={from} style={{ position: "absolute", left: x, top, width: half, display: "flex", flexDirection: "column", gap: 30 }}>
      <Wordmark text={s.name} color={color} maxWidth={half} size={110} />
      {s.value !== undefined && s.format ? <Counter from={0} to={s.value} at={at} format={s.format} color={color} maxWidth={half} size={160} /> : null}
      {s.caption ? <Label text={s.caption} color={fg} maxWidth={half} /> : null}
    </Enter>
  );
  return (
    <>
      {data.metric ? (
        <Enter at={Math.max(0, la - 9)} rise={8} style={{ position: "absolute", left: safe.left, top: safe.top, width: safeWidth, textAlign: "center" }}>
          <div style={{ fontFamily: fonts.display, fontWeight: weights.bold, fontSize: 52, color: fg }}>{data.metric}</div>
        </Enter>
      ) : null}
      <div style={{ position: "absolute", left: safe.left + safeWidth / 2 - stroke.line / 2, top, width: stroke.line, height: safe.bottom - top, backgroundColor: fg, opacity: 0.25 }} />
      {side(data.left, la, safe.left, fg, "past")}
      {side(data.right, ra, safe.left + half + grid.gutter * 3, colors.cobalt, "future")}
    </>
  );
};

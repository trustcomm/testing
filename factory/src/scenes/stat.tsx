import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { tweenColor } from "../brand/motion";
import { colX, durations, safe, semanticColor, span, themes, colors } from "../brand/tokens";
import { revealFrames } from "../engine/pace";
import type { SceneProps } from "../engine/types";
import { Bar, Counter, Enter, Label, Wordmark, Year } from "../engine/ui";
import { tween } from "../brand/motion";

export const NumberFormatSchema = z.enum(["count", "pct", "inr", "inrLakh", "inrCrore", "inrLakhCrore", "usd", "usdMillion", "usdBillion"]);

export const schema = z.object({
  wordmark: z.string().max(24).optional(),
  year: z.number().int().optional(),
  /** Counts from `from` to `value` — up or down. */
  from: z.number().default(0),
  value: z.number(),
  format: NumberFormatSchema,
  /** Colour role of the number: neutral (fg), growth (green), loss (crimson). */
  semantic: z.enum(["neutral", "growth", "loss"]).default("neutral"),
  /** Prefix "~" once the count lands (approximate figure). */
  approx: z.boolean().default(false),
  label: z.string().max(60).optional(),
  note: z.string().max(80).optional(),
  /** Show the single bar next to the number. */
  bar: z.boolean().default(true),
});
export type Data = z.infer<typeof schema>;
/** anchor.counter = the word the count LANDS on. */
export const anchorNames = ["counter"] as const;

export const Component: React.FC<SceneProps<Data>> = ({ data, anchors, theme, voiceStart, voiceEnd }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fg = themes[theme].fg;
  const [tWord, tLabel] = revealFrames(2, fps, voiceStart, voiceEnd);
  const land = anchors.counter?.[0] ?? Math.round((voiceStart + 0.8) * fps) + durations.slow;
  const countAt = Math.max(0, land - durations.slow);
  const color = data.semantic === "neutral" ? fg : tweenColor(frame, countAt, fg, semanticColor(data.semantic, theme), "fast");
  const max = Math.max(Math.abs(data.from), Math.abs(data.value)) || 1;
  const barValue = tween(frame, countAt, data.from, data.value, "slow");
  const left = colX(0);
  const leftW = span(8);
  return (
    <>
      {data.year !== undefined ? (
        <Enter at={tWord} from="past" style={{ position: "absolute", left, top: safe.top + 10 }}>
          <Year year={data.year} color={colors.saffron} />
        </Enter>
      ) : null}
      {data.wordmark ? (
        <Enter at={tWord} from="past" style={{ position: "absolute", left, top: safe.top + 80 }}>
          <Wordmark text={data.wordmark} color={fg} maxWidth={leftW} />
        </Enter>
      ) : null}
      {data.label ? (
        <Enter at={tLabel} from="below" rise={8} style={{ position: "absolute", left, top: data.wordmark ? safe.top + 250 : safe.top + 80 }}>
          <Label text={data.label} color={fg} maxWidth={leftW} />
        </Enter>
      ) : null}
      <Enter at={Math.min(countAt, tLabel)} from="none" style={{ position: "absolute", left, top: data.wordmark ? safe.top + 360 : safe.top + 200 }}>
        <Counter from={data.from} to={data.value} at={countAt} format={data.format} approx={data.approx} color={color} maxWidth={leftW} />
      </Enter>
      {data.note ? (
        <Enter at={land} from="below" rise={8} style={{ position: "absolute", left, top: safe.bottom - 70 }}>
          <Label text={data.note} color={themes[theme].muted} size={34} maxWidth={leftW} />
        </Enter>
      ) : null}
      {data.bar ? (
        <Enter at={countAt} from="none" style={{ position: "absolute", left: colX(9), top: safe.bottom - 560 }}>
          <Bar value={Math.abs(barValue)} max={max} color={color} baseColor={fg} width={220} height={560} />
        </Enter>
      ) : null}
    </>
  );
};

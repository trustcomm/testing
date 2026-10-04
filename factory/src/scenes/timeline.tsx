import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { progress } from "../brand/motion";
import { colors, direction, distance, fonts, safe, safeWidth, stroke, tabularNums, themes, type, weights } from "../brand/tokens";
import { fit } from "../engine/fit";
import { revealFrames } from "../engine/pace";
import type { SceneProps } from "../engine/types";

export const schema = z.object({
  years: z.array(z.number().int()).min(2).max(12),
  events: z
    .array(z.object({ year: z.number().int(), text: z.string().max(48), tense: z.enum(["past", "future"]).default("past") }))
    .min(1)
    .max(6),
});
export type Data = z.infer<typeof schema>;
/** anchor.events = one word per event. */
export const anchorNames = ["events"] as const;

/** TimelineRuler: thin line with year ticks; the active year (saffron) moves event by event. */
export const Component: React.FC<SceneProps<Data>> = ({ data, anchors, theme, voiceStart, voiceEnd }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { fg } = themes[theme];
  const at = revealFrames(data.events.length, fps, voiceStart, voiceEnd, anchors.events ?? []);
  const years = [...data.years].sort((a, b) => a - b);
  const step = safeWidth / (years.length - 1);
  const lineY = safe.top + 260;
  const p0 = progress(frame, Math.max(0, at[0] - 15), "standard");
  let active = -1;
  at.forEach((f, i) => {
    if (frame >= f) active = i;
  });
  const activeYear = active >= 0 ? data.events[active].year : undefined;
  return (
    <>
      <div style={{ position: "absolute", left: safe.left, top: lineY, width: safeWidth * p0, height: stroke.hairline, backgroundColor: fg }} />
      {years.map((y, i) => {
        const on = y === activeYear;
        const x = safe.left + i * step;
        return (
          <React.Fragment key={y}>
            <div style={{ position: "absolute", left: x - (on ? 3 : 1), top: lineY - (on ? 18 : 8), width: on ? 6 : stroke.hairline, height: on ? 38 : 18, backgroundColor: on ? colors.saffron : fg, opacity: p0 }} />
            <div style={{ position: "absolute", left: x - 70, width: 140, top: lineY + 30, textAlign: "center", fontFamily: fonts.numeric, fontWeight: on ? weights.heavy : weights.regular, fontSize: type.year, color: on ? colors.saffron : fg, opacity: p0, ...tabularNums }}>
              {y}
            </div>
          </React.Fragment>
        );
      })}
      {data.events.map((e, i) => {
        if (i !== active) return null;
        const p = progress(frame, at[i], "standard");
        const size = fit(e.text, { maxWidth: safeWidth, max: 72, min: 40, family: fonts.display, weight: weights.bold, maxLines: 2 });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: safe.left,
              width: safeWidth,
              top: lineY + 160,
              textAlign: "center",
              fontFamily: fonts.display,
              fontWeight: weights.bold,
              fontSize: size,
              lineHeight: 1.1,
              color: fg,
              opacity: p,
              transform: `translateX(${(1 - p) * direction[e.tense] * distance.standard}px)`,
            }}
          >
            {e.text}
          </div>
        );
      })}
    </>
  );
};

import React from "react";
import { useVideoConfig } from "remotion";
import { z } from "zod";
import { colX, durations, fonts, safe, span, stroke, themes, type, weights } from "../brand/tokens";
import { fit } from "../engine/fit";
import type { SceneProps } from "../engine/types";
import { Enter, Label } from "../engine/ui";

export const schema = z.object({
  name: z.string().max(32),
  role: z.string().max(40).optional(),
  years: z.string().max(20).optional(),
  /** Only a verified, attributable quote. */
  quote: z.string().max(120).optional(),
});
export type Data = z.infer<typeof schema>;
export const anchorNames = [] as const;

/** Founder card: flat geometric silhouette (never a photo) + name, role, years, optional quote. */
export const Component: React.FC<SceneProps<Data>> = ({ data, theme, voiceStart, voiceEnd }) => {
  const { fps } = useVideoConfig();
  const { fg, muted } = themes[theme];
  const a = Math.round(voiceStart * fps);
  const textW = span(7);
  const nameSize = fit(data.name, { maxWidth: textW, max: 110, min: 56, family: fonts.display, weight: weights.heavy });
  const cardTop = safe.top + 40;
  return (
    <>
      <Enter at={a} from="past" style={{ position: "absolute", left: colX(0), top: cardTop, width: span(4), height: 620, border: `${stroke.card}px solid ${fg}`, boxSizing: "border-box", overflow: "hidden" }}>
        <svg width="100%" height="100%" viewBox="0 0 400 620" preserveAspectRatio="xMidYMax meet">
          <circle cx="200" cy="230" r="100" fill={muted} />
          <rect x="70" y="360" width="260" height="300" rx="130" fill={muted} />
        </svg>
      </Enter>
      <div style={{ position: "absolute", left: colX(5), top: cardTop + 40, width: textW, display: "flex", flexDirection: "column", gap: 22 }}>
        <Enter at={a + durations.fast} from="past">
          <div style={{ fontFamily: fonts.display, fontWeight: weights.heavy, fontSize: nameSize, lineHeight: 1, color: fg }}>{data.name}</div>
        </Enter>
        {data.role ? (
          <Enter at={a + durations.standard} rise={8}>
            <Label text={data.role} color={fg} maxWidth={textW} size={type.label} />
          </Enter>
        ) : null}
        {data.years ? (
          <Enter at={a + durations.slow} rise={8}>
            <div style={{ fontFamily: fonts.numeric, fontWeight: weights.bold, fontSize: type.year, color: muted }}>{data.years}</div>
          </Enter>
        ) : null}
        {data.quote ? (
          <Enter at={Math.round(((voiceStart + voiceEnd) / 2) * fps)} rise={8} style={{ marginTop: 30 }}>
            <Label text={`“${data.quote}”`} color={fg} maxWidth={textW} size={type.body} weight={weights.bold} />
          </Enter>
        ) : null}
      </div>
    </>
  );
};

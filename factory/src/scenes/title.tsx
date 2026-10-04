import React from "react";
import { useVideoConfig } from "remotion";
import { z } from "zod";
import { colors, durations, fonts, safe, safeWidth, themes, type, weights } from "../brand/tokens";
import { fit } from "../engine/fit";
import type { SceneProps } from "../engine/types";
import { Enter, Label, Words, Wordmark } from "../engine/ui";

export const schema = z.object({
  kicker: z.string().max(40).optional(),
  title: z.string().max(60),
  subtitle: z.string().max(90).optional(),
  wordmark: z.string().max(24).optional(),
});
export type Data = z.infer<typeof schema>;
export const anchorNames = [] as const;

/** Opening/chapter title: kicker in saffron, per-word title, subtitle, optional wordmark. */
export const Component: React.FC<SceneProps<Data>> = ({ data, theme, voiceStart }) => {
  const { fps } = useVideoConfig();
  const fg = themes[theme].fg;
  const a = Math.round(voiceStart * fps);
  const titleSize = fit(data.title, { maxWidth: safeWidth, max: 120, min: 60, family: fonts.display, weight: weights.heavy, maxLines: 2 });
  return (
    <div style={{ position: "absolute", left: safe.left, top: safe.top + 60, width: safeWidth, display: "flex", flexDirection: "column", gap: 28 }}>
      {data.kicker ? (
        <Enter at={a} from="past">
          <div style={{ fontFamily: fonts.display, fontWeight: weights.bold, fontSize: type.label, letterSpacing: "0.08em", color: colors.saffron }}>{data.kicker.toUpperCase()}</div>
        </Enter>
      ) : null}
      <Words text={data.title} at={a + durations.fast} color={fg} size={titleSize} maxWidth={safeWidth} />
      {data.subtitle ? (
        <Enter at={a + durations.slow} rise={8}>
          <Label text={data.subtitle} color={fg} maxWidth={safeWidth} size={type.body} />
        </Enter>
      ) : null}
      {data.wordmark ? (
        <Enter at={a + durations.slow + durations.standard} from="past" style={{ marginTop: 30 }}>
          <Wordmark text={data.wordmark} color={fg} maxWidth={safeWidth / 2} size={110} />
        </Enter>
      ) : null}
    </div>
  );
};

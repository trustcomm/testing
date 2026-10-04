import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { progress } from "../brand/motion";
import { colors, durations, fonts, safe, safeWidth, themes, type, weights } from "../brand/tokens";
import { fit } from "../engine/fit";
import type { SceneProps } from "../engine/types";
import { Enter } from "../engine/ui";

export const schema = z.object({
  line: z.string().max(60),
  cta: z.string().max(40).optional(),
});
export type Data = z.infer<typeof schema>;
export const anchorNames = [] as const;

/** End card: closing line, short saffron rule, channel name in saffron, optional CTA. */
export const Component: React.FC<SceneProps<Data>> = ({ data, theme, channelName, voiceStart, voiceEnd }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fg = themes[theme].fg;
  const a = Math.round(voiceStart * fps);
  const b = a + durations.standard;
  const midY = (safe.top + safe.bottom) / 2;
  const lineSize = fit(data.line, { maxWidth: safeWidth, max: type.title - 16, min: 44, family: fonts.display, weight: weights.bold });
  return (
    <div style={{ position: "absolute", left: safe.left, width: safeWidth, top: midY - 140, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
      <Enter at={a}>
        <div style={{ fontFamily: fonts.display, fontWeight: weights.bold, fontSize: lineSize, color: fg, textAlign: "center" }}>{data.line}</div>
      </Enter>
      <div style={{ width: 120 * progress(frame, b, "standard"), height: 6, backgroundColor: colors.saffron }} />
      <Enter at={b}>
        <div style={{ fontFamily: fonts.display, fontWeight: weights.heavy, fontSize: 64, letterSpacing: "0.04em", color: colors.saffron }}>{channelName}</div>
      </Enter>
      {data.cta ? (
        <Enter at={Math.round(((voiceStart + voiceEnd) / 2) * fps)}>
          <div style={{ fontFamily: fonts.display, fontWeight: weights.regular, fontSize: 40, color: fg }}>{data.cta}</div>
        </Enter>
      ) : null}
    </div>
  );
};

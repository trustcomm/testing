import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { progress } from "../brand/motion";
import { colors, distance, fonts, safe, safeWidth, themes, type, weights } from "../brand/tokens";
import { fit } from "../engine/fit";
import type { SceneProps } from "../engine/types";
import { Year } from "../engine/ui";

export const schema = z.object({
  word: z.string().min(1).max(16),
  year: z.number().int().optional(),
});
export type Data = z.infer<typeof schema>;
/** anchor.word = the spoken word on which the verdict appears. */
export const anchorNames = ["word"] as const;

/** One huge word, still. Fast fade + 8 px rise only — stillness is the drama. */
export const Component: React.FC<SceneProps<Data>> = ({ data, anchors, theme, voiceStart }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = anchors.word?.[0] ?? Math.round(voiceStart * fps);
  const p = progress(frame, at, "fast");
  const yp = progress(frame, Math.round(voiceStart * fps), "standard");
  const size = fit(data.word, { maxWidth: safeWidth, max: type.verdict, min: 100, family: fonts.display, weight: weights.heavy });
  const midY = (safe.top + safe.bottom) / 2;
  return (
    <>
      {data.year !== undefined ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: safe.top + 20, display: "flex", justifyContent: "center", opacity: yp }}>
          <Year year={data.year} color={colors.saffron} size={56} />
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: safe.left,
          width: safeWidth,
          top: midY - size / 2,
          textAlign: "center",
          fontFamily: fonts.display,
          fontWeight: weights.heavy,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: "0.02em",
          color: themes[theme].fg,
          opacity: p,
          transform: `translateY(${(1 - p) * distance.rise}px)`,
        }}
      >
        {data.word}
      </div>
    </>
  );
};

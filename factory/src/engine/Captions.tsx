import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { captionsBand, colors, fonts, safe, safeWidth, themes, type, weights, type ThemeMode } from "../brand/tokens";
import { fit } from "./fit";
import type { Word } from "./types";

const MAX_WORDS = 7;

/** Group words into caption lines: break after . ? ! , — … or at MAX_WORDS. */
const chunk = (words: Word[]) => {
  const out: { words: Word[]; idx: number[] }[] = [];
  let cur: Word[] = [];
  let idx: number[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    idx.push(i);
    if (cur.length >= MAX_WORDS || /[.?!,—…]$/.test(w.text)) {
      out.push({ words: cur, idx });
      cur = [];
      idx = [];
    }
  });
  if (cur.length) out.push({ words: cur, idx });
  return out;
};

/**
 * In-canvas captions (Roman Hinglish), one line in the captions band. Words are whole units;
 * the word being spoken is saffron, the rest use the theme foreground.
 */
export const Captions: React.FC<{ words: Word[]; theme: ThemeMode }> = ({ words, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (!words.length) return null;
  const lines = chunk(words);
  const line =
    lines.find((l) => t >= l.words[0].start - 0.05 && t < (lines[lines.indexOf(l) + 1]?.words[0].start ?? Infinity) - 0.05) ??
    (t < words[0].start ? null : lines[lines.length - 1]);
  if (!line || t > words[words.length - 1].end + 0.6) return null;
  const text = line.words.map((w) => w.text).join(" ");
  const size = fit(text, { maxWidth: safeWidth, max: type.caption, min: 34, family: fonts.display, weight: weights.bold });
  return (
    <div
      style={{
        position: "absolute",
        left: safe.left,
        width: safeWidth,
        top: captionsBand.top,
        height: captionsBand.bottom - captionsBand.top,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0 0.28em",
        flexWrap: "nowrap",
        fontFamily: fonts.display,
        fontWeight: weights.bold,
        fontSize: size,
        lineHeight: 1.1,
      }}
    >
      {line.words.map((w, k) => {
        const active = t >= w.start && t < w.end;
        return (
          <span key={line.idx[k]} style={{ color: active ? colors.saffron : themes[theme].fg }}>
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

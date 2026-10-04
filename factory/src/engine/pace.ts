import type { Word } from "./types";

/** Normalise a word for anchor matching: lowercase, strip punctuation (keep inner hyphens/apostrophes). */
export const normWord = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[“”"‘’]/g, "")
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

/**
 * Find word indices for anchors, in order (each search starts after the previous hit).
 * An anchor may be one word ("loan") or a phrase ("twenty-two billion"); the index returned is
 * the phrase's FIRST word. Returns -1 when not found (the validator rejects that).
 */
export const findWordIndices = (scriptWords: string[], anchors: string[]): number[] => {
  const norm = scriptWords.map(normWord);
  let from = 0;
  return anchors.map((a) => {
    const target = a.split(/\s+/).map(normWord).filter(Boolean);
    for (let i = from; i + target.length <= norm.length; i++) {
      if (target.every((t, k) => norm[i + k] === t)) {
        from = i + 1;
        return i;
      }
    }
    return -1;
  });
};

/**
 * Frames on which `n` reveals happen. Anchored reveals use their word's start frame; the rest are
 * spaced evenly across the voice span (never a fixed clock).
 */
export const revealFrames = (
  n: number,
  fps: number,
  voiceStart: number,
  voiceEnd: number,
  anchored: number[] = [],
): number[] => {
  const span = Math.max(0.5, voiceEnd - voiceStart);
  return Array.from({ length: n }, (_, i) =>
    anchored[i] !== undefined && anchored[i] >= 0 ? anchored[i] : Math.round((voiceStart + (span * i) / Math.max(1, n)) * fps),
  );
};

/** Even word timings across a span — used for demo stills and as the documented alignment fallback (c). */
export const evenTimings = (text: string, start: number, end: number): Word[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const weight = words.map((w) => Math.max(1, (w.match(/[aeiouy]+/gi) ?? []).length));
  const total = weight.reduce((a, b) => a + b, 0);
  let t = start;
  return words.map((w, i) => {
    const d = ((end - start) * weight[i]) / total;
    const out = { text: w, start: t, end: t + d };
    t += d;
    return out;
  });
};

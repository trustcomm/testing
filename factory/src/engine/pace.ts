import type { Word } from "./types";

/** Normalise a word for anchor matching: lowercase, strip punctuation (keep inner hyphens/apostrophes). */
export const normWord = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[“”"‘’]/g, "")
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

/** Parse an anchor: "loan", "twenty-two billion" (phrase), or "zero#2" (2nd occurrence, 1-based). */
export const parseAnchor = (a: string): { words: string[]; occurrence: number | null } => {
  const m = a.match(/^(.*?)#(\d+)$/);
  const body = m ? m[1] : a;
  return { words: body.split(/\s+/).map(normWord).filter(Boolean), occurrence: m ? Number(m[2]) : null };
};

/** All start indices where `target` (normalised words) occurs in `norm`. */
export const occurrences = (norm: string[], target: string[]) => {
  const out: number[] = [];
  for (let i = 0; i + target.length <= norm.length; i++) if (target.every((t, k) => norm[i + k] === t)) out.push(i);
  return out;
};

/**
 * Find word indices for anchors, in order. An anchor may be one word ("loan"), a phrase
 * ("twenty-two billion") or carry an occurrence index ("zero#2"). Without an index, each search
 * starts after the previous hit. Returns the FIRST word of the match, or -1 if not found.
 */
export const findWordIndices = (scriptWords: string[], anchors: string[]): number[] => {
  const norm = scriptWords.map(normWord);
  let from = 0;
  return anchors.map((a) => {
    const { words, occurrence } = parseAnchor(a);
    const hits = occurrences(norm, words);
    const i = occurrence !== null ? (hits[occurrence - 1] ?? -1) : (hits.find((h) => h >= from) ?? -1);
    if (i >= 0) from = i + 1;
    return i;
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

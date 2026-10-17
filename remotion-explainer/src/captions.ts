// Burned-in captions: Roman Hinglish exactly as transcribed, two to four words at a time, built from the word timestamps.
// A clause (split at , . ? !) of n words is cut into ceil(n / 4) even chunks, so no group has fewer than two words (a
// clause of one word, which does not happen in this script, would be the only exception) or more than four.
import { words, Word } from "./timing";

export type Group = { words: Word[]; show: number; hide: number };

function chunk(clause: Word[]): Word[][] {
  const k = Math.ceil(clause.length / 4), out: Word[][] = [];
  let at = 0;
  for (let c = 0; c < k; c++) { const size = Math.ceil((clause.length - at) / (k - c)); out.push(clause.slice(at, at + size)); at += size; }
  return out;
}

export const groups: Group[] = (() => {
  const clauses: Word[][] = [];
  let cur: Word[] = [];
  for (const wd of words) { cur.push(wd); if (/[,.?!]["']?$/.test(wd.text)) { clauses.push(cur); cur = []; } }
  if (cur.length) clauses.push(cur);
  const g = clauses.flatMap(chunk).map((ws) => ({ words: ws, show: ws[0].start, hide: 0 }));
  g.forEach((x, i) => {
    const lastEnd = x.words.at(-1)!.end, next = g[i + 1];
    // stay up until the next group starts; across a pause, until a beat after the last word
    x.hide = next ? Math.min(next.show, lastEnd + 0.3) : lastEnd + 0.3;
  });
  return g;
})();

/** The caption group on screen at time t and which of its words is being spoken (the last one that has started). */
export function captionAt(t: number): { group: Group; current: number } | null {
  const g = groups.find((x) => t >= x.show && t < x.hide);
  if (!g) return null;
  let cur = 0;
  g.words.forEach((wd, i) => { if (t >= wd.start) cur = i; });
  return { group: g, current: cur };
}

// Captions: the exact spoken words (Roman Hinglish, as in timings.json), two to four at a time. A clause (split at , . ? ! and
// the "..." pauses) of n words becomes ceil(n / 4) even chunks; a one-word clause joins the next one.
import { words, Word, sceneStart } from "./anchorsCompat";

export type Group = { words: Word[]; show: number; hide: number };

const chunk = (clause: Word[]): Word[][] => {
  const k = Math.ceil(clause.length / 4), out: Word[][] = [];
  let at = 0;
  for (let c = 0; c < k; c++) { const size = Math.ceil((clause.length - at) / (k - c)); out.push(clause.slice(at, at + size)); at += size; }
  return out;
};

export const groups: Group[] = (() => {
  let clauses: Word[][] = [], cur: Word[] = [];
  for (const wd of words) { cur.push(wd); if (/[,.?!]$/.test(wd.text)) { clauses.push(cur); cur = []; } }
  if (cur.length) clauses.push(cur);
  // a one-word clause joins the next (or, if it is the last, the previous)
  const merged: Word[][] = [];
  for (let i = 0; i < clauses.length; i++) {
    if (clauses[i].length === 1 && i + 1 < clauses.length) { clauses[i + 1] = [...clauses[i], ...clauses[i + 1]]; continue; }
    merged.push(clauses[i]);
  }
  const g = merged.flatMap(chunk).map((ws) => ({ words: ws, show: ws[0].start, hide: 0 }));
  g.forEach((x, i) => { const lastEnd = x.words.at(-1)!.end, next = g[i + 1]; x.hide = next ? Math.min(next.show, lastEnd + 0.35) : lastEnd + 0.35; });
  return g;
})();

// Scene 4 ("One more thing") is a held, minimal keynote moment: no captions from its first word to the first word of scene 5.
export const hiddenFrom = () => sceneStart(3), hiddenTo = () => sceneStart(4);
export const captionAt = (t: number) => {
  if (t >= hiddenFrom() && t < hiddenTo()) return null;
  const g = groups.find((x) => t >= x.show && t < x.hide);
  if (!g) return null;
  let cur = 0;
  g.words.forEach((wd, i) => { if (t >= wd.start) cur = i; });
  return { group: g, current: cur };
};

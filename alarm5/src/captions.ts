// Captions: the exact spoken words (Roman Hinglish, as written in the script), 2-4 at a time. A clause (split at , . ? ! : and "...") of n words
// becomes ceil(n / 4) even chunks; a one- or two-word clause joins the next one in its scene. The active word is red in S1-S12 and green in S13-S15.
import { Word, words } from "./anchors";

export interface Group { words: Word[]; show: number; hide: number }
const chunk = (clause: Word[]): Word[][] => {
  const k = Math.ceil(clause.length / 4), out: Word[][] = [];
  let at = 0;
  for (let c = 0; c < k; c++) { const size = Math.ceil((clause.length - at) / (k - c)); out.push(clause.slice(at, at + size)); at += size; }
  return out;
};
export const groups: Group[] = (() => {
  const clauses: Word[][] = [];
  let cur: Word[] = [];
  for (const wd of words) { cur.push(wd); if (/[,.?!:]$/.test(wd.text)) { clauses.push(cur); cur = []; } }
  if (cur.length) clauses.push(cur);
  const merged: Word[][] = [];
  for (let i = 0; i < clauses.length; i++) {
    if (clauses[i].length <= 2 && i + 1 < clauses.length && clauses[i + 1][0].scene === clauses[i][0].scene && clauses[i].length + clauses[i + 1].length <= 5) { clauses[i + 1] = [...clauses[i], ...clauses[i + 1]]; continue; }
    merged.push(clauses[i]);
  }
  const g = merged.flatMap(chunk).map((ws) => ({ words: ws, show: ws[0].start, hide: 0 }));
  g.forEach((x, i) => { const lastEnd = x.words.at(-1)!.end, next = g[i + 1]; x.hide = next ? Math.min(next.show, lastEnd + 0.35) : lastEnd + 0.35; });
  return g;
})();
export const captionAt = (t: number) => {
  const g = groups.find((x) => t >= x.show && t < x.hide);
  if (!g) return null;
  let cur = 0;
  g.words.forEach((wd, i) => { if (t >= wd.start) cur = i; });
  return { group: g, current: cur };
};

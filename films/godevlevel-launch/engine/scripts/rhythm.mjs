// Shared rhythm rules for every film on this engine.
//
// "No three equal beats in a row" exists to stop a uniform cadence. An ACCELERATING run (cards that
// only ever stay the same or get shorter, over at least `minRun` cards, shrinking by at least
// `minShrink` overall) is the opposite of a uniform cadence, so equal lengths inside such a run are
// allowed and reported as part of the run instead of failing.

/** Maximal runs where every length is ≤ the one before, at least minRun long and shrinking ≥ minShrink. */
export function acceleratingRuns(lengths, { minRun = 5, minShrink = 0.3 } = {}) {
  const runs = [];
  let a = 0;
  for (let i = 1; i <= lengths.length; i++) {
    if (i < lengths.length && lengths[i] <= lengths[i - 1] + 1e-9) continue;
    const b = i - 1;
    if (b - a + 1 >= minRun && 1 - lengths[b] / lengths[a] >= minShrink) runs.push([a, b]);
    a = i;
  }
  return runs;
}

/** Index triples of equal consecutive lengths, split into allowed (inside an accelerating run) and failing. */
export function equalTriples(lengths, opts) {
  const runs = acceleratingRuns(lengths, opts);
  const inRun = (i) => runs.some(([a, b]) => i - 2 >= a && i <= b);
  const allowed = [], failing = [];
  for (let i = 2; i < lengths.length; i++)
    if (Math.abs(lengths[i] - lengths[i - 1]) < 1e-9 && Math.abs(lengths[i] - lengths[i - 2]) < 1e-9) (inRun(i) ? allowed : failing).push([i - 2, i - 1, i]);
  return { runs, allowed, failing };
}

/**
 * Near-still frame test shared by all checkers: fewer than `area` of pixels change by more than
 * `level` grey levels from the previous frame (RGBA buffers, same size).
 */
export const NEAR_STILL = { level: 8, area: 0.003 };
export function isNearStill(prev, cur, { level, area } = NEAR_STILL) {
  let changed = 0;
  for (let k = 0; k < cur.length; k += 4)
    if (Math.max(Math.abs(cur[k] - prev[k]), Math.abs(cur[k + 1] - prev[k + 1]), Math.abs(cur[k + 2] - prev[k + 2])) > level) changed++;
  return changed / (cur.length / 4) < area;
}

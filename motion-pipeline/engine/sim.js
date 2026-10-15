// A simulation, replayed: step from the initial state at a fixed dt = 1/120 s and cache by step index, so the
// state at t is the same whichever order frames are asked for. `step(state, dt)` must be pure and return a new state.
export const DT = 1 / 120;
export function replay(initial, step) {
  const cache = [initial];
  return (t) => {
    const n = Math.round(t / DT);
    while (cache.length <= n) cache.push(step(cache[cache.length - 1], DT));
    return cache[n];
  };
}

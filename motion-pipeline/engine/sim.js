// A simulation, replayed: step from the initial state at a fixed dt and cache by step index,
// so the state at t is the same whichever order frames are asked for. `step` must be pure.
export function replay(initial, step, dt = 1 / 120) {
  const cache = [initial];
  return (t) => {
    const n = Math.round(t / dt);
    while (cache.length <= n) cache.push(step(cache[cache.length - 1], dt));
    return cache[n];
  };
}

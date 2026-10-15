// Stateless: the value for (i, seed) is the same on every frame, in any order. Use this inside draw().
export function hash(i, seed = 0) {
  let h = Math.imul((i | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(seed | 0, 0xc2b2ae35);
  h ^= h >>> 13; h = Math.imul(h, 0x27d4eb2f); h ^= h >>> 15;
  return (h >>> 0) / 4294967296; // 0..1
}

// Sequential, so load-time only (build a list once). It throws once the page is READY, so a call from
// inside draw() fails loudly instead of making a frame depend on how many frames came before it.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    if (globalThis.READY === true) throw new Error("mulberry32 is for load time only; use hash(i, seed) in draw()");
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Determinism: frame K is the same bytes whether it is the first frame a page draws or the (K+1)th.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { start } from "./harness.mjs";

const K = 150;
const sha = (b) => createHash("sha256").update(b).digest("hex");
let failed = 0;
const report = (ok, name, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`); if (!ok) failed++; };

// 1. Banned calls in the draw path (comments ignored; the live-preview block of index.html is not part of it).
const BANNED = /\b(Date\.now|new Date|performance\.now|Math\.random|crypto\.getRandomValues|setTimeout|setInterval|requestAnimationFrame|requestIdleCallback|queueMicrotask)\b|@keyframes|\banimation\b|\btransition\b|\.animate\(/;
const FILES = ["index.html", "tokens.js", "engine/ease.js", "engine/rng.js", "engine/sim.js", "scenes/index.js", "scenes/s01.js", "scenes/s02.js"];
for (const f of FILES) {
  let src = await readFile(f, "utf8");
  if (f === "index.html") src = src.split("// --- live preview")[0];
  const hits = src.split("\n").map((l, n) => [n + 1, l.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "")]).filter(([, l]) => BANNED.test(l));
  report(hits.length === 0, `no banned calls in ${f}`, hits.map(([n, l]) => `line ${n}: ${l.trim()}`).join(" | "));
}

// 2. Frame K in a fresh page, then in another page after frames 0..K in order.
const { open, close } = await start();
try {
  const fresh = await open();
  report(fresh.fps === 30 && fresh.frames > K, `page exposes FPS = 30 and DURATION ${fresh.duration} s (${fresh.frames} frames)`);
  const a = sha(await fresh.png(K));
  const replayed = await open();
  let b;
  for (let i = 0; i <= K; i++) { const png = await replayed.png(i); if (i === K) b = sha(png); }
  report(a === b, `frame ${K}: fresh page = after frames 0..${K}`, `${a.slice(0, 16)} ${b.slice(0, 16)}`);

  // extras: random access, and a control that the page is not simply static
  const hop = await open();
  for (const i of [K + 25, 3, K - 1]) await hop.png(i);
  const c = sha(await hop.png(K));
  report(a === c, `frame ${K}: fresh page = after hops (${K + 25}, 3, ${K - 1})`, `${a.slice(0, 16)} ${c.slice(0, 16)}`);
  report(a !== sha(await fresh.png(K + 1)), `frame ${K} differs from frame ${K + 1} (the page is not static)`);
} catch (e) {
  report(false, "a page threw while rendering", String(e.message).split("\n")[0]);
} finally { await close(); }

console.log(failed ? "FAIL" : "PASS");
process.exit(failed ? 1 : 0);

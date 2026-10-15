// The renderFrame(t) contract: frame K is the same whatever was rendered before it.
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { start } from "./harness.mjs";

const sha = (b) => createHash("sha256").update(b).digest("hex").slice(0, 12);
const K = 150;
let bad = 0;
const check = (name, ok, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name} ${detail}`); if (!ok) bad++; };

// 1. static scan: nothing in the draw path may read a clock, randomness or a timer
const BANNED = /Date\.now|performance\.now|Math\.random|setTimeout|setInterval|requestAnimationFrame|\banimation\b/;
for (const dir of ["engine", "scenes"]) for (const f of await readdir(dir)) {
  const hits = (await readFile(`${dir}/${f}`, "utf8")).split("\n").filter((l) => !l.trim().startsWith("//") && BANNED.test(l));
  check(`no clock or randomness in ${dir}/${f}`, hits.length === 0, hits.join(" | "));
}

// 2. frame K cold, after frames 0..K-1, and after hopping around
const { open, close } = await start();
try {
  const cold = await open();
  const a = sha(await cold.png(K));
  const warm = await open();
  for (let i = 0; i < K; i++) await warm.png(i);
  const b = sha(await warm.png(K));
  const hop = await open();
  for (const i of [K + 25, 3, K - 1]) await hop.png(i);
  const c = sha(await hop.png(K));
  check(`frame ${K}: cold = after 0..${K - 1}`, a === b, `${a} ${b}`);
  check(`frame ${K}: cold = after hops (${K + 25}, 3, ${K - 1})`, a === c, `${a} ${c}`);
  check(`frame ${K} differs from frame ${K + 1} (the page is not static)`, a !== sha(await cold.png(K + 1)));
} finally { await close(); }
process.exit(bad ? 1 : 0);

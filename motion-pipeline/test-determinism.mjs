// Determinism: frame K is the same bytes whether it is the first frame a page draws or the (K+1)th.
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { start } from "./harness.mjs";
import { tokens as T } from "./tokens.js";
import { scenes } from "./scenes/index.js";
import { replay } from "./engine/sim.js";

let K = 150;   // set below: frame 150 if the video is long enough, else a late frame
const sha = (b) => createHash("sha256").update(b).digest("hex");
let failed = 0;
const report = (ok, name, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`); if (!ok) failed++; };

// 1. Banned calls in the draw path (comments ignored; the live-preview block of index.html is not part of it).
const BANNED = /\b(Date\.now|new Date|performance\.now|Math\.random|crypto\.getRandomValues|setTimeout|setInterval|requestAnimationFrame|requestIdleCallback|queueMicrotask)\b|@keyframes|\banimation\b|\btransition\b|\.animate\(/;
const FILES = ["index.html", "tokens.js", ...(await Promise.all(["engine", "scenes"].map(async (d) => (await readdir(d)).filter((f) => f.endsWith(".js")).map((f) => `${d}/${f}`)))).flat()];
for (const f of FILES) {
  let src = await readFile(f, "utf8");
  if (f === "index.html") src = src.split("// --- live preview")[0];
  const hits = src.split("\n").map((l, n) => [n + 1, l.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "")]).filter(([, l]) => BANNED.test(l));
  report(hits.length === 0, `no banned calls in ${f}`, hits.map(([n, l]) => `line ${n}: ${l.trim()}`).join(" | "));
}

// 2. The hold rule: every statement stays fully legible for at least T.hold seconds after it finishes animating in.
for (const sc of scenes) for (const st of sc.statements ?? []) {
  report(st.outStart - st.inDone >= T.hold, `${st.id}: held ${(st.outStart - st.inDone).toFixed(2)} s (rule: at least ${T.hold} s)`);
}

// 3. replay() gives the same states whichever order they are asked for.
{
  const mk = () => replay({ y: 0, v: 0 }, (s, dt) => { const v = s.v + 9.8 * dt; return { y: s.y + v * dt, v }; });
  const ts = Array.from({ length: 60 }, (_, i) => i / 30), f = mk(), r = mk(), m = mk();
  const fwd = ts.map(f), rev = ts.slice().reverse().map(r).reverse(), shuf = new Array(60);
  for (let i = 0; i < 60; i++) { const j = (i * 7) % 60; shuf[j] = m(ts[j]); }
  report(JSON.stringify(fwd) === JSON.stringify(rev) && JSON.stringify(fwd) === JSON.stringify(shuf), "replay(): forward, reverse and shuffled queries agree");
}

// 4. Frame K in a fresh page, then in another page after frames 0..K in order.
const { open, close } = await start();
try {
  const fresh = await open();
  if (fresh.frames <= K) K = Math.floor(fresh.frames * 0.9);   // a 5 s card has no frame 150: take one at 90 % (the start of its exit)
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

  // 5. The safe box: the bright type stays inside it for the whole hold, push included.
  for (const sc of scenes) for (const st of sc.statements ?? []) {
    let worst = null;
    for (let i = Math.ceil(st.inDone * fresh.fps); i < Math.floor(st.outStart * fresh.fps); i += 6) {
      const b = await fresh.bright(i);
      if (b && (b.x0 < T.safe.x || b.x1 > T.W - T.safe.x || b.y0 < T.safe.y || b.y1 > T.H - T.safe.y)) { worst = { i, ...b }; break; }
    }
    report(!worst, `${st.id}: type stays inside the safe box (x ${T.safe.x}..${T.W - T.safe.x}, y ${T.safe.y}..${T.H - T.safe.y})`, worst ? JSON.stringify(worst) : "");
  }
} catch (e) {
  report(false, "a page threw while rendering", String(e.message).split("\n")[0]);
} finally { await close(); }

console.log(failed ? "FAIL" : "PASS");
process.exit(failed ? 1 : 0);

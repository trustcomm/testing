// Determinism: frame K is the same bytes whether it is the first frame a page draws or the (K+1)th.
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { start } from "./harness.mjs";
import { tokens as T } from "./tokens.js";
import { scenes } from "./scenes/index.js";
import { replay } from "./engine/sim.js";
import { hue } from "./engine/draw.js";

// the type demo's timing rules (seconds)
const RULES = { entrance: [0.3, 0.6], exit: [0.15, 0.3] };
const EPS = 1e-9;
// frames chosen to land inside moves: 262 odometer roll, 300 marker wipe, 385 split exit, 510 the diagram pulse
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

// 1b. Tokens only: at most four hues; no colour literals in the engine or the scenes; no stroke width as a bare number.
{
  const NEUTRAL = ["bg", "ink", "dim", "glow"], names = Object.keys(T.color).filter((k) => !NEUTRAL.includes(k));
  report(names.length <= 4, `palette: ${names.length} hues (${names.join(", ")}) plus the neutrals ${NEUTRAL.join(", ")} (max 4 hues)`);
  const gaps = names.flatMap((a, i) => names.slice(i + 1).map((b) => { const d = Math.abs(hue(T.color[a]) - hue(T.color[b])); return [a, b, Math.min(d, 360 - d)]; }));
  report(gaps.every(([, , d]) => d >= 40), "the hues are distinct (at least 40 degrees apart)", gaps.filter(([, , d]) => d < 40).map(([a, b, d]) => `${a}/${b} ${d.toFixed(0)}`).join(", "));
  for (const dir of ["engine", "scenes"]) for (const f of await readdir(dir)) {
    if (!f.endsWith(".js")) continue;
    const bad = (await readFile(`${dir}/${f}`, "utf8")).split("\n").map((l, n) => [n + 1, l.replace(/\/\/.*$/, "")])
      .filter(([, l]) => /#[0-9a-fA-F]{3,8}\b/.test(l) || (f !== "draw.js" && /["'`]rgba?\(/.test(l)) || /lineWidth\s*=\s*[0-9.]/.test(l));
    report(bad.length === 0, `tokens only in ${dir}/${f}`, bad.map(([n, l]) => `line ${n}: ${l.trim()}`).join(" | "));
  }
}

// 2. Statement timing: held at least T.hold; and, for statements that declare inStart/outEnd, the entrance and exit windows.
for (const sc of scenes) for (const st of sc.statements ?? []) {
  report(st.outStart - st.inDone >= T.hold - EPS, `${st.id}: held ${(st.outStart - st.inDone).toFixed(2)} s (rule: at least ${T.hold} s)`);
  if (st.inStart == null) continue;
  const e = st.inDone - st.inStart, x = st.outEnd - st.outStart;
  report(e >= RULES.entrance[0] - EPS && e <= RULES.entrance[1] + EPS, `${st.id}: entrance ${e.toFixed(2)} s (rule: ${RULES.entrance.join("-")} s)`);
  report(x >= RULES.exit[0] - EPS && x <= RULES.exit[1] + EPS, `${st.id}: exit ${x.toFixed(2)} s (rule: ${RULES.exit.join("-")} s)`);
  if (st.cue) report(Math.abs(st.inStart - st.cue.propStart - 0.2) < 1e-6, `${st.id}: arrives 0.2 s after its prop (${st.cue.prop})`);
  report(st.outEnd <= sc.dur + EPS, `${st.id}: finishes inside its scene (${st.outEnd.toFixed(2)} of ${sc.dur} s)`);
}

// 3. replay() gives the same states whichever order they are asked for.
{
  const mk = () => replay({ y: 0, v: 0 }, (s, dt) => { const v = s.v + 9.8 * dt; return { y: s.y + v * dt, v }; });
  const ts = Array.from({ length: 60 }, (_, i) => i / 30), f = mk(), r = mk(), m = mk();
  const fwd = ts.map(f), rev = ts.slice().reverse().map(r).reverse(), shuf = new Array(60);
  for (let i = 0; i < 60; i++) { const j = (i * 7) % 60; shuf[j] = m(ts[j]); }
  report(JSON.stringify(fwd) === JSON.stringify(rev) && JSON.stringify(fwd) === JSON.stringify(shuf), "replay(): forward, reverse and shuffled queries agree");
}

// 4. Frames K in a fresh page (each drawn first), against the same frames after rendering 0..K in order.
const { open, close } = await start();
try {
  const fresh = await open();
  report(fresh.fps === 30, `page exposes FPS = 30 and DURATION ${fresh.duration} s (${fresh.frames} frames)`);
  const KS = [...new Set([150, 262, 300, 385, 510].map((k) => Math.min(k, fresh.frames - 1)))].sort((a, b) => a - b);
  const cold = {}, warm = {};
  for (const K of KS) cold[K] = sha(await (await open()).png(K));
  const replayed = await open();
  for (let i = 0; i <= KS.at(-1); i++) { const png = await replayed.png(i); if (KS.includes(i)) warm[i] = sha(png); }
  for (const K of KS) report(cold[K] === warm[K], `frame ${K}: fresh page = after frames 0..${K}`, `${cold[K].slice(0, 16)} ${warm[K].slice(0, 16)}`);

  // extras: random access, and a control that the page is not simply static
  const K = KS[0], hop = await open();
  for (const i of [K + 25, 3, K - 1]) await hop.png(i);
  const c = sha(await hop.png(K));
  report(cold[K] === c, `frame ${K}: fresh page = after hops (${K + 25}, 3, ${K - 1})`, `${cold[K].slice(0, 16)} ${c.slice(0, 16)}`);
  report(cold[K] !== sha(await fresh.png(K + 1)), `frame ${K} differs from frame ${K + 1} (the page is not static)`);

  // 5. The safe box: the bright type stays inside it while a statement holds. Statements overlap, and a line that is
  //    sliding in or out may cross the margin on purpose, so only frames where every other statement is at rest or hidden count.
  const moving = (st, u) => (u >= st.inStart && u < st.inDone) || (u >= st.outStart && u <= st.outEnd);
  for (const sc of scenes) for (const st of sc.statements ?? []) {
    let worst = null, checked = 0;
    for (let i = Math.ceil((sc.start + st.inDone) * fresh.fps); i < Math.floor((sc.start + st.outStart) * fresh.fps); i += 3) {
      const u = i / fresh.fps - sc.start;
      if ((sc.statements ?? []).some((o) => o !== st && moving(o, u))) continue;
      checked++;
      const b = await fresh.bright(i);
      if (b && (b.x0 < T.safe.x || b.x1 > T.W - T.safe.x || b.y0 < T.safe.y || b.y1 > T.H - T.safe.y)) { worst = { frame: i, ...b }; break; }
    }
    report(!worst && checked > 0, `${st.id}: type stays inside the safe box (x ${T.safe.x}..${T.W - T.safe.x}, y ${T.safe.y}..${T.H - T.safe.y}), ${checked} frames`, worst ? JSON.stringify(worst) : "");
  }
} catch (e) {
  report(false, "a page threw while rendering", String(e.message).split("\n")[0]);
} finally { await close(); }

console.log(failed ? "FAIL" : "PASS");
process.exit(failed ? 1 : 0);

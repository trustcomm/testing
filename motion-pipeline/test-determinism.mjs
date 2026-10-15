// Determinism: frame K is the same bytes whether it is the first frame a page draws or the (K+1)th.
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { start } from "./harness.mjs";
import { tokens as T } from "./tokens.js";
import { scenes } from "./scenes/index.js";
import { replay } from "./engine/sim.js";
import { hue } from "./engine/draw.js";
import { riseAt, sparkAt, confettiAt } from "./engine/particles.js";

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

// 1c. Particles must not pop: every particle's alpha is 0 where it appears and where it disappears, and never jumps
//     between frames. Each look is sampled for 400 particles every 1/240 s; the shader is checked for the same structure.
{
  const looks = [
    ["motes", 0, 14, (i, t) => riseAt(i, t, { seed: 2, depth: 0.65, cam: [t * 18, t * 8] })],
    ["motes, camera at 10x", 0, 14, (i, t) => riseAt(i, t, { seed: 2, depth: 1, cam: [t * 180, t * 80] })],
    ["motes, density dial", 0, 14, (i, t) => riseAt(i, t, { seed: 2, depth: 0.65, density: 0.3 + 0.7 * Math.sin(t) ** 2 })],
    ["sparks", 0, 3, (i, t) => sparkAt(i, t, { x: 500, y: 600, t0: 0.5, seed: 5 })],
    ["confetti", 0, 5, (i, t) => confettiAt(i, t, { x: 500, y: 600, t0: 0.5, seed: 5 })],
  ];
  for (const [name, a, b, at] of looks) {
    let edge = 0, jump = 0;
    for (let i = 0; i < 400; i++) {
      let prev = null;
      const alpha = [];
      for (let t = a; t <= b; t += 1 / 240) alpha.push(at(i, t)?.alpha ?? null);
      alpha.forEach((v, k) => {
        const near = (k > 0 && alpha[k - 1] === null) || (k + 1 < alpha.length && alpha[k + 1] === null);
        if (v !== null && near) edge = Math.max(edge, v);                              // appearing or disappearing
        if (k >= 8 && v !== null && alpha[k - 8] !== null) jump = Math.max(jump, Math.abs(v - alpha[k - 8]));   // one frame at 30 fps
      });
    }
    report(edge <= 0.02 && jump <= 0.45, `particles, ${name}: alpha ${edge.toFixed(3)} at birth/death (max 0.02), biggest frame-to-frame jump ${jump.toFixed(2)} (max 0.45)`);
  }
  const vert = await readFile("shaders/particles.vert", "utf8");
  report(/age\s*=\s*mod\(/.test(vert) && /sin\(3\.14159265\s*\*\s*age\s*\/\s*life\)/.test(vert), "particles.vert: age wraps with mod() and alpha is sin(pi * age / life), 0 at birth and death");
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

// 4. Determinism. The 2D design layer is replayed fast (no GL) at five frames; the full pipeline, which in software GL
//    costs about 0.7 s a frame, is replayed from 0 for frame 150 and hopped around for frame 510.
const { open, close } = await start();
try {
  const fresh = await open();
  report(fresh.fps === 30, `page exposes FPS = 30 and DURATION ${fresh.duration} s (${fresh.frames} frames)`);
  const KS = [...new Set([150, 262, 300, 385, 510, 645, 717].map((k) => Math.min(k, fresh.frames - 1)))].sort((a, b) => a - b);

  const cold = {}, warm = {};
  for (const K of KS) cold[K] = await (await open()).layerHash(K);
  const replayed = await open();
  for (let i = 0; i <= KS.at(-1); i++) { if (KS.includes(i)) warm[i] = await replayed.layerHash(i); else await replayed.layerDraw(i); }
  for (const K of KS) report(cold[K] === warm[K], `layer, frame ${K}: fresh page = after frames 0..${K}`, `${cold[K].slice(0, 16)} ${warm[K].slice(0, 16)}`);

  const K0 = KS[0], a = sha(await (await open()).png(K0));                      // the whole pipeline, frame K0, in a fresh page
  const full = await open();
  for (let i = 0; i < K0; i++) await full.draw(i);
  const b = sha(await full.png(K0));                                           // ... and after frames 0..K0 in another
  report(a === b, `pipeline, frame ${K0}: fresh page = after frames 0..${K0}`, `${a.slice(0, 16)} ${b.slice(0, 16)}`);

  const K1 = KS.at(-1), c = sha(await (await open()).png(K1)), hop = await open();
  for (const i of [K1 + 15, 3, K1 - 1]) await hop.draw(i);
  const d = sha(await hop.png(K1));
  report(c === d, `pipeline, frame ${K1}: fresh page = after hops (${K1 + 15}, 3, ${K1 - 1})`, `${c.slice(0, 16)} ${d.slice(0, 16)}`);
  report(a !== sha(await fresh.png(K0 + 1)), `frame ${K0} differs from frame ${K0 + 1} (the page is not static)`);

  // the post parameters come back to their defaults at the start of every renderFrame
  const got = await fresh.page.evaluate(() => { window.POST.bloom = 9; window.POST.ca = 9; window.renderFrame(3); return [window.POST.bloom, window.POST.ca]; });
  report(got[0] === 0.25 && got[1] === 0.8, "window.POST: overrides are reset to the defaults by the next renderFrame", JSON.stringify(got));

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

// Determinism: frame K is the same bytes whether it is the first frame a page draws or the (K+1)th.
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { start } from "./harness.mjs";
import { tokens as T } from "./tokens.js";
import { scenes } from "./scenes/index.js";
import { replay } from "./engine/sim.js";
import { hue } from "./engine/draw.js";
import { moteAt, sparkAt, confettiAt, glParticleAt, glyphBursts, GLSL } from "./engine/particles.js";
import { field } from "./scenes/s04_particles.js";

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

// 1c. Particles must not pop. For every particle the scene draws, over frames 0 to 180 (the scene's 6 s at 30 fps), the
//     alpha must never jump by more than 0.2 between consecutive frames; and wherever a particle appears or disappears
//     (sampled every 1/240 s) its alpha must be 0 (at most 0.02). The look's own state function is scanned, with the
//     scene's own options, camera and fade, so this measures what the scene draws. The GPU field is scanned through its
//     JS twin (checked against the GPU in section 4b), and sparksFromGlyphs through glyphBursts.
{
  const FR = 180, LIMIT = 0.2, EDGE = 0.02, F = field, FPS = T.FPS;
  const glyphs = Array.from("LOCKED", (ch, i) => ({ ch, i, x: 200 + i * 100, y: 640, w: 80 }));
  const gb = glyphBursts(glyphs, glyphs.map((_, i) => 1 + 0.1 * (i + 1)));
  const big = (t) => { const c = F.cam(t); return { dx: c.dx * 10, dy: c.dy * 10, z: c.z * 4 }; };
  const looks = [
    ["motes, 600 in 3 layers, the scene's camera and fade", F.motes.n, 6, (i, t) => moteAt(i, t, { ...F.motes, cam: F.cam(t), alpha: F.fade(t) })],
    ["motes, camera at 10x", F.motes.n, 6, (i, t) => moteAt(i, t, { ...F.motes, cam: big(t) })],
    ["motes, density dial sweeping", F.motes.n, 6, (i, t) => moteAt(i, t, { ...F.motes, density: 0.3 + 0.7 * Math.sin(t) ** 2 })],
    ["burst, 220 sparks", F.burst.n, 6, (i, t) => sparkAt(i, t, { ...F.burst, x: 400, y: 600 })],
    ["confetti, 160 pieces", F.confetti.n, 6, (i, t) => confettiAt(i, t, F.confetti)],
    ["sparksFromGlyphs, 6 x 14", gb.length * 14, 6, (i, t) => sparkAt(i % 14, t, gb[Math.floor(i / 14)])],
    ["glParticles, 40,000 (JS twin), density dial sweeping", 40000, 4000, (i, t) => glParticleAt(i, t, { cam: F.cam(t), density: 0.3 + 0.7 * Math.sin(t) ** 2 })],
    ["glParticles, density ramped 0 to 1 at 1 a second (the safe rate)", 40000, 4000, (i, t) => glParticleAt(i, t, { density: Math.min(1, t) })],
  ];
  for (const [name, n, fine, at] of looks) {
    let jump = 0, who = "", edge = 0;
    for (let i = 0; i < n; i++) {                                                     // frame to frame, all particles
      let prev = at(i, 0)?.alpha ?? 0;
      for (let f = 1; f <= FR; f++) {
        const a = at(i, f / FPS)?.alpha ?? 0;
        if (Math.abs(a - prev) > jump) { jump = Math.abs(a - prev); who = `particle ${i}, frame ${f - 1} to ${f}`; }
        prev = a;
      }
    }
    for (let i = 0; i < Math.min(n, fine * 4); i++) {                                 // births and deaths, at 1/240 s
      let last;
      for (let k = 0; k <= 6 * 240; k++) {
        const st = at(i, k / 240);
        if (k > 0 && ((last === null) !== (st === null))) edge = Math.max(edge, (st ?? last).alpha);              // appeared / vanished
        if (k > 0 && last && st && st.p < last.p - 0.5) edge = Math.max(edge, last.alpha, st.alpha);              // looped: died and was reborn
        last = st;
      }
    }
    report(jump <= LIMIT && edge <= EDGE, `particles, ${name}: biggest alpha jump ${jump.toFixed(3)} between frames, over frames 0-${FR} (max ${LIMIT}); alpha ${edge.toFixed(3)} at birth/death (max ${EDGE})`, jump > LIMIT ? who : "");
  }

  // the camera: depth scales the offset (parallax) and z dollies about the frame centre
  const find = (ok) => { for (let i = 0; i < F.motes.n; i++) { const m = moteAt(i, 3.1, F.motes); if (ok(m) && m.x > 150 && m.x < T.W - 150 && m.y > 150 && m.y < T.H - 150) return i; } };
  const far = find((m) => m.layer === 0), near = find((m) => m.layer === 2), shift = (i, cam) => { const a = moteAt(i, 3.1, F.motes), b = moteAt(i, 3.1, { ...F.motes, cam }); return [b.x - a.x, b.y - a.y]; };
  const [fx, fy] = shift(far, { dx: 100, dy: 40, z: 0 }), [nx, ny] = shift(near, { dx: 100, dy: 40, z: 0 }), s0 = { x: 400, y: 600, t0: 2 };
  const bs = sparkAt(7, 2.5, s0), bc = sparkAt(7, 2.5, { ...s0, cam: { dx: 50, dy: 20, z: 0 } });
  report(Math.abs(fx + 35) < 1e-6 && Math.abs(fy + 14) < 1e-6 && Math.abs(nx + 100) < 1e-6 && Math.abs(ny + 40) < 1e-6,
    "camera: dx 100 moves a far mote 35 px and a near one 100 px the other way (parallax)", `far ${fx.toFixed(1)}, ${fy.toFixed(1)}  near ${nx.toFixed(1)}, ${ny.toFixed(1)}`);
  report(Math.abs(bc.x - (bs.x - 50)) < 1e-6 && Math.abs(bc.y - (bs.y - 20)) < 1e-6, "camera: a burst (depth 1) moves by exactly -dx, -dy");
  const z0 = moteAt(near, 3.1, F.motes), z1 = moteAt(near, 3.1, { ...F.motes, cam: { dx: 0, dy: 0, z: 0.2 } });
  report(Math.abs((z1.x - T.W / 2) - 1.2 * (z0.x - T.W / 2)) < 1e-6, "camera: z 0.2 pushes a near particle 1.2x out from the frame centre");

  // the shaders: the structure that makes the alpha 0 at birth and at death
  report(/age\s*=\s*mod\(/.test(GLSL.vert) && /sin\(3\.14159265\s*\*\s*age\s*\/\s*life\)/.test(GLSL.vert), "particle vertex shader: age wraps with mod() and alpha is sin(pi * age / life), 0 at birth and death");
  report(/gl_VertexID/.test(GLSL.vert) && /uTime/.test(GLSL.vert) && !/\bin\s+\w+\s+a[A-Z]/.test(GLSL.vert), "particle vertex shader: everything from gl_VertexID and uTime, no vertex attributes");
  report(!/\bsin\s*\(\s*[^)]*43758/.test(GLSL.vert) && /pcg/.test(GLSL.vert), "particle vertex shader: integer hash (pcg), not fract(sin(x) * 43758)");
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
//    costs about 0.7 s a frame, is replayed from 0 for frame 150 and hopped around for the particle frames.
const { open, close } = await start();
try {
  const fresh = await open();
  report(fresh.fps === 30, `page exposes FPS = 30 and DURATION ${fresh.duration} s (${fresh.frames} frames)`);
  const KS = [...new Set([60, 120, 150, 262, 300, 385, 510, 630, 690, 717].map((k) => Math.min(k, fresh.frames - 1)))].sort((a, b) => a - b);

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

  // frames 630 and 690 are frames 60 and 120 of the particles scene (it starts at 19 s): the burst goes off at 60, the confetti is in flight at 120
  for (const K1 of [630, 690, 717].map((k) => Math.min(k, fresh.frames - 1))) {
    const c = sha(await (await open()).png(K1)), hop = await open();
    for (const i of [K1 + 15, 3, K1 - 1].map((k) => Math.min(k, fresh.frames - 1))) await hop.draw(i);
    const d = sha(await hop.png(K1));
    report(c === d, `pipeline, frame ${K1}: fresh page = after hops (${K1 + 15}, 3, ${K1 - 1})`, `${c.slice(0, 16)} ${d.slice(0, 16)}`);
  }
  report(a !== sha(await fresh.png(K0 + 1)), `frame ${K0} differs from frame ${K0 + 1} (the page is not static)`);

  // the post parameters come back to their defaults at the start of every renderFrame
  const got = await fresh.page.evaluate(() => { window.POST.bloom = 9; window.POST.ca = 9; window.renderFrame(3); return [window.POST.bloom, window.POST.ca]; });
  report(got[0] === 0.25 && got[1] === 0.8, "window.POST: overrides are reset to the defaults by the next renderFrame", JSON.stringify(got));

  // 4b. glParticles, forced on over frame 120: the same bytes cold, warm (after hops) and drawn twice in one page; and the
  //     GPU agrees with the JS twin that section 1c scanned: one particle at a time (n 1, first = its id), the pixels it
  //     adds are centred (to a pixel) where glParticleAt says, and a particle whose twin alpha is 0 adds nothing.
  {
    const K = 120, on = { n: 40000, intensity: 2 };
    const p1 = await open(); await p1.setParticles(on);
    const g1 = sha(await p1.png(K)), g1b = sha(await p1.png(K));
    const p2 = await open(); await p2.setParticles(on);
    for (const i of [K + 30, 3, K - 1]) await p2.draw(i);
    const g2 = sha(await p2.png(K));
    report(g1 === g1b && g1 === g2, `glParticles (40,000 points), frame ${K}: cold = drawn again = after hops`, `${g1.slice(0, 16)} ${g1b.slice(0, 16)} ${g2.slice(0, 16)}`);
    report(g1 !== sha(await (await open()).png(K)), "glParticles: the field is on (the frame differs from n = 0)");

    const T0 = 1.7, pick = [];
    for (let i = 0; pick.length < 8; i++) { const q = glParticleAt(i, T0, { size: 12 }); if (q.alpha > 0.35 && q.size < 25 && q.x > 80 && q.x < T.W - 80 && q.y > 80 && q.y < T.H - 80) pick.push([i, q]); }
    const dark = []; for (let i = 0; dark.length < 3; i++) if (glParticleAt(i, T0, { size: 12 }).alpha < 1e-4) dark.push([i, glParticleAt(i, T0, { size: 12 })]);
    const pg = await open(); await pg.setPost({ on: false });
    const diff = async (i, q) => pg.page.evaluate(async (t, i, qx, qy) => {
      const lum = () => { window.renderFrame(t); const c = document.createElement("canvas"); c.width = 1920; c.height = 1080; const g = c.getContext("2d"); g.drawImage(document.getElementById("c"), 0, 0); return g.getImageData(0, 0, 1920, 1080).data; };
      window.PARTICLES.force = {}; const base = lum();
      window.PARTICLES.force = { n: 1, first: i, size: 12, intensity: 1 }; const withP = lum();
      window.PARTICLES.force = {};
      let sx = 0, sy = 0, sw = 0, out = 0;
      for (let k = 0; k < 1920 * 1080; k++) {
        const d = (withP[k * 4] + withP[k * 4 + 1] + withP[k * 4 + 2]) - (base[k * 4] + base[k * 4 + 1] + base[k * 4 + 2]);
        if (d <= 0) continue;
        const x = k % 1920, y = (k / 1920) | 0;
        if (Math.abs(x - qx) < 40 && Math.abs(y - qy) < 40) { sx += x * d; sy += y * d; sw += d; } else out += d;
      }
      return { cx: sw ? sx / sw : null, cy: sw ? sy / sw : null, inside: sw, outside: out };
    }, T0, i, q.x, q.y);
    let worst = 0, bad = "";
    for (const [i, q] of pick) { const r = await diff(i, q); const e = r.cx === null ? 99 : Math.hypot(r.cx - (q.x - 0.5), r.cy - (q.y - 0.5)); if (e > worst) worst = e; if (e > 1 || r.outside > r.inside * 0.05) bad += ` particle ${i}: GPU (${r.cx?.toFixed(1)}, ${r.cy?.toFixed(1)}) twin (${q.x.toFixed(1)}, ${q.y.toFixed(1)})`; }
    report(!bad, `glParticles: the GPU draws ${pick.length} sampled particles where the JS twin says (worst error ${worst.toFixed(2)} px from the pixel centre, max 1)`, bad);
    let ghost = 0;
    for (const [i, q] of dark) { const r = await diff(i, q); ghost = Math.max(ghost, r.inside + r.outside); }
    report(ghost < 30, `glParticles: ${dark.length} particles with twin alpha 0 add nothing on the GPU (sum of added channel values ${ghost.toFixed(0)}, over a 1920x1080 frame)`);
  }

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

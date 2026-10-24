// Safe zones and clipping, on pixels. For each frame: the background alone, the picture without captions, the full picture; diff them.
// Content = nocap vs bg; captions = full vs nocap. Flags: content in the top 240 px or the bottom 440 px, within 24 px of a side, or touching the captions.
// usage: node scripts/layout.mjs <frame> [frame ...]      (exit code 1 if anything is flagged)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";

const frames = process.argv.slice(2).map(Number);
const W = 1080, H = 1920, TOP = 240, BOTTOM = H - 440, MARGIN = 24, THR = 14;
// Deliberate exceptions, each with its reason: the alarm shockwave ring of S1 expands past the frame on the hit, the globe is the object the camera dollies through (S2 opens by passing it), S4 ends as dust drifting out past the edges,
// and the brief puts the tiny grey sources line at the bottom edge of S13 right under the captions (it still ends above y 1480).
const ALLOW = {
  160: { re: /top|bottom|side|touches/, why: "S1: the alarm shockwave ring leaves the frame" }, 161: { re: /top|bottom|side|touches/, why: "S1: the alarm shockwave ring leaves the frame" },
  182: { re: /top|side|touches/, why: "S2: the camera dollies through the globe" },
  639: { re: /top|side/, why: "S4: dust drifting out" }, 647: { re: /side/, why: "S4: dust drifting out" },
  2743: { re: /touches/, why: "S13: sources line sits under the captions" }, 2757: { re: /touches/, why: "S13: sources line sits under the captions" },
};
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const props = { bg: { mode: "bg", audio: false }, nocap: { mode: "full", captions: false, audio: false }, full: { mode: "full", audio: false } };
const comps = Object.fromEntries(await Promise.all(Object.entries(props).map(async ([k, inputProps]) => [k, await selectComposition({ serveUrl, id: "Php2Shell", inputProps, browserExecutable })])));
const dir = "build/layout"; await mkdir(dir, { recursive: true });
const decode = async (f) => PNG.sync.read(await readFile(f));
const bbox = (a, b, thr = THR) => {
  let x0 = W, y0 = H, x1 = -1, y1 = -1, n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4;
    if (Math.max(Math.abs(a.data[o] - b.data[o]), Math.abs(a.data[o + 1] - b.data[o + 1]), Math.abs(a.data[o + 2] - b.data[o + 2])) > thr) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return n ? { x0, y0, x1, y1, n } : null;
};
let bad = 0;
for (const f of frames) {
  const p = {};
  for (const k of Object.keys(props)) { p[k] = `${dir}/${k}-${String(f).padStart(5, "0")}.png`; await renderStill({ composition: comps[k], serveUrl, inputProps: props[k], frame: f, browserExecutable, output: p[k], imageFormat: "png" }); }
  const [bg, nocap, full] = await Promise.all([decode(p.bg), decode(p.nocap), decode(p.full)]);
  const content = bbox(bg, nocap, 20), caps = bbox(nocap, full, 40), notes = [];
  if (content) {
    if (content.y0 < TOP) notes.push(`content in the top ${TOP}px (y0 ${content.y0})`);
    if (content.y1 > BOTTOM) notes.push(`content in the bottom 440px (y1 ${content.y1})`);
    if (content.x0 < MARGIN || content.x1 > W - MARGIN) notes.push(`content within ${MARGIN}px of a side (x ${content.x0}..${content.x1})`);
  }
  if (caps) {
    if (caps.y1 > BOTTOM) notes.push(`captions in the bottom 440px (y1 ${caps.y1})`);
    if (content && content.y1 > caps.y0 - 4 && Math.min(content.x1, caps.x1) > Math.max(content.x0, caps.x0)) notes.push(`content (to y ${content.y1}) touches the captions (from y ${caps.y0})`);
  }
  const allowed = notes.filter((n) => ALLOW[f]?.re.test(n)), real = notes.filter((n) => !allowed.includes(n));
  if (real.length) bad++;
  console.log(`${real.length ? "FLAG" : "ok  "}  frame ${String(f).padStart(4)}  content ${content ? `x ${content.x0}..${content.x1} y ${content.y0}..${content.y1}` : "-"}  captions ${caps ? `y ${caps.y0}..${caps.y1}` : "-"}  ${real.join("; ")}${allowed.length ? `  [by design: ${ALLOW[f].why}]` : ""}`);
}
console.log(bad ? `FAIL: ${bad} of ${frames.length} frames flagged` : `PASS: ${frames.length} frames`);
process.exit(bad ? 1 : 0);

// Safe zones and overflow, on pixels. For every sampled frame: render the backgrounds alone, the content without captions, and the
// full frame; diff them. Content = nocap vs bg; captions = full vs nocap. Frames inside a dissolve (the 12 frames from each scene's
// first word) are skipped: a blur-dissolve spreads on purpose.
// usage: node scripts/verify-layout.mjs [step=15]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";
import { tsImport } from "tsx/esm/api";

const step = Number(process.argv[2] ?? 15);
const { sceneStart, SCENES } = await tsImport("../src/cues.ts", import.meta.url);
const FPS = 30, W = 1080, H = 1920, TOP = 240, BOTTOM = H - 440, MARGIN = 24;
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const props = { bg: { mode: "bg", audio: false }, nocap: { mode: "full", captions: false, audio: false }, full: { mode: "full", audio: false } };
const comps = Object.fromEntries(await Promise.all(Object.entries(props).map(async ([k, inputProps]) => [k, await selectComposition({ serveUrl, id: "Keynote", inputProps, browserExecutable })])));
const total = comps.full.durationInFrames;
const starts = SCENES.map((_, i) => Math.round(sceneStart(i) * FPS));
const inDissolve = (f) => starts.some((s, i) => i > 0 && f >= s - 1 && f <= s + 14) || (f >= starts[3] && f <= starts[3] + 20);
const frames = [...new Set([...Array.from({ length: Math.floor(total / step) }, (_, k) => k * step + 7), ...starts.slice(1).flatMap((s) => [s + 16, s + 30]), total - 1])].filter((f) => f >= 0 && f < total).sort((a, b) => a - b);
const dir = "build/verify"; await mkdir(dir, { recursive: true });
const decode = async (f) => PNG.sync.read(await readFile(f));
const bbox = (a, b, thr = 14) => {
  let x0 = W, y0 = H, x1 = -1, y1 = -1, n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4;
    if (Math.max(Math.abs(a.data[o] - b.data[o]), Math.abs(a.data[o + 1] - b.data[o + 1]), Math.abs(a.data[o + 2] - b.data[o + 2])) > thr) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return n ? { x0, y0, x1, y1, n } : null;
};
const sceneOf = (f) => starts.reduce((acc, s, i) => (f >= s ? i : acc), 0);
let bad = 0, checked = 0, minTop = 1e9, maxBottom = 0, minX = 1e9, maxX = 0, capTop = 1e9, capBottom = 0;
for (const f of frames) {
  const p = {};
  for (const k of Object.keys(props)) { p[k] = `${dir}/${k}-${String(f).padStart(5, "0")}.png`; await renderStill({ composition: comps[k], serveUrl, inputProps: props[k], frame: f, browserExecutable, output: p[k], imageFormat: "png" }); }
  const [bg, nocap, full] = await Promise.all([decode(p.bg), decode(p.nocap), decode(p.full)]);
  const content = bbox(bg, nocap), caps = bbox(nocap, full), skip = inDissolve(f), notes = [];
  if (!skip) {
    checked++;
    if (content) {
      minTop = Math.min(minTop, content.y0); maxBottom = Math.max(maxBottom, content.y1); minX = Math.min(minX, content.x0); maxX = Math.max(maxX, content.x1);
      if (content.y0 < TOP) notes.push(`content in the top ${TOP}px (y0 ${content.y0})`);
      if (content.y1 > BOTTOM) notes.push(`content in the bottom 440px (y1 ${content.y1})`);
      if (content.x0 < MARGIN || content.x1 > W - MARGIN) notes.push(`content within ${MARGIN}px of a side (x ${content.x0}..${content.x1})`);
    }
    if (caps) {
      capTop = Math.min(capTop, caps.y0); capBottom = Math.max(capBottom, caps.y1);
      if (caps.y1 > BOTTOM) notes.push(`captions in the bottom 440px (y1 ${caps.y1})`);
      if (caps.x0 < MARGIN || caps.x1 > W - MARGIN) notes.push(`captions within ${MARGIN}px of a side`);
      if (content && content.y1 > caps.y0 - 4) notes.push(`content (to y ${content.y1}) touches the captions (from y ${caps.y0})`);
    }
  }
  if (notes.length) bad++;
  console.log(`${notes.length ? "FLAG" : skip ? "dis " : "ok  "}  frame ${String(f).padStart(4)} (${(f / FPS).toFixed(2)} s, ${SCENES[sceneOf(f)]})  content ${content ? `x ${content.x0}..${content.x1} y ${content.y0}..${content.y1}` : "-"}  captions ${caps ? `y ${caps.y0}..${caps.y1}` : "-"}  ${notes.join("; ")}`);
}
console.log(`${bad ? "FAIL" : "PASS"}: ${checked} frames checked outside the dissolves, ${bad} flagged. content y ${minTop}..${maxBottom} (limit ${TOP}..${BOTTOM}), x ${minX}..${maxX}; captions y ${capTop}..${capBottom}`);
process.exit(bad ? 1 : 0);

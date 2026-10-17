// Layout check on pixels. For each sampled frame: render the backgrounds alone, the scene content without captions, and the
// full frame; diff them. Content = nocap vs bg; captions = full vs nocap. Frames inside a scene wipe are skipped (a wipe
// crosses the whole frame on purpose).
// usage: node scripts/verify-layout.mjs [step=15]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";

const step = Number(process.argv[2] ?? 15);
const { sceneStart, sceneEnd, SCENE_IDS } = await import("tsx/esm/api").then((t) => t.tsImport("../src/cues.ts", import.meta.url));
const FPS = 30, W = 1080, H = 1920, TOP = 220, BOTTOM = H - 420, CAP_TOP = 1284, CAP_BOTTOM = 1486, MARGIN = 36;
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const props = { bg: { mode: "bg", audio: false }, nocap: { mode: "full", captions: false, audio: false }, full: { mode: "full", audio: false } };
// one resolved composition per mode: the props a still renders with come from the composition it was selected with
const comps = Object.fromEntries(await Promise.all(Object.entries(props).map(async ([k, inputProps]) => [k, await selectComposition({ serveUrl, id: "Explainer", inputProps, browserExecutable })])));
const total = comps.full.durationInFrames;

const starts = SCENE_IDS.map((_, i) => Math.round(sceneStart(i) * FPS));
const inWipe = (f) => starts.slice(1).some((s) => f >= s - 4 && f <= s + 4);
const frames = [...new Set([...Array.from({ length: Math.floor(total / step) }, (_, k) => k * step + 7), ...starts.slice(1).flatMap((s) => [s - 4, s, s + 8, s + 20]), total - 1])].filter((f) => f >= 0 && f < total).sort((a, b) => a - b);
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
const sceneOf = (f) => starts.reduce((acc, s, i) => (f >= s - 4 ? i : acc), 0);
let bad = 0, checked = 0;
for (const f of frames) {
  const p = {};
  for (const k of Object.keys(props)) { p[k] = `${dir}/${k}-${String(f).padStart(5, "0")}.png`; await renderStill({ composition: comps[k], serveUrl, inputProps: props[k], frame: f, browserExecutable, output: p[k], imageFormat: "png" }); }
  const [bg, nocap, full] = await Promise.all([decode(p.bg), decode(p.nocap), decode(p.full)]);
  const content = bbox(bg, nocap), caps = bbox(nocap, full);
  const wipe = inWipe(f), notes = [];
  if (!wipe) {
    checked++;
    if (content) {
      if (content.y0 < TOP) notes.push(`content in the top ${TOP}px (y0 ${content.y0})`);
      if (content.y1 > BOTTOM) notes.push(`content in the bottom 420px (y1 ${content.y1})`);
      if (content.x0 < MARGIN || content.x1 > W - MARGIN) notes.push(`content within ${MARGIN}px of the side (x ${content.x0}..${content.x1})`);
    }
    if (caps) {
      if (caps.y0 < CAP_TOP - 30 || caps.y1 > CAP_BOTTOM + 10) notes.push(`captions outside their box (y ${caps.y0}..${caps.y1})`);
      if (caps.y1 > BOTTOM) notes.push(`captions in the bottom 420px (y1 ${caps.y1})`);
      if (caps.x0 < MARGIN || caps.x1 > W - MARGIN) notes.push(`captions within ${MARGIN}px of the side (x ${caps.x0}..${caps.x1})`);
      if (content && content.y1 > caps.y0 - 4) notes.push(`content (to y ${content.y1}) overlaps the captions (from y ${caps.y0})`);
    }
  }
  if (notes.length) bad++;
  console.log(`${notes.length ? "FLAG" : wipe ? "wipe" : "ok  "}  frame ${String(f).padStart(4)} (${(f / FPS).toFixed(2)} s, scene ${sceneOf(f) + 1})  content ${content ? `x ${content.x0}..${content.x1} y ${content.y0}..${content.y1}` : "-"}  captions ${caps ? `x ${caps.x0}..${caps.x1} y ${caps.y0}..${caps.y1}` : "-"}  ${notes.join("; ")}`);
}
console.log(`${bad ? "FAIL" : "PASS"}: ${checked} frames checked outside the wipes, ${bad} flagged`);
process.exit(bad ? 1 : 0);

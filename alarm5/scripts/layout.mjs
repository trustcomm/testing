// Safe zones and clipping, on pixels. For each frame: the background alone, the picture without captions, the full picture; diff them.
// Content = nocap vs bg; captions = full vs nocap. Flags: content in the top 240 px or the bottom 440 px, within 24 px of a side, or touching the captions.
// The map layer is judged without its grid and dotted route paths (routes: false): those run off the frame on purpose, like a real map; the stations, beacons, art, HUD and text are all judged.
// usage: node scripts/layout.mjs <frame> [frame ...]      (exit code 1 if anything is flagged)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";

const frames = process.argv.slice(2).map(Number);
const W = 1080, H = 1920, TOP = 240, BOTTOM = H - 440, MARGIN = 24, THR = 48;
// Deliberate exceptions, each with its reason (frame -> {re, why}); filled in after the first run, see the list printed at the end.
const ALLOW = {};
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const props = { bg: { mode: "bg", audio: false }, nocap: { mode: "full", captions: false, audio: false, routes: false }, full: { mode: "full", audio: false, routes: false } };
const comps = Object.fromEntries(await Promise.all(Object.entries(props).map(async ([k, inputProps]) => [k, await selectComposition({ serveUrl, id: "Alarm5", inputProps, browserExecutable })])));
const dir = "build/layout"; await mkdir(dir, { recursive: true });
const decode = async (f) => PNG.sync.read(await readFile(f));
// content = pixels that differ from the background by more than THR in some channel (soft glows stay below it: text, lines and fills are well above);
// a zone counts as violated when more than MIN such pixels lie in it (a hairline that merely crosses the frame is a few dozen pixels, a clipped card or label thousands)
const MIN = 400;
const diffMask = (a, b, thr) => { const m = new Uint8Array(W * H); for (let i = 0, o = 0; i < W * H; i++, o += 4) if (Math.max(Math.abs(a.data[o] - b.data[o]), Math.abs(a.data[o + 1] - b.data[o + 1]), Math.abs(a.data[o + 2] - b.data[o + 2])) > thr) m[i] = 1; return m; };
const box = (m, x0 = 0, y0 = 0, x1 = W, y1 = H) => { let a = W, b = H, c = -1, d = -1, n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (m[y * W + x]) { n++; if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > d) d = y; } return n ? { x0: a, y0: b, x1: c, y1: d, n } : null; };
let bad = 0;
for (const f of frames) {
  const p = {};
  for (const k of Object.keys(props)) { p[k] = `${dir}/${k}-${String(f).padStart(5, "0")}.png`; await renderStill({ composition: comps[k], serveUrl, inputProps: props[k], frame: f, browserExecutable, output: p[k], imageFormat: "png" }); }
  const [bg, nocap, full] = await Promise.all([decode(p.bg), decode(p.nocap), decode(p.full)]);
  const content = diffMask(bg, nocap, THR), capm = diffMask(nocap, full, 40), notes = [];
  const caps = box(capm), all = box(content);
  const zones = [["top " + TOP + " px", box(content, 0, 0, W, TOP)], ["bottom 440 px", box(content, 0, BOTTOM, W, H)], ["left " + MARGIN + " px", box(content, 0, 0, MARGIN, H)], ["right " + MARGIN + " px", box(content, W - MARGIN, 0, W, H)]];
  for (const [name, z] of zones) if (z && z.n > MIN) notes.push(`content in the ${name} (${z.n} px at x ${z.x0}..${z.x1} y ${z.y0}..${z.y1})`);
  if (caps) {
    if (caps.y1 > BOTTOM) notes.push(`captions in the bottom 440px (y1 ${caps.y1})`);
    const ov = box(content, Math.max(0, caps.x0 - 10), Math.max(0, caps.y0 - 10), Math.min(W, caps.x1 + 11), Math.min(H, caps.y1 + 11));
    if (ov && ov.n > 60) notes.push(`content overlaps the captions (${ov.n} px at x ${ov.x0}..${ov.x1} y ${ov.y0}..${ov.y1})`);
  }
  const allowed = notes.filter((n) => ALLOW[f]?.re.test(n)), real = notes.filter((n) => !allowed.includes(n));
  if (real.length) bad++; else for (const k of Object.keys(props)) await rm(p[k]);   // only the flagged frames keep their PNGs (build/layout/)
  console.log(`${real.length ? "FLAG" : "ok  "}  frame ${String(f).padStart(4)}  content ${all ? `x ${all.x0}..${all.x1} y ${all.y0}..${all.y1}` : "-"}  captions ${caps ? `y ${caps.y0}..${caps.y1}` : "-"}  ${real.join("; ")}${allowed.length ? `  [by design: ${ALLOW[f].why}]` : ""}`);
}
console.log(bad ? `FAIL: ${bad} of ${frames.length} frames flagged` : `PASS: ${frames.length} frames`);
process.exit(bad ? 1 : 0);

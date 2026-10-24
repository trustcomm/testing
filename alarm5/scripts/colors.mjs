// The colour story: ALARM red (#FF3B30) belongs to S1-S12 and never appears from S13 on; TRUST green (#34C759) carries every fix / action and everything from S13.
// Renders the picture without captions every `step` frames and counts red and green pixels. usage: node scripts/colors.mjs [step=15]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";

const step = Number(process.argv[2] ?? 15), t = JSON.parse(await readFile("public/timeline.json", "utf8"));
const sc = (id) => t.scenes.find((s) => s.id === id);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const inputProps = { mode: "full", captions: false, audio: false };
const composition = await selectComposition({ serveUrl, id: "Alarm5", inputProps, browserExecutable });
await mkdir("build/colors", { recursive: true });
const frames = []; for (let f = 3; f < composition.durationInFrames; f += step) frames.push(f);
const S13 = sc("S13").start, DISSOLVE = 24;    // the last red glows of S12 fade over the first frames of S13
let bad = 0, redBefore = 0, greenAfter = 0;
for (const f of frames) {
  const out = `build/colors/c${f}.png`;
  await renderStill({ composition, serveUrl, inputProps, frame: f, browserExecutable, output: out, imageFormat: "png" });
  const png = PNG.sync.read(await readFile(out)); let red = 0, green = 0;
  for (let i = 0; i < png.data.length; i += 4) { const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2]; if (r > 190 && g < 90 && b < 90) red++; else if (g > 150 && r < 110 && b < 130) green++; }
  const s = [...t.scenes].reverse().find((x) => f >= x.start).id, notes = [];
  if (f < S13) redBefore = Math.max(redBefore, red);
  if (f >= S13 + DISSOLVE && red > 40) notes.push(`red (${red} px) after S12`);
  if (f >= S13 + DISSOLVE) greenAfter = Math.max(greenAfter, green);
  if (notes.length) bad++;
  if (notes.length || f % (step * 12) === 3) console.log(`${notes.length ? "FLAG" : "ok  "} frame ${String(f).padStart(4)} ${s.padEnd(3)} red ${String(red).padStart(6)} green ${String(green).padStart(6)} ${notes.join("; ")}`);
}
console.log(`most red pixels before S13: ${redBefore}; most green pixels from S13 on: ${greenAfter}`);
console.log(bad ? `FAIL: ${bad} frames flagged` : `PASS: ${frames.length} frames sampled, no red from S13 on (${S13 + DISSOLVE} onwards)`);
process.exit(bad ? 1 : 0);

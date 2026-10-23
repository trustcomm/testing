// The colour story: RED means danger and ends at S10; GREEN is the trust accent and starts at S10 (S9's small shield + "FIX: 21 OCT" chip is the one allowed hint, S12's red X the one allowed red).
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
const composition = await selectComposition({ serveUrl, id: "Php2Shell", inputProps, browserExecutable });
await mkdir("build/colors", { recursive: true });
const frames = []; for (let f = 3; f < composition.durationInFrames; f += step) frames.push(f);
const dissolve = (f) => t.scenes.some((s, i) => i > 0 && f >= s.from - 1 && f <= s.from + 12);
let bad = 0;
for (const f of frames) {
  const out = `build/colors/c${f}.png`;
  await renderStill({ composition, serveUrl, inputProps, frame: f, browserExecutable, output: out, imageFormat: "png" });
  const png = PNG.sync.read(await readFile(out)); let red = 0, green = 0;
  for (let i = 0; i < png.data.length; i += 4) { const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2]; if (r > 200 && g < 90 && b < 90) red++; else if (g > 150 && r < 110 && b < 130) green++; }
  const s = [...t.scenes].reverse().find((x) => f >= x.start).id, n = +s.slice(1), notes = [];
  const post = f >= sc("S10").start + 8;                  // S10 starts: reds fade over its first frames
  if (post && red > 60 && !(s === "S12")) notes.push(`red (${red} px) after the trust turn`);
  if (post && s === "S12" && red > 2500) notes.push(`too much red in S12 (${red} px; only the X)`);
  if (f < sc("S10").start - 2 && green > 60 && !(s === "S9")) notes.push(`green (${green} px) before the trust turn`);
  if (f < sc("S10").start - 2 && s === "S9" && green > 2500) notes.push(`too much green in S9 (${green} px; only the shield)`);
  if (notes.length && !dissolve(f)) bad++;
  if (notes.length || f % (step * 6) === 3) console.log(`${notes.length && !dissolve(f) ? "FLAG" : "ok  "} frame ${String(f).padStart(4)} ${s.padEnd(3)} red ${String(red).padStart(6)} green ${String(green).padStart(6)} ${notes.join("; ")}`);
}
console.log(bad ? `FAIL: ${bad} frames flagged` : `PASS: ${frames.length} frames sampled`);
process.exit(bad ? 1 : 0);

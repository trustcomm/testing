// usage: node scripts/stills.mjs <outDir> <full|bg|nocap> <frame> [frame ...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const [, , outDir, mode, ...frames] = process.argv;
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const inputProps = mode === "bg" ? { mode: "bg", audio: false } : mode === "nocap" ? { mode: "full", captions: false, audio: false } : { mode: "full", audio: false };
const composition = await selectComposition({ serveUrl, id: "Keynote", inputProps, browserExecutable });
await mkdir(outDir, { recursive: true });
const t0 = Date.now();
for (const f of frames.map(Number)) await renderStill({ composition, serveUrl, inputProps, frame: f, browserExecutable, output: path.join(outDir, `f${String(f).padStart(5, "0")}.png`), imageFormat: "png" });
console.log(`rendered ${frames.length} stills in ${((Date.now() - t0) / 1000).toFixed(1)} s (${composition.durationInFrames} frames in the composition)`);

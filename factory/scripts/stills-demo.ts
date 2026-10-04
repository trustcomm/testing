/**
 * Stage-3 demo stills: one still per scene type (from src/demo/fixtures.ts) + a contact sheet.
 * Usage: tsx scripts/stills-demo.ts [--frame-from-end 20]
 */
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DEMOS } from "../src/demo/fixtures";
import { Scene } from "../src/engine/manifest";
import { evenTimings } from "../src/engine/pace";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "out/stills/scenes");
mkdirSync(OUT, { recursive: true });
const fps = 30;
const lead = 0.5;
const tail = 0.55;
const browserExecutable = process.env.REMOTION_BROWSER || null;

const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public") });
const files: string[] = [];
let prevTheme: "paper" | "ink" = "paper";
for (const [i, d] of DEMOS.entries()) {
  const scene = Scene.parse(d.scene);
  const frames = Math.ceil((lead + d.seconds + tail) * fps - 1e-6);
  const words = evenTimings(scene.captions ?? scene.narration, lead, lead + d.seconds);
  const inputProps = { scene, words, durationInFrames: frames, prevTheme, channelName: "[CHANNEL NAME]", showCaptions: true };
  const composition = await selectComposition({ serveUrl, id: "Scene", inputProps, browserExecutable });
  // late in the voice span: everything revealed, a caption line still visible
  const frame = Math.round((lead + d.seconds - 0.4) * fps);
  const file = path.join(OUT, `${String(i + 1).padStart(2, "0")}-${scene.type}.png`);
  await renderStill({ composition, serveUrl, output: file, frame, inputProps, browserExecutable, imageFormat: "png" });
  files.push(file);
  prevTheme = scene.theme;
  console.log(`still ${path.basename(file)}  frame ${frame}/${frames}  (${d.name})`);
}
execFileSync("python3", [path.join(ROOT, "scripts/contact-sheet.py"), path.join(ROOT, "out/stills/contact.png"), ...files], { stdio: "inherit" });

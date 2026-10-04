/** Checks the saffron wipe-in + 0.2 s fades on s040 at chosen frames. */
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import video from "../films/byjus-demo/video.json";
import { Scene } from "../src/engine/manifest";
import { evenTimings } from "../src/engine/pace";

const ROOT = path.resolve(import.meta.dirname, "..");
const browserExecutable = process.env.REMOTION_BROWSER || null;
const scene = Scene.parse(video.scenes.find((s) => s.id === "s040"));
const frames = Math.ceil((0.5 + 2.6 + 0.55) * 30 - 1e-6);
const inputProps = { scene, words: evenTimings(scene.narration, 0.5, 3.1), durationInFrames: frames, prevTheme: "paper", channelName: "[CHANNEL NAME]", showCaptions: true };
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public") });
const composition = await selectComposition({ serveUrl, id: "Scene", inputProps, browserExecutable });
for (const f of [0, 7, 15, 22, 30, frames - 3, frames - 1]) {
  const output = path.join(ROOT, `out/stills/wipe/f${String(f).padStart(3, "0")}.png`);
  await renderStill({ composition, serveUrl, output, frame: f, inputProps, browserExecutable, imageFormat: "png" });
  console.log(`wipe still frame ${f}/${frames}`);
}

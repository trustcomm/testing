/** Devanagari shaping check: title + reasons with क्षेत्र / प्रतिष्ठा / स्टार्टअप, mid per-word reveal and settled. */
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import { Scene } from "../src/engine/manifest";
import { evenTimings } from "../src/engine/pace";

const ROOT = path.resolve(import.meta.dirname, "..");
const browserExecutable = process.env.REMOTION_BROWSER || null;
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public") });
const base = { theme: "paper", wipeIn: false, anchor: {}, sfx: [] };
const tests = [
  {
    name: "title",
    scene: { ...base, id: "s901", type: "title", narration: "Devanagari test: kshetra, pratishtha aur startup.", data: { kicker: "Devanagari test", title: "क्षेत्र प्रतिष्ठा स्टार्टअप", subtitle: "क्षेत्र · प्रतिष्ठा · स्टार्टअप" } },
    frames: { mid: 29, settled: 75 },
  },
  {
    name: "reasons",
    scene: { ...base, id: "s902", type: "reasons", narration: "Devanagari test: kshetra, phir pratishtha, aur aakhir mein startup.", data: { items: [{ title: "क्षेत्र", icon: "building" }, { title: "प्रतिष्ठा", icon: "people" }, { title: "स्टार्टअप", icon: "steepArrow" }] }, anchor: { items: ["kshetra,", "pratishtha,", "startup."] } },
    frames: { mid: 0, settled: 130 },
  },
];
for (const t of tests) {
  const scene = Scene.parse(t.scene);
  const words = evenTimings(scene.narration, 0.5, 4.5);
  const durationInFrames = Math.ceil((0.5 + 4 + 0.55) * 30 - 1e-6);
  const inputProps = { scene, words, durationInFrames, prevTheme: "paper", channelName: "[CHANNEL NAME]", showCaptions: true };
  const composition = await selectComposition({ serveUrl, id: "Scene", inputProps, browserExecutable });
  let mid = t.frames.mid;
  if (t.name === "reasons") {
    // 5 frames into the 2nd card's 15-frame entrance
    const idx = scene.narration.split(/\s+/).indexOf("pratishtha,");
    mid = Math.round(words[idx].start * 30) + 5;
  }
  for (const [label, frame] of [["mid", mid], ["settled", t.frames.settled]] as const) {
    const output = path.join(ROOT, `out/stills/devanagari/${t.name}-${label}.png`);
    await renderStill({ composition, serveUrl, output, frame, inputProps, browserExecutable, imageFormat: "png" });
    console.log(`devanagari ${t.name} ${label} frame ${frame}`);
  }
}

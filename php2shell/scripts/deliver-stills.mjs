// One 1080x1920 PNG still per scene (its hero frame) in out/stills/SNN.png, and a labelled contact sheet out/contact-sheet.png.
// usage: node scripts/deliver-stills.mjs     (needs public/timeline.json: npx tsx scripts/export_timeline.ts)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const t = JSON.parse(readFileSync("public/timeline.json", "utf8"));
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const inputProps = { mode: "full", audio: false };
const composition = await selectComposition({ serveUrl, id: "Php2Shell", inputProps, browserExecutable });
mkdirSync("out/stills", { recursive: true });
const files = [];
for (const s of t.scenes) {
  const out = `out/stills/S${s.id.slice(1).padStart(2, "0")}.png`;
  await renderStill({ composition, serveUrl, inputProps, frame: s.hero, browserExecutable, output: out, imageFormat: "png" });
  files.push({ id: s.id, out, frame: s.hero, name: s.name });
}
const TW = 360, TH = 640, COLS = 5, font = "/usr/share/fonts/opentype/inter/Inter-Bold.otf";
const args = ["-y", "-v", "error"];
files.forEach((f) => args.push("-i", f.out));
const fc = files.map((f, i) => `[${i}:v]scale=${TW}:${TH},drawtext=fontfile=${font}:text='${f.id}  f${f.frame}':x=10:y=${TH - 34}:fontsize=22:fontcolor=white:box=1:boxcolor=0x000000@0.7:boxborderw=6[s${i}]`).join(";");
const layout = files.map((_, i) => `${(i % COLS) * TW}_${Math.floor(i / COLS) * TH}`).join("|");
execFileSync("ffmpeg", [...args, "-filter_complex", `${fc};${files.map((_, i) => `[s${i}]`).join("")}xstack=inputs=${files.length}:layout=${layout}:fill=black`, "-frames:v", "1", "out/contact-sheet.png"]);
console.log(`${files.length} stills in out/stills/, contact sheet out/contact-sheet.png`);

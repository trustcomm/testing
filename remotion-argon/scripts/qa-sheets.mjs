// usage: node scripts/qa-sheets.mjs [video=out/argon.mp4] [outDir=qa]   (needs build/anchors.json from scripts/anchors.ts)
// Pulls the anchor frames out of the FINISHED video and tiles them, eight to a sheet, each labelled scene / word / frame.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
const [, , video = "out/argon.mp4", out = "qa"] = process.argv;
const anchors = JSON.parse(readFileSync("build/anchors.json", "utf8"));
const tmp = "build/qa-frames"; rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true }); mkdirSync(out, { recursive: true });
const font = "/usr/share/fonts/opentype/inter/Inter-Bold.otf", TW = 420, TH = Math.round((TW * 1920) / 1080), COLS = 4, PER = 8;
const ff = (args) => execFileSync("ffmpeg", ["-y", "-v", "error", ...args]);
anchors.forEach((a, i) => ff(["-ss", String(a.frame / 30), "-i", video, "-frames:v", "1", "-vf", `scale=${TW}:-1,drawtext=fontfile=${font}:text='${a.scene}  ${a.label.replace(/'/g, "")}  f${a.frame}':x=10:y=10:fontsize=20:fontcolor=white:box=1:boxcolor=0x0071E3@0.92:boxborderw=6`, `${tmp}/${String(i).padStart(3, "0")}.png`]));
for (let s = 0; s * PER < anchors.length; s++) {
  const idx = anchors.slice(s * PER, s * PER + PER).map((_, k) => s * PER + k), n = idx.length;
  const inputs = idx.flatMap((i) => ["-i", `${tmp}/${String(i).padStart(3, "0")}.png`]);
  const layout = idx.map((_, k) => `${(k % COLS) * TW}_${Math.floor(k / COLS) * TH}`).join("|");
  const stack = idx.map((_, k) => `[${k}:v]`).join("") + `xstack=inputs=${n}:layout=${layout}`;
  ff([...inputs, "-filter_complex", stack, "-frames:v", "1", `${out}/sheet-${String(s + 1).padStart(2, "0")}.png`]);
}
console.log(`${anchors.length} anchors -> ${Math.ceil(anchors.length / PER)} sheets in ${out}/`);

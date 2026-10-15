// Four stills side by side, with the safe box drawn in red: motion hides mistakes that stills expose.
// usage: node stills.mjs [t1,t2,t3,t4]   ->   frames/stills.jpg
import { writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { start } from "./harness.mjs";
import { tokens as T } from "./tokens.js";

const times = (process.argv[2] || "0.4,1.2,2.5,4.8").split(",").map(Number);
if (times.length !== 4) throw new Error("give exactly four times");
const { open, close } = await start();
try {
  const v = await open(), files = [];
  for (const t of times) { files.push(`frames/still-${t}.png`); await writeFile(files.at(-1), await v.png(Math.round(t * v.fps))); }
  const box = `drawbox=x=${T.safe.x}:y=${T.safe.y}:w=${T.W - 2 * T.safe.x}:h=${T.H - 2 * T.safe.y}:color=red@0.7:t=3`;
  const tile = files.map((_, i) => `[${i}]${box},scale=960:-1[v${i}]`).join(";");
  execFileSync("ffmpeg", ["-v", "error", "-y", ...files.flatMap((f) => ["-i", f]), "-filter_complex", `${tile};[v0][v1][v2][v3]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0`, "-q:v", "3", "frames/stills.jpg"]);
  console.log("wrote frames/stills.jpg for t =", times.join(", "));
} finally { await close(); }

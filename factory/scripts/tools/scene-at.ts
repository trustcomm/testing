/** scene-at <slug> <mm:ss[.ms] | seconds> → scene id + offset inside the scene. */
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildDir, type Timeline } from "../lib";

const [slug, ts] = process.argv.slice(2);
if (!slug || !ts) throw new Error("usage: scene-at <slug> <mm:ss | seconds>");
const t = ts.includes(":") ? ts.split(":").reduce((a, p) => a * 60 + Number(p), 0) : Number(ts);
const tl: Timeline = JSON.parse(readFileSync(path.join(buildDir(slug), "timeline.json"), "utf8"));
const s = tl.scenes.find((x) => t >= x.start && t < x.start + x.dur);
if (!s) {
  console.log(`scene-at ${ts}: outside film (0–${tl.totalSec.toFixed(3)} s)`);
  process.exit(1);
}
const local = t - s.start;
const w = s.words.find((x) => local >= x.start && local < x.end);
console.log(`scene-at ${ts}: ${s.id} (${s.type}) · +${local.toFixed(3)} s · frame ${Math.round(local * tl.fps)}/${s.frames}${w ? ` · word "${w.text}"` : ""}`);

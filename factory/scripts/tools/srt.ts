/** srt <slug>: SRT from the timeline's word timings (same ≤7-word line breaking as the in-canvas captions). */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildDir, slugArg, type Timeline } from "../lib";

const slug = slugArg();
const tl: Timeline = JSON.parse(readFileSync(path.join(buildDir(slug), "timeline.json"), "utf8"));
const stamp = (t: number) => {
  const ms = Math.round(t * 1000);
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
};
const cues: { a: number; b: number; text: string }[] = [];
for (const s of tl.scenes) {
  let cur: typeof s.words = [];
  const flush = () => {
    if (cur.length) cues.push({ a: s.start + cur[0].start, b: s.start + cur[cur.length - 1].end, text: cur.map((w) => w.text).join(" ") });
    cur = [];
  };
  for (const w of s.words) {
    cur.push(w);
    if (cur.length >= 7 || /[.?!,—…]$/.test(w.text)) flush();
  }
  flush();
}
const srt = cues.map((c, i) => `${i + 1}\n${stamp(c.a)} --> ${stamp(c.b)}\n${c.text}\n`).join("\n");
writeFileSync(path.join(buildDir(slug), "captions.srt"), srt);
console.log(`srt ${slug}: ${cues.length} cues → build/captions.srt`);

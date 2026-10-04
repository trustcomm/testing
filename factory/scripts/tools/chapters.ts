/**
 * chapters <slug>: YouTube chapter list from scenes with `chapter`. Rules checked: first chapter
 * at 0:00, ≥ 3 chapters, each ≥ 10 s, ascending. Writes build/chapters.txt. Exit 1 if a rule fails.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildDir, loadVideo, slugArg, type Timeline } from "../lib";

const slug = slugArg();
const video = loadVideo(slug);
const tl: Timeline = JSON.parse(readFileSync(path.join(buildDir(slug), "timeline.json"), "utf8"));
const byId = Object.fromEntries(tl.scenes.map((s) => [s.id, s]));
const ch = video.scenes.filter((s) => s.chapter).map((s) => ({ t: byId[s.id].start, title: s.chapter! }));
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const problems: string[] = [];
if (!ch.length || ch[0].t !== 0) problems.push("first chapter must start at 0:00");
if (ch.length < 3) problems.push(`need ≥ 3 chapters (have ${ch.length})`);
ch.forEach((c, i) => {
  const end = i + 1 < ch.length ? ch[i + 1].t : tl.totalSec;
  if (end - c.t < 10) problems.push(`"${c.title}" is ${(end - c.t).toFixed(1)} s (< 10 s)`);
});
const text = ch.map((c) => `${fmt(c.t)} ${c.title}`).join("\n");
writeFileSync(path.join(buildDir(slug), "chapters.txt"), text + "\n");
console.log(text);
for (const p of problems) console.log(`ERROR ${p}`);
console.log(`chapters ${slug}: ${problems.length ? "FAIL" : "OK"} · ${ch.length} chapters → build/chapters.txt`);
process.exit(problems.length ? 1 : 0);

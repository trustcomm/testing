/**
 * validate <slug>: Zod-check video.json + editorial rules. Exit 1 on any error; warnings never fail.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { Video } from "../src/engine/manifest";
import { normWord, occurrences, parseAnchor } from "../src/engine/pace";
import { SCENES } from "../src/scenes";
import { filmDir, slugArg } from "./lib";

const slug = slugArg();
const raw = JSON.parse(readFileSync(path.join(filmDir(slug), "video.json"), "utf8"));
const errors: string[] = [];
const warns: string[] = [];

const parsed = Video.safeParse(raw);
if (!parsed.success) {
  for (const i of parsed.error.issues) errors.push(`schema: ${i.path.join(".")}: ${i.message}`);
  console.error(errors.map((e) => `ERROR ${e}`).join("\n"));
  console.log(`validate ${slug}: FAIL · ${errors.length} errors`);
  process.exit(1);
}
const video = parsed.data as any;
const WORDS = { verdict: [3, 12] as const, default: [6, 55] as const };

const seen = new Set<string>();
let prevNum = -1;
let words = 0;
video.scenes.forEach((s: any, i: number) => {
  const where = `${s.id} (${s.type})`;
  if (seen.has(s.id)) errors.push(`${where}: duplicate id`);
  seen.add(s.id);
  const n = Number(s.id.slice(1));
  if (n <= prevNum) errors.push(`${where}: ids must ascend`);
  prevNum = n;

  if (/[0-9०-९]/.test(s.narration)) errors.push(`${where}: narration contains digits (TTS reads them inconsistently; put figures in data)`);
  const toks = s.narration.split(/\s+/).filter(Boolean);
  words += toks.length;
  const [lo, hi] = s.type === "verdict" ? WORDS.verdict : WORDS.default;
  if (toks.length < lo || toks.length > hi) errors.push(`${where}: ${toks.length} words (allowed ${lo}–${hi})`);

  if (i >= 2 && video.scenes[i - 1].type === s.type && video.scenes[i - 2].type === s.type) errors.push(`${where}: 3 '${s.type}' scenes in a row`);

  if (s.type === "bars") {
    const vals = s.data.items.map((x: any) => x.value).filter((v: number) => v > 0);
    const ratio = Math.max(...vals) / Math.min(...vals);
    if (ratio > 40) errors.push(`${where}: bars max/min = ${ratio.toFixed(1)} > 40 (small bars become invisible)`);
  }
  if (s.type === "xray") {
    const total = s.data.segments.reduce((a: number, x: any) => a + x.value, 0);
    for (const seg of s.data.segments) {
      const share = seg.value / total;
      if (share < 0.08) warns.push(`${where}: segment "${seg.label}" is ${(share * 100).toFixed(1)}% (< 8%) — label goes outside the bar with a leader`);
    }
  }

  // anchors + sfx.onWord: must exist; a bare single word that occurs more than once is ambiguous
  const norm = (s.captions ?? s.narration).split(/\s+/).filter(Boolean).map(normWord);
  const checkWord = (label: string, a: string) => {
    const { words: target, occurrence } = parseAnchor(a);
    const hits = occurrences(norm, target);
    if (!hits.length) errors.push(`${where}: ${label} "${a}" not found in narration`);
    else if (occurrence !== null && !hits[occurrence - 1]) errors.push(`${where}: ${label} "${a}" — only ${hits.length} occurrence(s)`);
    else if (occurrence === null && target.length === 1 && hits.length > 1)
      errors.push(`${where}: ${label} "${a}" occurs ${hits.length}× — use a phrase or "${a}#n"`);
  };
  const allowed = SCENES[s.type as keyof typeof SCENES].anchorNames as readonly string[];
  for (const [name, val] of Object.entries(s.anchor ?? {})) {
    if (!allowed.includes(name)) errors.push(`${where}: anchor "${name}" not used by ${s.type} (allowed: ${allowed.join(", ") || "none"})`);
    const list = Array.isArray(val) ? val : [val];
    list.forEach((a: string) => checkWord(`anchor.${name}`, a));
    const parts = s.data.items ?? s.data.events ?? s.data.flows ?? s.data.segments;
    if (Array.isArray(val) && Array.isArray(parts) && val.length !== parts.length) errors.push(`${where}: anchor.${name} has ${val.length} words for ${parts.length} parts`);
  }
  for (const fx of s.sfx ?? []) if (fx.onWord) checkWord(`sfx ${fx.name}.onWord`, fx.onWord);
});

for (const w of warns) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
const minutes = words / 2.5 / 60;
console.log(
  `validate ${slug}: ${errors.length ? "FAIL" : "OK"} · ${video.scenes.length} scenes · ${words} words · est. ${minutes.toFixed(2)} min (${(minutes * 60).toFixed(0)} s @ 2.5 w/s) · ${warns.length} warnings · ${errors.length} errors`,
);
process.exit(errors.length ? 1 : 0);

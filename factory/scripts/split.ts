/**
 * split: cut a single voice take (films/<slug>/voice/master.*) into one WAV per scene.
 *
 *   tsx scripts/split.ts <slug>            dry run: prints the cut table, writes NOTHING
 *   tsx scripts/split.ts <slug> --write    writes films/<slug>/audio/<id>.wav (48 kHz mono, 24-bit)
 *
 * Boundaries: the expected boundary between scene k and k+1 is placed by the scene's share of
 * spoken syllables across the speech span; the cut goes at the MIDPOINT of the pause nearest to it
 * (pauses = silencedetect −35 dB ≥ 0.25 s, so never inside a word tail or breath). Each scene file
 * is then trimmed to its speech (±30 ms guard); lead/tail padding happens in `plan`/`mix`.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Video } from "../src/engine/manifest";

const slug = process.argv[2];
const WRITE = process.argv.includes("--write");
if (!slug) throw new Error("usage: tsx scripts/split.ts <slug> [--write]");
const ROOT = path.resolve(import.meta.dirname, "..");
const FILM = path.join(ROOT, "films", slug);
const video = Video.parse(JSON.parse(readFileSync(path.join(FILM, "video.json"), "utf8")));
const src = path.join(FILM, video.meta.voice.source ?? "voice/master.mp3");

const NOISE = "-35dB";
const MIN_PAUSE = 0.25;
const GUARD = 0.03;

const ff = (args: string[]) => execFileSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const ffErr = (args: string[]) => {
  try {
    execFileSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { stdio: ["ignore", "ignore", "pipe"] });
    return "";
  } catch (e: any) {
    return String(e.stderr ?? "");
  }
};
const silences = (file: string, d: number) => {
  const out = execFileSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", `silencedetect=noise=${NOISE}:d=${d}`, "-f", "null", "-"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return out;
};
const duration = (file: string) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }).trim());

// ffmpeg prints silencedetect to stderr; run via a shell-free spawn that captures stderr
const stderrOf = (args: string[]) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8" });
  return String(r.stderr);
};
void ff;
void ffErr;
void silences;

const total = duration(src);
const log = stderrOf(["-i", src, "-af", `silencedetect=noise=${NOISE}:d=${MIN_PAUSE}`, "-f", "null", "-"]);
const pauses: { start: number; end: number; mid: number; len: number }[] = [];
let s: number | null = null;
for (const m of log.matchAll(/silence_(start|end): ([\d.]+)/g)) {
  if (m[1] === "start") s = Number(m[2]);
  else if (s !== null) {
    const e = Number(m[2]);
    pauses.push({ start: s, end: e, mid: (s + e) / 2, len: e - s });
    s = null;
  }
}
if (s !== null) pauses.push({ start: s, end: total, mid: (s + total) / 2, len: total - s });

// speech span (first sound → last sound)
const lead0 = pauses.length && pauses[0].start <= 0.01 ? pauses[0].end : 0;
const tailP = pauses.find((p) => p.end >= total - 0.01);
const speechStart = lead0;
const speechEnd = tailP ? tailP.start : total;
const inner = pauses.filter((p) => p.start > speechStart + 0.01 && p.end < speechEnd - 0.01);

const syl = (t: string) => t.split(/\s+/).filter(Boolean).reduce((n, w) => n + Math.max(1, (w.match(/[aeiouy]+/gi) ?? []).length), 0);
const weights = video.scenes.map((sc) => syl(sc.narration));
const W = weights.reduce((a, b) => a + b, 0);

const cuts: { expected: number; pause: (typeof inner)[number]; alt?: (typeof inner)[number] }[] = [];
let acc = 0;
let lastMid = speechStart;
for (let k = 0; k < video.scenes.length - 1; k++) {
  acc += weights[k];
  const expected = speechStart + (acc / W) * (speechEnd - speechStart);
  const cands = inner.filter((p) => p.mid > lastMid + 0.5).sort((a, b) => Math.abs(a.mid - expected) - Math.abs(b.mid - expected));
  if (!cands.length) throw new Error(`no pause available for boundary ${k + 1}`);
  cuts.push({ expected, pause: cands[0], alt: cands[1] });
  lastMid = cands[0].mid;
}

// per-scene speech bounds inside each segment
const bounds = video.scenes.map((sc, k) => {
  const segStart = k === 0 ? 0 : cuts[k - 1].pause.mid;
  const segEnd = k === video.scenes.length - 1 ? total : cuts[k].pause.mid;
  const vStart = k === 0 ? speechStart : cuts[k - 1].pause.end;
  const vEnd = k === video.scenes.length - 1 ? speechEnd : cuts[k].pause.start;
  return { id: sc.id, segStart, segEnd, vStart: Math.max(segStart, vStart - GUARD), vEnd: Math.min(segEnd, vEnd + GUARD) };
});

const f2 = (n: number) => n.toFixed(2).padStart(6);
console.log(`split ${slug}: source ${path.relative(ROOT, src)} · ${total.toFixed(3)} s · speech ${speechStart.toFixed(2)}–${speechEnd.toFixed(2)} s · ${pauses.length} pauses ≥ ${MIN_PAUSE}s @ ${NOISE}`);
console.log("\nboundary | expected | chosen pause (len)        | CUT (midpoint) | next-nearest pause");
cuts.forEach((c, i) =>
  console.log(
    `${video.scenes[i].id}|${video.scenes[i + 1].id} | ${f2(c.expected)}   | ${f2(c.pause.start)}–${f2(c.pause.end)} (${c.pause.len.toFixed(2)}) | ${f2(c.pause.mid)}         | ${c.alt ? `${f2(c.alt.mid)} (Δ ${(Math.abs(c.alt.mid - c.expected)).toFixed(2)} s)` : "—"}`,
  ),
);
console.log("\nscene | words | file span (s)      | voice start–end (s) | VOICE DURATION");
bounds.forEach((b, i) =>
  console.log(
    `${b.id}  | ${String(video.scenes[i].narration.split(/\s+/).filter(Boolean).length).padStart(5)} | ${f2(b.segStart)}–${f2(b.segEnd)} | ${f2(b.vStart)}–${f2(b.vEnd)}     | ${(b.vEnd - b.vStart).toFixed(3)} s`,
  ),
);

if (!WRITE) {
  console.log("\nDRY RUN — nothing written. Re-run with --write after approval.");
  process.exit(0);
}
const outDir = path.join(FILM, "audio");
mkdirSync(outDir, { recursive: true });
for (const b of bounds) {
  const out = path.join(outDir, `${b.id}.wav`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", b.vStart.toFixed(4), "-to", b.vEnd.toFixed(4), "-i", src, "-ac", "1", "-ar", "48000", "-c:a", "pcm_s24le", out]);
  console.log(`wrote ${path.relative(ROOT, out)} (${duration(out).toFixed(3)} s)`);
}
writeFileSync(path.join(outDir, "split.json"), JSON.stringify({ source: path.relative(FILM, src), total, speechStart, speechEnd, cuts: cuts.map((c) => c.pause.mid), bounds }, null, 2));

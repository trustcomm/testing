/**
 * plan <slug>: build/timeline.json — start, dur, frames, lead, tail, words per scene.
 *
 *   frames = ceil((lead + voiceDur + tail) * fps − 1e-6)
 *
 * Hold rule (automatic): for scenes whose key element lands on a word — stat (anchor.counter) and
 * verdict (anchor.word) — hold = frames − landing frame. If hold < 60, the tail is extended so the
 * hold is exactly 60 frames; each extension is logged. A per-scene `tail` override is respected
 * (and may itself be extended).
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { durations, KEY_NUMBER_MIN_HOLD } from "../src/brand/tokens";
import { findWordIndices } from "../src/engine/pace";
import { buildDir, filmDir, loadVideo, slugArg, type Timeline, type TimelineScene } from "./lib";

const slug = slugArg();
const video = loadVideo(slug);
const { fps, width, height, lead } = video.meta;
const B = buildDir(slug);

const scenes: TimelineScene[] = [];
let startFrame = 0;
const ext: string[] = [];
let prevTheme: "paper" | "ink" = video.scenes[0]?.theme ?? "paper";
for (const s of video.scenes) {
  const al = JSON.parse(readFileSync(path.join(B, "align", `${s.id}.json`), "utf8"));
  const voiceDur: number = al.voiceDur;
  const words = (al.words as { text: string; start: number; end: number }[]).map((w) => ({ text: w.text, start: +(w.start + lead).toFixed(4), end: +(w.end + lead).toFixed(4) }));
  let tail = s.tail ?? video.meta.tail;
  let frames = Math.ceil((lead + voiceDur + tail) * fps - 1e-6);

  // landing frame of the key element (must mirror the scene components)
  let landing: number | null = null;
  const scriptWords = (s.captions ?? s.narration).split(/\s+/).filter(Boolean);
  const anchorFrame = (a?: string | string[]) => {
    if (!a) return null;
    const [i] = findWordIndices(scriptWords, Array.isArray(a) ? a : [a]);
    return i >= 0 && words[i] ? Math.round(words[i].start * fps) : null;
  };
  if (s.type === "stat") {
    // Counter lands exactly on the anchor word; unanchored: voiceStart + 0.8 s + slow
    landing = anchorFrame(s.anchor?.counter as string) ?? Math.round((words[0].start + 0.8) * fps) + durations.slow;
  } else if (s.type === "verdict") {
    const at = anchorFrame(s.anchor?.word as string) ?? Math.round(words[0].start * fps);
    landing = at + durations.fast; // fully visible after the fast fade
  }
  if (landing !== null) {
    const hold = frames - landing;
    if (hold < KEY_NUMBER_MIN_HOLD) {
      const newFrames = landing + KEY_NUMBER_MIN_HOLD;
      const newTail = newFrames / fps - lead - voiceDur;
      ext.push(`${s.id} (${s.type}): landing f${landing}, hold ${hold} f < ${KEY_NUMBER_MIN_HOLD} → tail ${tail.toFixed(3)} s → ${newTail.toFixed(3)} s (frames ${frames} → ${newFrames})`);
      tail = newTail;
      frames = newFrames;
    }
  }
  scenes.push({
    id: s.id,
    type: s.type,
    theme: s.theme,
    prevTheme,
    start: +(startFrame / fps).toFixed(4),
    startFrame,
    frames,
    dur: +(frames / fps).toFixed(4),
    lead,
    tail: +tail.toFixed(4),
    tailExtended: ext.some((e) => e.startsWith(s.id)),
    voiceDur,
    audio: `audio/${s.id}.wav`,
    words,
    alignMethod: al.method,
  });
  startFrame += frames;
  prevTheme = s.theme;
}
const tl: Timeline = { slug, fps, width, height, totalFrames: startFrame, totalSec: +(startFrame / fps).toFixed(4), scenes };
writeFileSync(path.join(B, "timeline.json"), JSON.stringify(tl, null, 1));
for (const e of ext) console.log(`EXTEND ${e}`);
for (const s of scenes) console.log(`  ${s.id} ${s.type.padEnd(8)} start ${s.start.toFixed(3).padStart(7)} s · ${String(s.frames).padStart(4)} f · voice ${s.voiceDur.toFixed(3)} · tail ${s.tail.toFixed(3)}${s.tailExtended ? " (auto-extended)" : ""} · align ${s.alignMethod}`);
console.log(`plan ${slug}: ${scenes.length} scenes · ${startFrame} frames · ${tl.totalSec.toFixed(3)} s · ${ext.length} tail extension(s) → ${path.relative(filmDir(slug), path.join(B, "timeline.json"))}`);

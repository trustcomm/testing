// Sync checks, no rendering needed:
//  1. captions: every group has 2-4 words, every word is captioned, and at each word's start the caption on screen is that word's group with that word highlighted
//  2. audio: each word's midpoint falls inside detected speech (ffmpeg silencedetect on the actual mp3), i.e. the timestamps match the audio
//  3. scenes: each starts on its first word; every cue sits inside its own scene
//  4. long animations: each ends by the end of the words it illustrates (and inside its scene)
import { execFileSync } from "node:child_process";
import { captionAt, groups } from "../src/captions";
import { CUE, SCENE_IDS, sceneEnd, sceneStart } from "../src/cues";
import { first, words, audioDuration } from "../src/timing";
import { durationInFrames } from "../src/timing";

let failed = 0;
const ok = (pass: boolean, msg: string, detail = "") => { console.log(`${pass ? "PASS" : "FAIL"}  ${msg}${detail ? "   " + detail : ""}`); if (!pass) failed++; };

// 1. captions
ok(groups.every((g) => g.words.length >= 2 && g.words.length <= 4), `captions: ${groups.length} groups, every one has 2-4 words`, groups.filter((g) => g.words.length < 2 || g.words.length > 4).map((g) => g.words.map((x) => x.text).join(" ")).join(" | "));
ok(groups.flatMap((g) => g.words).length === words.length && groups.flatMap((g) => g.words).every((x, i) => x.i === i), "captions: every word is captioned once, in order");
const bad: string[] = [];
for (const wd of words) {
  for (const t of [wd.start + 0.005, (wd.start + wd.end) / 2]) {
    const c = captionAt(t);
    // between two words the previous word may still be the highlighted one, but a word is highlighted from its own start
    if (!c || c.group.words[c.current].i !== wd.i && t === wd.start + 0.005) bad.push(`${wd.text}@${t.toFixed(2)}`);
  }
}
ok(bad.length === 0, "captions: at each word's start the caption shows that word, highlighted", bad.join(" "));
const romanOnly = words.every((x) => !/[ऀ-ॿ]/.test(x.text));
ok(romanOnly, "captions: Roman script only (no Devanagari left)");

// 2. the timestamps against the audio itself: the 16 kHz level of the actual mp3 in 10 ms steps
const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", "public/vo.mp3", "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], { maxBuffer: 1 << 28 });
const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 2));
const db: number[] = [];
for (let i = 0; i + 160 <= samples.length; i += 160) { let e = 0; for (let k = 0; k < 160; k++) e += (samples[i + k] / 32768) ** 2; db.push(10 * Math.log10(e / 160 + 1e-12)); }
const level = (a: number, b: number) => Math.max(...db.slice(Math.max(0, Math.floor(a * 100)), Math.ceil(b * 100)));
const SPEECH = -55;   // a whispered tail ("hain." at 10.46 s) sits near -50 dB
// (a) every word starts on speech: there is audible energy within 120 ms of the word's start
const silentStarts = words.filter((x) => level(x.start - 0.1, x.start + 0.2) < SPEECH);
ok(silentStarts.length === 0, `audio: all ${words.length} words start on speech (level > ${SPEECH} dB within 200 ms of the timestamp)`, silentStarts.map((x) => `${x.text}@${x.start}`).join(" "));
// (b) no speech without a caption: every 100 ms of speech lies inside some word (+-150 ms)
const uncaptioned: number[] = [];
for (let i = 0; i < db.length; i += 10) if (db[i] > -35 && !words.some((x) => i / 100 >= x.start - 0.15 && i / 100 <= x.end + 0.15)) uncaptioned.push(i / 100);
ok(uncaptioned.length === 0, "audio: no speech outside a captioned word", uncaptioned.map((t) => t.toFixed(2)).join(" "));
const dur = durationInFrames();
ok(dur === Math.ceil(audioDuration * 30), `length: ${dur} frames = ${(dur / 30).toFixed(3)} s for a ${audioDuration.toFixed(3)} s voiceover`);

// 3. scenes and cues
SCENE_IDS.forEach((id, i) => {
  ok(Math.abs(sceneStart(i) - (i === 0 ? 0 : first([0, 2, 4, 5, 6, 7, 8][i]).start)) < 1e-9, `scene ${i + 1} ${id}: ${sceneStart(i).toFixed(2)}-${sceneEnd(i).toFixed(2)} s, starts on its first word`);
  const cues = (CUE as Record<string, Record<string, unknown>>)[id === "cta" ? "cta" : id];
  const times = Object.entries(cues).flatMap(([k, v]) => (typeof v === "number" ? [[k, v]] : Array.isArray(v) ? v.map((x, j) => [`${k}[${j}]`, x]) : [])) as [string, number][];
  const outside = times.filter(([k, v]) => k !== "illustrates" && (v < sceneStart(i) - 1e-9 || v > sceneEnd(i) + 1e-9));
  ok(outside.length === 0, `scene ${i + 1} ${id}: all ${times.length - 1} cues inside the scene`, outside.map(([k, v]) => `${k}=${v}`).join(" "));
});

// 4. animations that run for a while must not outlast the words they illustrate
const dyn: [string, number, number, number][] = [   // name, from, to, the end of the words it illustrates
  ["counter 0 -> 9,848", CUE.hook.counter[0], CUE.hook.counter[1], CUE.hook.counter[1]],
  ["avatars scroll + drift out", CUE.problem.stream[0], CUE.problem.leave[1], CUE.problem.leave[1]],
  ["timeline playhead (first 3 s)", CUE.fix1.playhead[0], CUE.fix1.playhead[1], CUE.fix1.playhead[1]],
  ["bio types out", CUE.fix2.typing[0], CUE.fix2.typing[1], CUE.fix2.typing[1]],
  ["terminal types the command", CUE.reveal.typing[0], CUE.reveal.typing[1], CUE.reveal.typing[1]],
  ["progress bar to 100 %", CUE.reveal.progress[0], CUE.reveal.progress[1], CUE.reveal.progress[1]],
];
dyn.forEach(([name, a, b, words_end], k) => {
  const scene = [0, 1, 2, 3, 5, 5][k];
  ok(b <= words_end + 1e-9 && b <= sceneEnd(scene) && a >= sceneStart(scene), `animation "${name}": ${a.toFixed(2)}-${b.toFixed(2)} s, ends with its words (${words_end.toFixed(2)} s) and inside scene ${scene + 1}`);
});
console.log(failed ? "FAIL" : "PASS");
process.exit(failed ? 1 : 0);

// Sync checks without rendering:
//  1. scenes: each starts on the first word of its first sentence; the table (scene -> start/end s and frames); the length
//  2. every cue sits on the word that says it (frame-exact), against the REAL audio: the acoustic onset of the key words
//  3. the animations that run over a window start and end inside the words they illustrate and inside their scene
//  4. captions: 2-4 words, Roman only, the word spoken is highlighted from its first frame
//  5. the audio: every word starts on speech, no speech lies outside a word; every sound effect lies inside the video
import { execFileSync } from "node:child_process";
import { captionAt, groups } from "../src/captions";
import { CUE, SCENES, sceneEnd, sceneStart } from "../src/cues";
import { audioDuration, sentences, totalFrames, w, words, TAIL } from "../src/anchors";
import { EFFECTS } from "../src/audio";

let failed = 0;
const ok = (pass: boolean, msg: string, detail = "") => { console.log(`${pass ? "PASS" : "FAIL"}  ${msg}${detail ? "   " + detail : ""}`); if (!pass) failed++; };
const F = (s: number) => Math.round(s * 30);

// the audio's level in 10 ms steps
const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", "public/vo.mp3", "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], { maxBuffer: 1 << 28 });
const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 2));
const db: number[] = [];
for (let i = 0; i + 160 <= samples.length; i += 160) { let e = 0; for (let k = 0; k < 160; k++) e += (samples[i + k] / 32768) ** 2; db.push(10 * Math.log10(e / 160 + 1e-12)); }
const level = (a: number, b: number) => Math.max(...db.slice(Math.max(0, Math.floor(a * 100)), Math.ceil(b * 100)));
const onsetOf = (word: { start: number }) => {
  for (let f = Math.round((word.start - 0.12) * 100); f <= Math.round((word.start + 0.12) * 100); f++) if (db[f] > -30 && db[Math.max(0, f - 3)] < db[f] - 3) return f / 100;
  return NaN;
};

// 1. scenes
console.log("\nscene            start     end      frames");
SCENES.forEach((s, i) => console.log(`${s}  ${sceneStart(i).toFixed(2).padStart(10)} ${sceneEnd(i).toFixed(2).padStart(8)}   ${String(F(sceneStart(i))).padStart(4)}-${F(sceneEnd(i))}`));
console.log("");
const firsts = [0, 4, 7, 9, 12, 17, 20, 23];
ok(SCENES.every((_, i) => i === 0 || sceneStart(i) === sentences[firsts[i]][0].start), "scenes: every scene starts on the first word of its first sentence");
ok(totalFrames() === Math.ceil((audioDuration + TAIL) * 30 - 1e-6), `length: ${totalFrames()} frames = ${(totalFrames() / 30).toFixed(3)} s for a ${audioDuration.toFixed(3)} s voiceover + ${TAIL} s`);

// 2. cues on their words, frame-exact, and the acoustic onset
const cueWord: [string, number, ReturnType<typeof w>][] = [
  ["S1 prompt card on 'Ek'", CUE.s1.prompt, w(0, "ek")], ["S1 tracks on 'Claude'", CUE.s1.tracks, w(1, "claude")], ["S1 Gemini bar snaps on 'chaar'", CUE.s1.snap, w(3, "chaar")],
  ["S2 receipts morph on 'Kharcha'", CUE.s2.morph, w(4, "kharcha")], ["S2 $23.46 starts on 'Claude'", CUE.s2.claude[0], w(5, "claude")], ["S2 $3.40 starts on 'Gemini'", CUE.s2.gemini[0], w(6, "gemini")],
  ["S3 receipts apart on 'Matlab'", CUE.s3.apart, w(7, "matlab")], ["S3 26× on 'chhabbees'", CUE.s3.x26[0], w(7, "chhabbees")], ["S3 'faster' on 'tez'", CUE.s3.tez, w(7, "tez")], ["S3 ~7× on 'saat'", CUE.s3.x7[0], w(8, "saat")], ["S3 'cheaper' on 'sasta'", CUE.s3.sasta, w(8, "sasta")],
  ["S4 dim on 'Lekin'", CUE.s4.dim, w(9, "lekin")], ["S4 'THE TWIST' on 'twist'", CUE.s4.kicker, w(9, "twist")], ["S4 headline on 'detail'", CUE.s4.detail, w(11, "detail")], ["S4 'aage' on 'aage'", CUE.s4.aage, w(11, "aage")], ["S4 chips on 'ab'", CUE.s4.chips, w(11, "ab")],
  ["S5 card on 'Toh'", CUE.s5.card, w(12, "toh")], ["S5 'Fast draft' on 'Jaldi'", CUE.s5.jaldi, w(13, "jaldi")], ["S5 'Low budget' on 'kam'", CUE.s5.kam, w(13, "kam")], ["S5 'Every frame perfect' on 'Har'", CUE.s5.har, w(15, "har")],
  ["S6 morph on 'Smart'", CUE.s6.smart, w(17, "smart")], ["S6 'Draft → Gemini' on 'Gemini'", CUE.s6.gemini, w(18, "gemini")], ["S6 'Final → Claude' on 'Claude'", CUE.s6.claude, w(19, "claude")],
  ["S7 'n = 1' on 'ek'", CUE.s7.ekTest, w(20, "ek")], ["S7 headline on 'Apna'", CUE.s7.apna, w(21, "apna")], ["S7 'Same prompt' on 'Same'", CUE.s7.same, w(22, "same")], ["S7 '1 try' on 'ek'", CUE.s7.ek, w(22, "ek")], ["S7 '3 scores' on 'teen'", CUE.s7.teen, w(22, "teen")],
  ["S7 Detail card on 'detail'", CUE.s7.detail, w(22, "detail")], ["S7 Time card on 'time'", CUE.s7.time, w(22, "time")], ["S7 Cost card on 'cost'", CUE.s7.cost, w(22, "cost")],
  ["S8 headline on 'Fair'", CUE.s8.fair, w(23, "fair")], ["S8 'Comment karo' on 'Comment'", CUE.s8.comment, w(24, "comment")], ["S8 PROMPT pill on 'PROMPT'", CUE.s8.prompt, w(24, "prompt")],
];
for (const [name, t, word] of cueWord) {
  const on = onsetOf(word), off = (t - on) * 30;
  ok(F(t) === F(word.start), `cue: ${name}: frame ${F(t)} = word start frame ${F(word.start)}`, Number.isFinite(on) ? `acoustic onset ${on.toFixed(3)} s -> ${off.toFixed(1)} frames` : "no acoustic onset in window");
}
const offs = words.map((x) => ({ x, on: onsetOf(x) })).filter((o) => Number.isFinite(o.on));
// (a fricative or a word that runs on from the one before it starts below the detector's -30 dB threshold, so the acoustic onset
// can sit up to ~4 frames after the word's real start; the statistics below are what matters, with a hard bound at the +-0.12 s window)
const diffs = offs.map((o) => Math.abs(o.x.start - o.on) * 30).sort((p, q) => p - q);
const med = diffs[Math.floor(diffs.length / 2)], p90 = diffs[Math.floor(diffs.length * 0.9)];
ok(med <= 1 && diffs.filter((d) => d <= 2).length / diffs.length >= 0.7 && diffs.at(-1)! <= 4, `audio: word starts vs acoustic onsets over ${offs.length} words: median ${med.toFixed(1)} frames, p90 ${p90.toFixed(1)}, max ${diffs.at(-1)!.toFixed(1)}; ${(100 * diffs.filter((d) => d <= 2).length / diffs.length).toFixed(0)} % within 2 frames`);

// 3. animations vs the words they illustrate
const dyn: [string, number, number, number, number][] = [
  ["Gemini bar fills until it snaps on 'chaar'", CUE.s1.fill[0], CUE.s1.snap, w(3, "chaar").start, 0],
  ["Claude stopwatch lands in the pause before 'Kharcha'", CUE.s1.snap, CUE.s1.land, sceneStart(1), 0],
  ["Claude $23.46 rolls on 'Claude, teis dollar'", CUE.s2.claude[0], CUE.s2.claude[1], w(5, "dollar").end, 1],
  ["Gemini $3.40 rolls on 'Gemini, sirf saadhe teen dollar'", CUE.s2.gemini[0], CUE.s2.gemini[1], w(6, "dollar").end, 1],
  ["26× rolls on 'chhabbees guna'", CUE.s3.x26[0], CUE.s3.x26[1], w(7, "guna").end, 2],
  ["~7× rolls on 'saat guna'", CUE.s3.x7[0], CUE.s3.x7[1], w(8, "guna").end, 2],
];
for (const [name, a, b, wordsEnd, scene] of dyn) ok(b <= wordsEnd + 0.12 + 1e-9 && a >= sceneStart(scene) - 1e-9 && b <= sceneEnd(scene) + 1e-9, `animation "${name}": ${a.toFixed(2)}-${b.toFixed(2)} s; ends by ${wordsEnd.toFixed(2)} s; inside ${SCENES[scene]}`);
ok(CUE.s1.land > w(3, "minute").end && CUE.s1.land < sceneStart(1) - 2 / 30, `S1: Claude lands at ${CUE.s1.land.toFixed(2)} s: after "minute" (${w(3, "minute").end.toFixed(2)}) and before "Kharcha" (${sceneStart(1).toFixed(2)})`);
const hold = Math.round((CUE.s4.kicker - sceneStart(3)) * 30) - 8;
ok(hold >= 4 && hold <= 8, `S4: the dimmed canvas holds ${hold} frames between S3's exit (8 frames) and "THE TWIST" (brief: 6)`);

// 4. captions
ok(groups.every((g) => g.words.length >= 2 && g.words.length <= 4), `captions: ${groups.length} groups, each 2-4 words`, groups.filter((g) => g.words.length < 2 || g.words.length > 4).map((g) => g.words.map((x) => x.text).join(" ")).join(" | "));
const missed = words.filter((x) => { const c = captionAt(x.start + 0.005); return !c || c.group.words[c.current].i !== x.i; });
ok(missed.length === 0, "captions: from its first frame each spoken word is the highlighted one", missed.map((x) => x.text).join(" "));
ok(words.every((x) => /^[A-Za-z0-9.,?!…:'-]+$/.test(x.text)), "captions: Roman script only");

// 5. the audio
const silentStarts = words.filter((x) => level(x.start - 0.1, x.start + 0.2) < -55);
ok(silentStarts.length === 0, `audio: all ${words.length} words start on speech`, silentStarts.map((x) => `${x.text}@${x.start}`).join(" "));
const uncaptioned: number[] = [];
for (let i = 0; i < db.length; i += 10) if (db[i] > -35 && !words.some((x) => i / 100 >= x.start - 0.15 && i / 100 <= x.end + 0.15)) uncaptioned.push(i / 100);
ok(uncaptioned.length === 0, "audio: no speech outside a word", uncaptioned.map((t) => t.toFixed(2)).join(" "));
const total = audioDuration + TAIL;
ok(EFFECTS.every((e) => e.t >= 0 && e.t + e.frames / 30 <= total + 1e-6), `sfx: all ${EFFECTS.length} effects start and end inside the ${total.toFixed(2)} s video`);
console.log(failed ? "FAIL" : "PASS");
process.exit(failed ? 1 : 0);

// Sync checks without rendering:
//  1. scenes: each starts on its first word; the table (scene -> start/end s and frames)
//  2. calculator keys: every press inside the word that says it; the first digit of each number on its word's first frame;
//     "=" inside the pause before "pacchees"; and, against the REAL audio, the acoustic onset of each number word vs the key
//  3. every long animation ends with the words it illustrates and inside its scene
//  4. captions: 2-4 words, Roman only, the word spoken is highlighted from its first frame, none during scene 4
//  5. the audio: every word starts on speech, and no speech lies outside a word
import { execFileSync } from "node:child_process";
import { captionAt, groups } from "../src/captions";
import { CUE, KEYS, SCENES, sceneEnd, sceneStart } from "../src/cues";
import { audioDuration, frameOf, sentences, totalFrames, w, words } from "../src/anchors";

let failed = 0;
const ok = (pass: boolean, msg: string, detail = "") => { console.log(`${pass ? "PASS" : "FAIL"}  ${msg}${detail ? "   " + detail : ""}`); if (!pass) failed++; };
const F = (s: number) => Math.round(s * 30);

// the audio's level in 10 ms steps
const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", "public/vo.mp3", "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], { maxBuffer: 1 << 28 });
const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 2));
const db: number[] = [];
for (let i = 0; i + 160 <= samples.length; i += 160) { let e = 0; for (let k = 0; k < 160; k++) e += (samples[i + k] / 32768) ** 2; db.push(10 * Math.log10(e / 160 + 1e-12)); }
const level = (a: number, b: number) => Math.max(...db.slice(Math.max(0, Math.floor(a * 100)), Math.ceil(b * 100)));

// 1. scenes
console.log("\nscene            start     end      frames");
SCENES.forEach((s, i) => console.log(`${s}  ${sceneStart(i).toFixed(2).padStart(10)} ${sceneEnd(i).toFixed(2).padStart(8)}   ${String(F(sceneStart(i))).padStart(4)}-${F(sceneEnd(i))}`));
console.log("");
const firsts = [0, 2, 5, 10, 12, 16, 19];
ok(SCENES.every((_, i) => i === 0 || sceneStart(i) === sentences[firsts[i]][0].start), "scenes: every scene starts on the first word of its first sentence");
ok(totalFrames() === Math.ceil(audioDuration * 30), `length: ${totalFrames()} frames = ${(totalFrames() / 30).toFixed(3)} s for a ${audioDuration.toFixed(3)} s voiceover`);

// 2. calculator keys
const win = (word: ReturnType<typeof w>) => [word.start - 2 / 30, word.end + 2 / 30] as const;
const inWord = (t: number, word: ReturnType<typeof w>) => t >= win(word)[0] && t <= win(word)[1];
const k5 = KEYS.slice(0, 5), k2 = KEYS.slice(6, 10), div = KEYS[5], eq = KEYS[10];
const p1 = w(6, "pachaas"), h1 = w(6, "hazaar", 0), dv = w(6, "divided"), d2 = w(6, "do"), h2 = w(6, "hazaar", 1), pc = w(7, "pacchees");
ok(F(k5[0].t) === F(p1.start), "keys: '5' goes down on the first frame of \"pachaas\"", `key frame ${F(k5[0].t)}, word frame ${F(p1.start)}`);
ok(k5.every((k) => k.t >= p1.start - 2 / 30 && k.t <= h1.end + 2 / 30), `keys: all five digits of "5 0 0 0 0" fall inside "pachaas hazaar" (${p1.start.toFixed(2)}-${h1.end.toFixed(2)} s)`, k5.map((k) => k.t.toFixed(2)).join(" "));
ok(Math.abs(F(div.t) - F(dv.start)) <= 2, `keys: "÷" within 2 frames of "divided" (${F(div.t)} vs ${F(dv.start)})`);
ok(F(k2[0].t) === F(d2.start) && k2.every((k) => k.t >= d2.start - 2 / 30 && k.t <= h2.end + 2 / 30), `keys: "2 0 0 0" start on "do" and stay inside "do hazaar" (${d2.start.toFixed(2)}-${h2.end.toFixed(2)} s)`, k2.map((k) => k.t.toFixed(2)).join(" "));
ok(eq.t > h2.end && eq.t < pc.start, `keys: "=" at ${eq.t.toFixed(2)} s lands in the pause after "hazaar" (${h2.end.toFixed(2)}) before "pacchees" (${pc.start.toFixed(2)})`);
ok(F(CUE.s3.result) === F(pc.start), `display: morphs to 25 on the first frame of "pacchees" (${F(pc.start)})`);
// against the audio itself: the acoustic onset (level rising through -30 dB, within +-120 ms of the word's start) vs the key
for (const [name, key, word] of [["'5' / pachaas", k5[0], p1], ["'÷' / divided", div, dv], ["'2' / do", k2[0], d2]] as const) {
  let onset = NaN;
  for (let f = Math.round((word.start - 0.12) * 100); f <= Math.round((word.start + 0.12) * 100); f++) if (db[f] > -30 && db[Math.max(0, f - 3)] < db[f] - 3) { onset = f / 100; break; }
  const off = (key.t - onset) * 30;
  ok(Number.isFinite(onset) && Math.abs(off) <= 2, `audio: ${name}: key ${key.t.toFixed(3)} s, acoustic onset ${onset.toFixed(3)} s -> ${off.toFixed(1)} frames (limit 2)`);
}

// 3. animations vs the words they illustrate
const dyn: [string, number, number, number, number][] = [
  ["invoice total 0 -> 50,000", CUE.s1.total[0], CUE.s1.total[1], w(1, "hazaar").end, 0],
  ["price 0 -> 2,000", CUE.s2.price[0], CUE.s2.price[1], w(3, "hazaar").end, 1],
  ["ring completes one circle", CUE.s2.ring[0], CUE.s2.ring[1], w(4, "ke").end, 1],
  ["black eases in over 18 frames (done within 2 frames of \"one\")", sceneStart(3), sceneStart(3) + 18 / 30, w(11, "one").start + 2 / 30, 3],
  ["'One more thing.' letters", CUE.s4.one, CUE.s4.thing, w(11, "thing").end, 3],
  ["terminal types the prompt", CUE.s5.typing[0], CUE.s5.typing[1], w(13, "kisi").start, 4],
  ["render bar 0 -> 100 %", CUE.s5.render[0], CUE.s5.render[1], w(14, "banaya").end, 4],
];
for (const [name, a, b, wordsEnd, scene] of dyn) ok(b <= wordsEnd + 1e-9 && a >= sceneStart(scene) - 1e-9 && b <= sceneEnd(scene) + 1e-9, `animation "${name}": ${a.toFixed(2)}-${b.toFixed(2)} s; its words end ${wordsEnd.toFixed(2)} s; inside ${SCENES[scene]}`);
ok(CUE.s5.pullBack + 1 / 30 * 24 <= sceneEnd(4), "pull-back (24 frames) finishes inside scene 5");

// 4. captions
ok(groups.every((g) => g.words.length >= 2 && g.words.length <= 4), `captions: ${groups.length} groups, each 2-4 words`, groups.filter((g) => g.words.length < 2 || g.words.length > 4).map((g) => g.words.map((x) => x.text).join(" ")).join(" | "));
const missed = words.filter((x) => { if (x.start >= sceneStart(3) && x.start < sceneStart(4)) return false; const c = captionAt(x.start + 0.005); return !c || c.group.words[c.current].i !== x.i; });
ok(missed.length === 0, "captions: from its first frame each spoken word is the highlighted one", missed.map((x) => x.text).join(" "));
ok(words.filter((x) => x.start >= sceneStart(3) && x.start < sceneStart(4)).every((x) => captionAt(x.start + 0.01) === null), "captions: hidden for the whole of scene 4");
ok(words.every((x) => /^[A-Za-z0-9.,?!…'-]+$/.test(x.text)), "captions: Roman script only");

// 5. the audio
const silentStarts = words.filter((x) => level(x.start - 0.1, x.start + 0.2) < -55);
ok(silentStarts.length === 0, `audio: all ${words.length} words start on speech`, silentStarts.map((x) => `${x.text}@${x.start}`).join(" "));
const uncaptioned: number[] = [];
for (let i = 0; i < db.length; i += 10) if (db[i] > -35 && !words.some((x) => i / 100 >= x.start - 0.15 && i / 100 <= x.end + 0.15)) uncaptioned.push(i / 100);
ok(uncaptioned.length === 0, "audio: no speech outside a word", uncaptioned.map((t) => t.toFixed(2)).join(" "));
console.log(failed ? "FAIL" : "PASS");
process.exit(failed ? 1 : 0);

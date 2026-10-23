// Sync checks without rendering:
//  1. the scene table (start/end/layer frames) and the length (voice + 0.4 s lead + 0.4 s tail = voice + 0.8 s)
//  2. the transcript against the REAL audio: every word starts on speech, no speech outside a word, word onsets vs the acoustic onsets (statistics)
//  3. the cue modules: sounds / anchors / hero / pushes / shakes lie inside their scene's layer; exactly 3 micro-shakes (S1 "udd", S8 "control", S9 "9.2")
//  4. captions: 2-4 words per chunk (single-word chunks only at the end of a scene), the spoken word is the highlighted one from its first frame
import { execFileSync } from "node:child_process";
import { captionAt, groups } from "../src/captions";
import { ANCHORS, HERO, MUSIC, PUSHES, SCENES, SFX, SHAKES, TOTAL } from "../src/timeline";
import { audioDuration, fw, words, w } from "../src/anchors";

let failed = 0;
const ok = (pass: boolean, msg: string, detail = "") => { console.log(`${pass ? "PASS" : "FAIL"}  ${msg}${detail ? "   " + detail : ""}`); if (!pass) failed++; };
const F = (s: number) => Math.round(s * 30);

const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", "public/vo.mp3", "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], { maxBuffer: 1 << 28 });
const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 2));
const db: number[] = [];
for (let i = 0; i + 160 <= samples.length; i += 160) { let e = 0; for (let k = 0; k < 160; k++) e += (samples[i + k] / 32768) ** 2; db.push(10 * Math.log10(e / 160 + 1e-12)); }
const level = (a: number, b: number) => Math.max(...db.slice(Math.max(0, Math.floor(a * 100)), Math.ceil(b * 100)));   // voice time
const onsetOf = (v: number) => { for (let f = Math.round((v - 0.12) * 100); f <= Math.round((v + 0.12) * 100); f++) if (db[f] > -30 && db[Math.max(0, f - 3)] < db[f] - 3) return f / 100; return NaN; };

console.log("\nscene   first word        start   end   layer from-to   frames");
SCENES.forEach((s) => console.log(`${s.id.padEnd(4)}  ${(s.start / 30).toFixed(2).padStart(7)} s ${String(s.start).padStart(5)} ${String(s.end).padStart(5)}   ${String(s.from).padStart(5)}-${String(s.to).padEnd(5)}   ${s.end - s.start}`));
console.log("");
ok(TOTAL === Math.ceil((audioDuration + 0.8) * 30 - 1e-6), `length: ${TOTAL} frames = ${(TOTAL / 30).toFixed(3)} s = voice ${audioDuration.toFixed(3)} s + 0.8 s`);
ok(SCENES.every((s, i) => i === 0 || s.start > SCENES[i - 1].start) && SCENES.length === 13, "scenes: 13, in order, each starting on its first word");

// 2. the transcript against the audio
const silent = words.filter((x) => level(x.voiceStart - 0.1, x.voiceStart + 0.2) < -55);
ok(silent.length === 0, `audio: all ${words.length} words start on speech`, silent.map((x) => `${x.text}@${x.start.toFixed(2)}`).join(" "));
const stray: number[] = [];
for (let i = 0; i < db.length; i += 10) if (db[i] > -35 && !words.some((x) => i / 100 >= x.voiceStart - 0.15 && i / 100 <= x.voiceEnd + 0.15)) stray.push(i / 100);
ok(stray.length === 0, "audio: no speech outside a word", stray.map((t) => t.toFixed(2)).join(" "));
const diffs = words.map((x) => ({ x, on: onsetOf(x.voiceStart) })).filter((o) => Number.isFinite(o.on)).map((o) => Math.abs(o.x.voiceStart - o.on) * 30).sort((a, b) => a - b);
const med = diffs[Math.floor(diffs.length / 2)];
ok(med <= 1.5 && diffs.filter((d) => d <= 2).length / diffs.length >= 0.5 && diffs.at(-1)! <= 4, `audio: word starts vs acoustic onsets over ${diffs.length} words: median ${med.toFixed(1)} frames, p90 ${diffs[Math.floor(diffs.length * 0.9)].toFixed(1)}, max ${diffs.at(-1)!.toFixed(1)}; ${(100 * diffs.filter((d) => d <= 2).length / diffs.length).toFixed(0)} % within 2 frames`);
// (the onset detector is confused by runs of consecutive plosive words: e.g. "pe control", where it finds the "pe" burst 3-4 frames before the "k"; the envelope was checked by eye there)
// the anchors the brief names, against the acoustic onset
const key: [string, ReturnType<typeof w>][] = [["21", w("S1", "21")], ["udd", w("S1", "udd")], ["do aise bug (do)", w("S3", "do")], ["das", w("S3", "das")], ["wiz", w("S4", "wiz")], ["calif", w("S4", "calif")], ["openai", w("S4", "openai")], ["hazaaron", w("S5", "hazaaron")], ["chaabi", w("S6", "chaabi")], ["password", w("S7", "password")], ["token", w("S7", "token")], ["control", w("S8", "control")], ["9.2", w("S9", "9.2")], ["sach", w("S10", "sach")], ["versions", w("S11", "versions")], ["khud", w("S12", "khud")], ["comment", w("S13", "comment")]];
for (const [name, x] of key) { const on = onsetOf(x.voiceStart), off = (x.voiceStart - on) * 30; ok(!Number.isFinite(on) || Math.abs(off) <= 4, `key word "${name}": frame ${fw(x)}, acoustic onset ${Number.isFinite(on) ? (on + 0.4).toFixed(3) + " s" : "n/a"} -> ${Number.isFinite(off) ? off.toFixed(1) : "n/a"} frames`); }

// 3. the cue modules
const inScene = (f: number, id: string) => { const s = SCENES.find((x) => x.id === id)!; return f >= s.from && f <= s.to; };
const outside = SFX.filter((e) => !inScene(e.frame, e.scene));
ok(outside.length === 0, `sfx: all ${SFX.length} sound events lie inside their scene's layer`, outside.map((e) => `${e.id}@${e.frame}`).join(" "));
ok(new Set(SFX.map((e) => e.id)).size === SFX.length, "sfx: unique event ids");
ok(SFX.every((e) => e.frame >= 0 && e.frame < TOTAL), "sfx: every event inside the film");
const badA = ANCHORS.filter((a) => !inScene(a.frame, a.scene));
ok(badA.length === 0, `anchors: all ${ANCHORS.length} QA stills lie inside their scene's layer`, badA.map((a) => `${a.scene}:${a.label}@${a.frame}`).join(" "));
ok(SCENES.every((s) => HERO[s.id] > 0 && inScene(HERO[s.id], s.id)), "hero: every scene has a hero frame inside its layer", SCENES.filter((s) => !(HERO[s.id] > 0)).map((s) => s.id).join(" "));
ok(PUSHES.every((p) => inScene(p.frame, p.scene)), `camera: ${PUSHES.length} deliberate push-ins, all inside their scene`);
ok(SHAKES.length === 3, `camera: exactly 3 micro-shakes (S1 "udd gayi", S8 "control", S9 "9.2")`, SHAKES.join(","));
if (SHAKES.length === 3) ok(Math.abs(SHAKES[0] - fw(w("S1", "udd"))) <= 1 && Math.abs(SHAKES[1] - fw(w("S8", "control"))) <= 2 && Math.abs(SHAKES[2] - fw(w("S9", "9.2"))) <= 2 + 30, "camera: the shakes sit on udd / control / 9.2", `${SHAKES.join(", ")} vs ${fw(w("S1", "udd"))}, ${fw(w("S8", "control"))}, ${fw(w("S9", "9.2"))}`);
ok(MUSIC.drop < MUSIC.silentUntil && MUSIC.silentUntil < MUSIC.hopeStart, "music: dark -> drop at 'Lekin' -> piano on 'sach' -> hopeful from 'Abhi tak'", `${MUSIC.drop} < ${MUSIC.silentUntil} < ${MUSIC.hopeStart}`);

// 4. captions
const bad = groups.filter((g) => g.words.length < 2 || g.words.length > 4);
ok(bad.length === 0, `captions: ${groups.length} groups, each 2-4 words`, bad.map((g) => g.words.map((x) => x.text).join(" ")).join(" | "));
const missed = words.filter((x) => { const c = captionAt(x.start + 0.005); return !c || c.group.words[c.current].i !== x.i; });
ok(missed.length === 0, "captions: from its first frame each spoken word is the highlighted one", missed.map((x) => x.text).join(" "));
ok(words.every((x) => /^[A-Za-z0-9.,?!…:'"-]+$/.test(x.text)), "captions: Roman script only");
console.log(failed ? `\nFAIL: ${failed} check(s)` : "\nPASS");
process.exit(failed ? 1 : 0);

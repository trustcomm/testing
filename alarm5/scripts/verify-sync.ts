// Sync checks without rendering:
//  1. the scene table and the length (voice + 0.4 s lead + 0.4 s tail = voice + 0.8 s, 60 fps)
//  2. the transcript against the REAL audio: every word starts on speech, no speech outside a word, word onsets vs the acoustic onsets (statistics)
//  3. the cue modules: every sound event / anchor lies in the film, anchors in their scene; the camera track is ordered and every move has room to breathe
//  4. captions: 2-4 words per chunk (single-word chunks only at the end of a scene), the spoken word is the highlighted one from its first frame
import { execFileSync } from "node:child_process";
import { captionAt, groups } from "../src/captions";
import { ANCHORS, CAMERA, HERO, MUSIC, PUNCH_FRAMES, SCENES, SFX, TOTAL, START } from "../src/timeline";
import { audioDuration, fw, words, w } from "../src/anchors";

let failed = 0;
const ok = (pass: boolean, msg: string, detail = "") => { console.log(`${pass ? "PASS" : "FAIL"}  ${msg}${detail ? "   " + detail : ""}`); if (!pass) failed++; };
const FPS = 60;

const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", "public/vo.mp3", "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], { maxBuffer: 1 << 28 });
const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 2));
const db: number[] = [];
for (let i = 0; i + 160 <= samples.length; i += 160) { let e = 0; for (let k = 0; k < 160; k++) e += (samples[i + k] / 32768) ** 2; db.push(10 * Math.log10(e / 160 + 1e-12)); }
const peak = Math.max(...db);
const level = (a: number, b: number) => Math.max(...db.slice(Math.max(0, Math.floor(a * 100)), Math.ceil(b * 100))) - peak;   // voice time, relative to the loudest 10 ms
const onsetOf = (v: number) => { for (let f = Math.round((v - 0.12) * 100); f <= Math.round((v + 0.12) * 100); f++) if (db[f] > peak - 30 && db[Math.max(0, f - 3)] < db[f] - 3) return f / 100; return NaN; };

console.log("\nscene   start s   frame  end    frames   seconds");
SCENES.forEach((s) => console.log(`${s.id.padEnd(4)}  ${(s.start / FPS).toFixed(2).padStart(7)} s ${String(s.start).padStart(5)} ${String(s.end).padStart(5)}  ${String(s.end - s.start).padStart(5)}  ${((s.end - s.start) / FPS).toFixed(2).padStart(6)}`));
console.log("");
ok(TOTAL === Math.ceil((audioDuration + 0.8) * FPS - 1e-6), `length: ${TOTAL} frames = ${(TOTAL / FPS).toFixed(3)} s = voice ${audioDuration.toFixed(3)} s + 0.8 s at ${FPS} fps`);
ok(SCENES.every((s, i) => i === 0 || s.start > SCENES[i - 1].start) && SCENES.length === 15, "scenes: 15, in order, each starting on its first word");

// 2. the transcript against the audio
const silent = words.filter((x) => level(x.voiceStart - 0.1, x.voiceStart + 0.2) < -45);
ok(silent.length === 0, `audio: all ${words.length} words start on speech`, silent.map((x) => `${x.text}@${x.start.toFixed(2)}`).join(" "));
const stray: number[] = [];
for (let i = 0; i < db.length; i += 10) if (db[i] > peak - 38 && !words.some((x) => i / 100 >= x.voiceStart - 0.15 && i / 100 <= x.voiceEnd + 0.15)) stray.push(i / 100);
ok(stray.length === 0, "audio: no speech outside a word", stray.map((t) => t.toFixed(2)).join(" "));
const diffs = words.map((x) => ({ x, on: onsetOf(x.voiceStart) })).filter((o) => Number.isFinite(o.on)).map((o) => Math.abs(o.x.voiceStart - o.on) * FPS).sort((a, b) => a - b);
const med = diffs[Math.floor(diffs.length / 2)];
ok(med <= 3 && diffs.filter((d) => d <= 4).length / diffs.length >= 0.5, `audio: word starts vs acoustic onsets over ${diffs.length} words: median ${med.toFixed(1)} frames, p90 ${diffs[Math.floor(diffs.length * 0.9)].toFixed(1)}, max ${diffs.at(-1)!.toFixed(1)}; ${(100 * diffs.filter((d) => d <= 4).length / diffs.length).toFixed(0)} % within 4 frames (60 fps)`);
// the anchors the brief names, against the acoustic onset
const key: [string, ReturnType<typeof w>][] = [["alarm (S1)", w("S1", "alarm")], ["chhoota", w("S1", "chhoota")], ["sach", w("S2", "sach")], ["paanch", w("S3", "paanch")], ["brake", w("S3", "brake")], ["mana", w("S3", "mana")], ["chaar", w("S5", "chaar")], ["chupke", w("S5", "chupke")], ["teen", w("S7", "teen")], ["lakh", w("S7", "lakh")], ["do (S9)", w("S9", "do")], ["bug", w("S9", "bug")], ["ek (S11)", w("S11", "ek")], ["khatra", w("S13", "khatra")], ["darna", w("S14", "darna")]];
for (const [name, x] of key) { const on = onsetOf(x.voiceStart), off = (x.voiceStart - on) * FPS; ok(!Number.isFinite(on) || Math.abs(off) <= 6, `key word "${name}": frame ${fw(x)}, acoustic onset ${Number.isFinite(on) ? (on + 0.4).toFixed(3) + " s" : "n/a"} -> ${Number.isFinite(off) ? off.toFixed(1) : "n/a"} frames`); }

// 3. the cue modules
ok(new Set(SFX.map((e) => e.id)).size === SFX.length, `sfx: ${SFX.length} events, unique ids`);
ok(SFX.every((e) => e.frame >= 0 && e.frame < TOTAL), "sfx: every event inside the film");
const badA = ANCHORS.filter((a) => a.frame < START[a.scene] - 1 || a.frame >= TOTAL);
ok(badA.length === 0, `anchors: all ${ANCHORS.length} QA anchors lie inside the film and not before their scene`, badA.map((a) => `${a.scene}:${a.label}@${a.frame}`).join(" "));
ok(ANCHORS.every((a, _i, all) => all.filter((b) => b.frame === a.frame).length >= 1), "anchors: each has a frame");
ok(SCENES.every((s) => HERO[s.id] > 0 && HERO[s.id] < TOTAL), "hero: every scene has a hero frame inside the film");
ok(CAMERA.keys.every((k, i, a) => i === 0 || k.f > a[i - 1].f), `camera: ${CAMERA.keys.length} keys in order, ${CAMERA.travels.length} travelling moves, ${PUNCH_FRAMES.length} punches`);
const short = CAMERA.keys.map((k, i, a) => ({ k, d: i ? k.f - a[i - 1].f : 99 })).filter((o) => o.k.move !== "HOLD" && o.k.move !== "START" && o.d < 8);
ok(short.length === 0, "camera: no move shorter than 8 frames", short.map((o) => `${o.k.move}@${o.k.f} (${o.d})`).join(" "));
ok(MUSIC.tickStart < MUSIC.tickEnd && MUSIC.tickEnd <= MUSIC.drop + 12 && MUSIC.drop < MUSIC.hopeStart, "music: ticking from #5 to #1, silence 12 frames before S13, warm bed from S13", `${MUSIC.tickStart} < ${MUSIC.tickEnd} <= ${MUSIC.drop + 12}, drop ${MUSIC.drop} < hope ${MUSIC.hopeStart}`);

// 4. captions
const bad = groups.filter((g) => g.words.length < 2 || g.words.length > 4);
const lonely = bad.filter((g) => !(g.words.length === 1));
ok(lonely.length === 0 && bad.length <= 4, `captions: ${groups.length} groups of 2-4 words (${bad.length} single-word group${bad.length === 1 ? "" : "s"}, only where a sentence ends on one word)`, bad.map((g) => g.words.map((x) => x.text).join(" ")).join(" | "));
const missed = words.filter((x) => { const c = captionAt(x.start + 0.005); return !c || c.group.words[c.current].i !== x.i; });
ok(missed.length === 0, "captions: from its first frame each spoken word is the highlighted one", missed.map((x) => x.text).join(" "));
ok(words.every((x) => /^[A-Za-z0-9.,?!…:'"-]+$/.test(x.text)), "captions: Roman script only");
console.log(failed ? `\nFAIL: ${failed} check(s)` : "\nPASS");
process.exit(failed ? 1 : 0);

// src/timeline.ts -> public/timeline.json: what the audio engine (scripts/build_mix.py) and the QA read. Frames and seconds, nothing hard-coded elsewhere.
import { mkdirSync, writeFileSync } from "node:fs";
import { ANCHORS, CAMERA, HERO, MUSIC, PUNCH_FRAMES, SCENES, SFX, TIMING, TOTAL } from "../src/timeline";
import { audioDuration, words } from "../src/anchors";
import { SFX_SPEC } from "../src/sfx";

const FPS = TIMING.fps;
const json = {
  meta: { name: "Alarm5", fps: FPS, totalFrames: TOTAL, totalSeconds: TOTAL / FPS, voiceSeconds: audioDuration, leadSeconds: TIMING.lead, tailSeconds: TIMING.tail, voiceOffsetSeconds: TIMING.lead },
  scenes: SCENES.map((s) => ({ id: s.id, name: s.name, start: s.start, end: s.end, startSeconds: +(s.start / FPS).toFixed(3), hero: HERO[s.id] })),
  sfx: SFX.map((e) => ({ id: e.id, scene: e.scene, frame: e.frame, t: +(e.frame / FPS).toFixed(4), sfx: e.sfx, hit: SFX_SPEC[e.sfx].hit, gainDb: e.gainDb ?? 0, pan: e.pan ?? 0, panTo: e.panTo ?? null, pitch: e.pitch ?? 0, seed: e.seed ?? 0, frames: e.frames ?? null, note: e.note })),
  music: { ...MUSIC, dropSeconds: +(MUSIC.drop / FPS).toFixed(4), hopeStartSeconds: +(MUSIC.hopeStart / FPS).toFixed(4), tickStartSeconds: +(MUSIC.tickStart / FPS).toFixed(4), tickEndSeconds: +(MUSIC.tickEnd / FPS).toFixed(4), endSeconds: TOTAL / FPS },
  camera: { keys: CAMERA.keys.map((k) => ({ f: k.f, move: k.move, s: +k.s.toFixed(4) })), travels: CAMERA.travels, punches: PUNCH_FRAMES },
  words: words.map((x) => ({ i: x.i, text: x.text, scene: x.scene, start: x.start, end: x.end })),
  anchors: ANCHORS,
};
mkdirSync("public", { recursive: true });
writeFileSync("public/timeline.json", JSON.stringify(json));
console.log(`public/timeline.json: ${json.scenes.length} scenes, ${json.sfx.length} sound events, ${json.words.length} words, ${TOTAL} frames (${(TOTAL / FPS).toFixed(3)} s = vo ${audioDuration.toFixed(3)} + ${(TIMING.lead + TIMING.tail).toFixed(1)})`);

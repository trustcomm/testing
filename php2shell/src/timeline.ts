// The single source of truth. Scenes, cues, sound events, camera moves and music cues all live in src/cues/sNN.ts (every cue a frame derived from a word in
// src/timings.json via src/anchors.ts) and are gathered here. The picture (Remotion) and the sound (scripts/build_mix.py, through public/timeline.json
// written by scripts/export_timeline.ts) both read THIS, so moving one cue moves picture and sound together. No second is hard-coded anywhere.
import { ANTICIPATE, DISSOLVE, FPS } from "./theme";
import { LEAD, SceneId, TAIL, fw, totalFrames, w, wp } from "./anchors";
import type { SfxEvent } from "./sfx";
import { cues as c1 } from "./cues/s01"; import { cues as c2 } from "./cues/s02"; import { cues as c3 } from "./cues/s03"; import { cues as c4 } from "./cues/s04";
import { cues as c5 } from "./cues/s05"; import { cues as c6 } from "./cues/s06"; import { cues as c7 } from "./cues/s07"; import { cues as c8 } from "./cues/s08";
import { cues as c9 } from "./cues/s09"; import { cues as c10 } from "./cues/s10"; import { cues as c11 } from "./cues/s11"; import { cues as c12 } from "./cues/s12"; import { cues as c13 } from "./cues/s13";

export const SCENE_IDS: SceneId[] = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12", "S13"];
export const SCENE_NAMES: Record<SceneId, string> = {
  S1: "21 October: calendar to globe", S2: "the globe to one browser window", S3: "WordPress runs on PHP: two bugs", S4: "found by researchers", S5: "the dabbawala", S6: "the key left in the tiffin", S7: "the PHP server is the same: match cut", S8: "the hacker walks past the login",
  S9: "9.2 / 10 critical", S10: "THE TRUST TURN: sach", S11: "ask your host: the safe versions", S12: "plugin update is not enough", S13: "call to action",
};
export const CUES = { S1: c1, S2: c2, S3: c3, S4: c4, S5: c5, S6: c6, S7: c7, S8: c8, S9: c9, S10: c10, S11: c11, S12: c12, S13: c13 };

/** the frame each scene's first word is on (scene 1 starts at frame 0: the 0.4 s of silence is part of it) */
export const START: Record<SceneId, number> = {
  S1: 0, S2: fw(wp(2, "aur")), S3: fw(wp(4, "wordpress")), S4: fw(wp(7, "inhe")), S5: fw(wp(10, "ab")), S6: fw(wp(14, "socho")), S7: fw(wp(18, "php")),
  S8: fw(wp(24, "aur")), S9: fw(wp(26, "isliye")), S10: fw(wp(29, "lekin")), S11: fw(wp(34, "toh")), S12: fw(wp(37, "aur")), S13: fw(wp(40, "apni")),
};
export const TOTAL = totalFrames();
export interface SceneInfo { id: SceneId; name: string; start: number; end: number; from: number; to: number }
/** start/end: first word to the next scene's first word. from/to: the frames the scene's LAYER lives on (it starts ANTICIPATE frames early and dissolves over DISSOLVE frames). */
export const SCENES: SceneInfo[] = SCENE_IDS.map((id, i) => {
  const next = SCENE_IDS[i + 1];
  return { id, name: SCENE_NAMES[id], start: START[id], end: next ? START[next] : TOTAL, from: i === 0 ? 0 : START[id] - ANTICIPATE, to: next ? START[next] - ANTICIPATE + DISSOLVE : TOTAL };
});
export const sceneAt = (frame: number): SceneInfo => [...SCENES].reverse().find((s) => frame >= s.start) ?? SCENES[0];

/** every sound event of the film, sorted */
export const SFX: (SfxEvent & { scene: SceneId })[] = SCENE_IDS.flatMap((id) => CUES[id].sfx.map((e) => ({ ...e, scene: id }))).sort((a, b) => a.frame - b.frame || a.id.localeCompare(b.id));
/** the QA stills: one per anchor word */
export const ANCHORS = SCENE_IDS.flatMap((id) => CUES[id].anchors.map((a) => ({ ...a, scene: id })));
export const HERO: Record<SceneId, number> = Object.fromEntries(SCENE_IDS.map((id) => [id, CUES[id].hero])) as Record<SceneId, number>;

// ---- camera: a slow continuous push (1.00 -> 1.04 per scene), a deliberate push-in on every emotional beat, a 2-frame micro-shake on the 3 alarm hits ----
export const PUSHES = SCENE_IDS.flatMap((id) => (CUES[id].pushes ?? []).map((p) => ({ ...p, scene: id })));
export const SHAKES: number[] = SCENE_IDS.flatMap((id) => CUES[id].shakes ?? []);
const smooth01 = (x: number) => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };
const sceneScale = (s: SceneInfo, f: number) => {
  const base = 1 + 0.04 * Math.min(1, Math.max(0, (f - s.start) / Math.max(1, s.end - s.start)));
  const extra = PUSHES.filter((p) => p.scene === s.id && f >= p.frame).reduce((a, p) => a + p.extra * smooth01((f - p.frame) / p.frames), 0);
  return base + extra;
};
export const cameraAt = (f: number): number => {
  const i = SCENES.indexOf(sceneAt(f)), s = SCENES[i];
  const here = sceneScale(s, f);
  if (i === 0) return here;
  const blend = smooth01((f - (s.start - ANTICIPATE)) / (DISSOLVE + ANTICIPATE));          // the camera eases from the end of the last scene into this one
  return sceneScale(SCENES[i - 1], f) * (1 - blend) + here * blend;
};
/** the 2-frame micro-shake: a seeded offset (px) and roll (deg) on the hit frame and the one after */
export const shakeAt = (f: number): { x: number; y: number; r: number } => {
  const hit = SHAKES.find((h) => f >= h && f < h + 2);
  if (hit === undefined) return { x: 0, y: 0, r: 0 };
  const k = f - hit, sgn = k === 0 ? 1 : -0.6;
  return { x: 11 * sgn, y: -8 * sgn, r: 0.35 * sgn };
};
/** 0 until the trust turn, then 1 over 30 frames: the background warms (centre lift #0B0C0F -> #0F1110) */
export const trustAt = (f: number) => smooth01((f - START.S10) / 30);

// ---- captions sit above the bottom zone; during the versions panel (S11, until the S12 cards arrive) they move up ----
export const CAPTION_LIFT = { from: START.S11, to: fw(w("S12", "plugin")) + 6 };

// ---- music: dark ambient pulse S1-S9, a 10-frame drop to near silence at S10 ("Lekin"), a single piano note on "sach", warm and hopeful from "Abhi tak" ----
export const MUSIC = {
  darkStart: 0, drop: fw(w("S10", "lekin")), dropFrames: 10, silentUntil: fw(w("S10", "sach")), hopeStart: fw(w("S10", "abhi")), end: TOTAL, bpm: 92,
};
export const TIMING = { fps: FPS, lead: LEAD, tail: TAIL, leadFrames: Math.round(LEAD * FPS) };

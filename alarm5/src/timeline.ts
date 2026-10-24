// The single source of truth. Scenes, cues, sound events, camera keys and music cues all live in src/cues/sNN.ts (every cue a frame derived from a word in src/timings.json via
// src/anchors.ts) and are gathered here. The picture (Remotion) and the sound (scripts/build_mix.py, through public/timeline.json written by scripts/export_timeline.ts) both read THIS,
// so moving one cue moves picture and sound together. No second is hard-coded anywhere. 60 fps.
import { FPS, StationNo } from "./theme";
import { LEAD, SceneId, TAIL, fw, totalFrames, w, words } from "./anchors";
import { makeCamera, CamKey, Punch, Sentence } from "./camera";
import type { SfxEvent } from "./sfx";
import type { SceneCues } from "./types";
import { cues as c1, cue as k1 } from "./cues/s01"; import { cues as c2, cue as k2 } from "./cues/s02"; import { cues as c3, cue as k3 } from "./cues/s03"; import { cues as c4, cue as k4 } from "./cues/s04";
import { cues as c5, cue as k5 } from "./cues/s05"; import { cues as c6, cue as k6 } from "./cues/s06"; import { cues as c7, cue as k7 } from "./cues/s07"; import { cues as c8, cue as k8 } from "./cues/s08";
import { cues as c9, cue as k9 } from "./cues/s09"; import { cues as c10, cue as k10 } from "./cues/s10"; import { cues as c11, cue as k11 } from "./cues/s11"; import { cues as c12, cue as k12 } from "./cues/s12";
import { cues as c13, cue as k13 } from "./cues/s13"; import { cues as c14, cue as k14 } from "./cues/s14"; import { cues as c15 } from "./cues/s15";

export const SCENE_IDS: SceneId[] = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12", "S13", "S14", "S15"];
export const SCENE_NAMES: Record<SceneId, string> = {
  S1: "five alarms: the map", S2: "darr nahi, sach: fly to the bank", S3: "#5 the banks stop the AI agents", S4: "action: the password", S5: "#4 LiteLLM: the poisoned package", S6: "action: version + keys",
  S7: "#3 Zeabur: breach and closing", S8: "action: shift + passwords", S9: "#2 Signal: the call bug", S10: "fix: update Signal", S11: "#1 PHP2Shell: the foundation", S12: "action: PHP update + the reel",
  S13: "AI = danger, target, watchman", S14: "do this: the constellation", S15: "call to action",
};
export const CUES: Record<SceneId, SceneCues> = { S1: c1, S2: c2, S3: c3, S4: c4, S5: c5, S6: c6, S7: c7, S8: c8, S9: c9, S10: c10, S11: c11, S12: c12, S13: c13, S14: c14, S15: c15 };

/** the frame each scene's first word is on (scene 1 starts at frame 0: the 0.4 s of silence is part of it) */
export const START: Record<SceneId, number> = Object.fromEntries(SCENE_IDS.map((id, i) => [id, i === 0 ? 0 : fw(words.find((x) => x.scene === id)!)])) as Record<SceneId, number>;
export const TOTAL = totalFrames();
export interface SceneInfo { id: SceneId; name: string; start: number; end: number; hero: number }
export const SCENES: SceneInfo[] = SCENE_IDS.map((id, i) => ({ id, name: SCENE_NAMES[id], start: START[id], end: SCENE_IDS[i + 1] ? START[SCENE_IDS[i + 1]] : TOTAL, hero: CUES[id].hero }));
export const sceneAt = (frame: number): SceneInfo => [...SCENES].reverse().find((s) => frame >= s.start) ?? SCENES[0];

/** every sound event of the film, sorted */
export const SFX: (SfxEvent & { scene: SceneId })[] = SCENE_IDS.flatMap((id) => CUES[id].sfx.map((e) => ({ ...e, scene: id }))).sort((a, b) => a.frame - b.frame || a.id.localeCompare(b.id));
export const ANCHORS = SCENE_IDS.flatMap((id) => CUES[id].anchors.map((a) => ({ ...a, scene: id })));
export const HERO: Record<SceneId, number> = Object.fromEntries(SCENE_IDS.map((id) => [id, CUES[id].hero])) as Record<SceneId, number>;

// ---- camera: ONE track from the keys of every cue module; sentence pushes; punches ----
const KEYS: CamKey[] = SCENE_IDS.flatMap((id) => CUES[id].cam);
const PUNCHES: Punch[] = SCENE_IDS.flatMap((id) => CUES[id].punches ?? []);
/** spoken sentences (merged until each is at least 1.4 s) for the slow push-in */
const SENTENCES: Sentence[] = (() => {
  const out: Sentence[] = []; let cur: Sentence | null = null, sc: SceneId | null = null;
  const bySent = new Map<number, typeof words>();
  for (const x of words) { const a = bySent.get(x.sentence) ?? []; a.push(x); bySent.set(x.sentence, a); }
  for (const [, ws] of [...bySent.entries()].sort((a, b) => a[0] - b[0])) {
    const s = fw(ws[0]), e = Math.round((ws.at(-1)!.end) * FPS);
    if (cur && sc === ws[0].scene && cur.end - cur.start < 1.4 * FPS) cur.end = e; else { cur = { start: s, end: e }; out.push(cur); sc = ws[0].scene; }
  }
  return out;
})();
export const CAMERA = makeCamera(KEYS, PUNCHES, SENTENCES);
export const PUNCH_FRAMES = PUNCHES.map((p) => p.f);
export const BLUR: [number, number][] = SCENE_IDS.flatMap((id) => CUES[id].blur ?? []);
export const LIFTS: [number, number][] = SCENE_IDS.flatMap((id) => CUES[id].captionLift ?? []);

// ---- the world's shared state: beacons, routes, the art windows of the stations, the countdown numerals ----
export const BEACON: Record<StationNo, { on: number; active: number; green: number; dimFrom?: number; dimUntil?: number }> = {
  1: { on: k1.bip1, active: START.S11, green: k12.beaconGreen },
  2: { on: k1.bip2, active: START.S9, green: k10.beaconGreen, dimFrom: k13.dim, dimUntil: k14.pullStart },
  3: { on: k1.bip3, active: START.S7, green: k8.beaconGreen, dimFrom: k13.dim, dimUntil: k14.pullStart },
  4: { on: k1.bip4, active: START.S5, green: k6.beaconGreen },
  5: { on: k1.bip5, active: START.S3, green: k4.beaconGreen },
};
export const ROUTE = [
  { draw: k1.bip5, frames: 50, green: k14.route0 }, { draw: k1.bip4, frames: 50, green: k14.route1 },
  { draw: k1.bip3, frames: 50, green: k14.route2 }, { draw: k1.bip2, frames: 50, green: k14.route3 },
];
export const ART = {
  housingFade: START.S2, iconIn: START.S2 + 20,
  window: { 5: [k3.numeral - 10, k5.flyStart + 10], 4: [k5.flyEnd - 30, k7.flyStart + 10], 3: [k7.flyEnd - 30, k9.flyStart + 10], 2: [k9.flyEnd - 30, k11.pullStart + 10], 1: [k11.flyEnd - 30, k13.pullStart + 10] } as Record<StationNo, [number, number]>,
};
/** frame ranges where every beacon pulses (S1: the alarms nobody hears) */
export const PULSE: [number, number][] = [[k1.crowd, k1.crowdOut]];
/** S14: the green wave along the route: the frame each beacon pulses */
export const WAVE: Record<StationNo, number> = { 5: k14.wave, 4: k14.wave + 22, 3: k14.wave + 44, 2: k14.wave + 66, 1: k14.wave + 88 };
/** the frames the S14 words are stacked on screen: the map icons step back meanwhile */
export const S14_STACK: [number, number] = [k14.update, START.S15 + 4];
/** the frames the S11 title PHP2Shell sits over the map: the icons it covers (#5, #4) step back meanwhile */
export const S11_TITLE: [number, number] = [k11.title - 4, k11.titleOut + 14];
export const NUMERALS: { n: number; at: number; hudFrom?: number; hudEnd?: number }[] = [
  { n: 5, at: k3.numeral, hudFrom: k2.hud }, { n: 4, at: k5.numeral }, { n: 3, at: k7.numeral }, { n: 2, at: k9.numeral }, { n: 1, at: k11.numeral, hudEnd: START.S13 + 6 },
];
export const MUSIC = {
  darkStart: 0, tickStart: START.S3, tickEnd: START.S12 + 0, drop: START.S13 - 12, hopeStart: START.S13, end: TOTAL, bpm: 96,
};
export const TIMING = { fps: FPS, lead: LEAD, tail: TAIL };
export { w };

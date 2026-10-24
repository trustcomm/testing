// S13 "Ab ek baat notice karo": the music drops to silence for 12 frames, a smooth PULL to the full map and a slow orbit-feel drift (rotate 0 -> 2 degrees); all five beacons visible;
// three stations get a thin white highlight ring and a pill each, exactly on their word: khatra -> #5 BANK, target -> #4 PACKAGE, chowkidaar -> #1 PHP; #3 and #2 dim to 40 %.
import { fw, w } from "../anchors";
import { key, mapView, onStation } from "../camlib";
import type { SceneCues } from "../types";
import { leadFrame, type SfxEvent } from "../sfx";

const S = (b: string, n = 0) => fw(w("S13", b, n));
export const cue = {
  silence: S("ab") - 12, pullStart: S("ab") - 10, pullEnd: S("ab") + 70, note: S("ab"),
  dim: S("teen") + 8, khatra: S("khatra"), target: S("target"), chowkidaar: S("chowkidaar"),
  orbitEnd: S("chowkidaar") + 40,
};
export const sfx: SfxEvent[] = [
  { id: "s13.pull", frame: leadFrame("pullback_whoosh", cue.pullStart), sfx: "pullback_whoosh", gainDb: -7, pan: 0, note: "the smooth PULL to the full map" },
  { id: "s13.note", frame: cue.note, sfx: "piano_low", gainDb: -3, pan: 0, note: "silence, then a single low piano note" },
  { id: "s13.khatra", frame: cue.khatra, sfx: "tone_soft", gainDb: -11, frames: 80, pitch: -5, pan: -0.5, note: "khatra: the low tone, panned to station #5 (left)" },
  { id: "s13.target", frame: cue.target, sfx: "tone_soft", gainDb: -11, frames: 80, pitch: 4, pan: 0.5, note: "target: the mid tone, panned to station #4 (right)" },
  { id: "s13.chowki", frame: cue.chowkidaar, sfx: "tone_soft", gainDb: -11, frames: 80, pitch: 11, pan: 0.05, note: "chowkidaar: the high tone, station #1 (centre)" },
];
export const cues: SceneCues = {
  cue, sfx, hero: cue.chowkidaar + 34,
  anchors: [
    { label: "ab ek baat", frame: cue.pullEnd + 4, note: "the full map, five green beacons, the orbit drift starting" },
    { label: "teen", frame: cue.dim + 10, note: "stations #3 and #2 dim to 40 %" },
    { label: "khatra", frame: cue.khatra + 14, note: "a thin white ring on #5 BANK and the pill 'AI AGENT = KHATRA'" },
    { label: "target", frame: cue.target + 14, note: "a ring on #4 PACKAGE and the pill 'AI TOOL = TARGET'" },
    { label: "chowkidaar", frame: cue.chowkidaar + 14, note: "a ring on #1 PHP CORE and the pill 'AI-ERA RESEARCH = CHOWKIDAAR'" },
  ],
  cam: [
    key(cue.pullStart, onStation(1, 0.92), "HOLD"),
    key(cue.pullEnd, mapView(0.14), "PULL", { ease: "swing", r: 0 }),
  ],
  captionLift: [],
};

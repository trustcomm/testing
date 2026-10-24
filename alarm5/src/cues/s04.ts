// S4 "Seekh simple hai": a small PULL (scale / 1.3) to frame a clean action card; the green-outlined card slides up, the lock clicks shut, the beacon turns green.
import { fw, w } from "../anchors";
import { key, onStation } from "../camlib";
import type { SceneCues } from "../types";
import { leadFrame, type SfxEvent } from "../sfx";

const S = (b: string, n = 0) => fw(w("S4", b, n));
export const cue = {
  pullStart: S("seekh"), pullEnd: S("seekh") + 62, card: S("apna") - 8, cardIn: S("apna") + 30,
  password: S("password"), aiAgent: S("ai"), lock: S("do"), beaconGreen: S("do"),
};
export const sfx: SfxEvent[] = [
  { id: "s4.pull", frame: leadFrame("whoosh", cue.pullStart), sfx: "whoosh", gainDb: -9, pan: 0, note: "the small PULL" },
  { id: "s4.card", frame: cue.cardIn - 6, sfx: "card_slide", gainDb: -7, pan: 0, note: "the action card slides up" },
  { id: "s4.chime", frame: cue.cardIn, sfx: "action_chime", gainDb: -6, pan: 0, note: "the card lands: the soft action chime" },
  { id: "s4.lock", frame: cue.lock, sfx: "lock_click", gainDb: -9, pan: -0.25, note: "do.: the lock clicks shut" },
  { id: "s4.green", frame: cue.beaconGreen + 8, sfx: "tink", gainDb: -11, pitch: 9, pan: -0.5, note: "the beacon flips red to green" },
];
export const cues: SceneCues = {
  cue, sfx, hero: cue.lock + 2,
  anchors: [
    { label: "seekh", frame: cue.pullStart + 10, note: "the camera pulling back a little from the bank" },
    { label: "password", frame: cue.password + 8, note: "the green-outlined action card with the lock icon, 'password' underlined green" },
    { label: "agent", frame: cue.aiAgent + 24, note: "the card: Bank password -> kisi AI agent ko nahi" },
    { label: "do", frame: cue.lock + 10, note: "lock shut, the beacon green" },
  ],
  cam: [
    key(cue.pullStart, onStation(5, 1.0), "HOLD"),
    key(cue.pullEnd, onStation(5, 0.77), "PULL", { ease: "swing" }),
  ],
};

// S6 "Developer ho? Version check karo": the camera PULLS back out through the box (a reverse dolly), a green action card (1. version check 1.107.0 x, 2. rotate all keys);
// on "keys badal do" the stolen keys morph into new green keys with a rotate animation; the beacon turns green.
import { fw, w } from "../anchors";
import { key, onStation } from "../camlib";
import { boxWorld } from "./s05";
import type { SceneCues } from "../types";
import { leadFrame, type SfxEvent } from "../sfx";

const S = (b: string, n = 0) => fw(w("S6", b, n));
export const cue = {
  outStart: S("developer"), outEnd: S("developer") + 72,
  card: S("version") + 6, line1: S("version") + 10, cross: S("check"), line2: S("saari"),
  keys: S("keys"), morph: S("badal"), beaconGreen: S("do"),
};
export const sfx: SfxEvent[] = [
  { id: "s6.out", frame: leadFrame("dolly_out", cue.outStart), sfx: "dolly_out", gainDb: -3, pan: 0, note: "the reverse dolly: the camera pulls out through the box to the station" },
  { id: "s6.card", frame: cue.card + 6, sfx: "card_slide", gainDb: -8, pan: 0, note: "the green action card slides up" },
  { id: "s6.chime", frame: cue.card + 20, sfx: "action_chime", gainDb: -6, pan: 0, note: "the card lands" },
  { id: "s6.t1", frame: cue.line1 + 2, sfx: "checklist_tick", gainDb: -8, pitch: 0, pan: -0.1, note: "1. Version check ticks in" },
  { id: "s6.cross", frame: cue.cross, sfx: "ui_click", gainDb: -7, pan: 0.2, pitch: -4, note: "1.107.0 gets its x" },
  { id: "s6.t2", frame: cue.line2, sfx: "checklist_tick", gainDb: -8, pitch: 4, pan: -0.1, note: "2. Saari keys rotate karo ticks in" },
  { id: "s6.rot", frame: cue.morph, sfx: "key_ratchet", gainDb: -4, pan: 0, note: "badal: the stolen keys rotate into new green keys" },
  { id: "s6.green", frame: cue.beaconGreen, sfx: "tink", gainDb: -4, pitch: 9, pan: 0.5, note: "the beacon flips red to green" },
];
export const cues: SceneCues = {
  cue, sfx, hero: cue.beaconGreen - 4,
  anchors: [
    { label: "developer", frame: cue.outStart + 24, note: "the camera pulling back out through the box: the dark interior shrinking" },
    { label: "version", frame: cue.line1 + 10, note: "the green action card, 1. Version check" },
    { label: "karo", frame: cue.cross + 10, note: "1.107.0 with a red x" },
    { label: "badal", frame: cue.morph + 12, note: "the stolen red keys rotating into new green keys" },
    { label: "do", frame: cue.beaconGreen + 12, note: "the beacon green" },
  ],
  cam: [
    key(cue.outStart, { x: boxWorld.x, y: boxWorld.y, s: 8.0 }, "HOLD"),
    key(cue.outEnd, onStation(4, 1.0), "REVERSE-DOLLY", { ease: "swing" }),
  ],
  captionLift: [],
};

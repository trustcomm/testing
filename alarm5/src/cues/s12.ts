// S12 "Website hai? PHP update karo": the camera reverses up out of the ground to station level, a green action card (PHP update karo: 8.5.12 / 8.4.27 / 8.3.36 / 8.2.35+),
// the beacon turns green, and on "pichhli reel" a small dark reel-thumbnail card ("PHP2Shell explained") slides in with a play icon and an arrow "Watch".
import { fw, w } from "../anchors";
import { key, onStation } from "../camlib";
import { groundWorld } from "./s11";
import type { SceneCues } from "../types";
import { leadFrame, type SfxEvent } from "../sfx";

const S = (b: string, n = 0) => fw(w("S12", b, n));
export const cue = {
  outStart: S("website") - 6, outEnd: S("website") + 66,
  card: S("update") - 14, cardIn: S("update") + 12, versions: S("karo") - 6, beaconGreen: S("karo"),
  reel: S("pichhli") - 6, reelIn: S("pichhli") + 18, watch: S("reel"), tap: S("hai"),
};
export const sfx: SfxEvent[] = [
  { id: "s12.up", frame: leadFrame("up_whoosh", cue.outStart), sfx: "up_whoosh", gainDb: -3, pan: 0, note: "the reverse dolly up out of the ground to station level" },
  { id: "s12.card", frame: cue.cardIn - 6, sfx: "card_slide", gainDb: -8, pan: 0, note: "the green action card slides up" },
  { id: "s12.chime", frame: cue.beaconGreen, sfx: "action_chime", gainDb: -14, frames: 70, pan: 0, note: "karo.: the action chime" },
  { id: "s12.green", frame: cue.beaconGreen + 6, sfx: "tink", gainDb: -13, pitch: 9, pan: -0.15, note: "the beacon flips red to green" },
  { id: "s12.reel", frame: cue.reelIn - 6, sfx: "card_slide", gainDb: -9, pan: 0.2, note: "the reel thumbnail card slides in" },
  { id: "s12.tap", frame: cue.tap, sfx: "play_tap", gainDb: -6, pan: 0.2, note: "the play icon taps; the Watch arrow bounces" },
];
export const cues: SceneCues = {
  cue, sfx, hero: cue.tap + 20,
  anchors: [
    { label: "website", frame: cue.outStart + 30, note: "reversing up out of the ground: the foundation shrinking below the websites" },
    { label: "php", frame: cue.card + 20, note: "back at station level, the action card sliding up" },
    { label: "update karo", frame: cue.beaconGreen + 10, note: "the card 'PHP update karo' with the four safe versions, the beacon green" },
    { label: "pichhli", frame: cue.reelIn + 10, note: "the reel thumbnail card 'PHP2Shell explained' with a play icon and a Watch arrow" },
    { label: "hai", frame: cue.tap + 10, note: "the play tap" },
  ],
  cam: [
    key(cue.outStart, { x: groundWorld.x, y: groundWorld.y, s: 8.0 }, "HOLD"),
    key(cue.outEnd, onStation(1, 0.92), "REVERSE-DOLLY", { ease: "swing" }),
  ],
  captionLift: [],
};

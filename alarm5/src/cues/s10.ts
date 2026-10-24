// S10 "Achhi khabar, fix aa chuka hai": a gentle PULL; the red mic turns off, a green Update progress ring completes around the phone, the card "Fix aa gaya . Signal update karo",
// the small grey line "No known exploitation", the beacon turns green.
import { fw, w } from "../anchors";
import { key, onStation } from "../camlib";
import type { SceneCues } from "../types";
import { leadFrame, type SfxEvent } from "../sfx";

const S = (b: string, n = 0) => fw(w("S10", b, n));
export const cue = {
  pullStart: S("achhi"), pullEnd: S("achhi") + 80,
  micOff: S("khabar"), ringStart: S("fix") - 6, ringEnd: S("hai"), card: S("chuka"), grey: S("signal"), update: S("update"), beaconGreen: S("hai"),
};
export const sfx: SfxEvent[] = [
  { id: "s10.pull", frame: leadFrame("whoosh", cue.pullStart), sfx: "whoosh", gainDb: -13, pan: 0, note: "the gentle PULL back from the phone" },
  { id: "s10.relief", frame: cue.micOff, sfx: "relief_swell", gainDb: -6, pan: 0, note: "khabar: the mic icon turns off: a soft major relief swell" },
  { id: "s10.ring", frame: cue.ringEnd, sfx: "ring_fill", gainDb: -5, pan: 0, note: "the green Update ring fills" },
  { id: "s10.ding", frame: cue.ringEnd, sfx: "ding_done", gainDb: -5, pan: 0, note: "completion ding" },
  { id: "s10.card", frame: cue.card, sfx: "card_slide", gainDb: -9, pan: 0, note: "the card Fix aa gaya slides in" },
  { id: "s10.green", frame: cue.beaconGreen + 4, sfx: "tink", gainDb: -4, pitch: 9, pan: 0.5, note: "the beacon flips red to green" },
  { id: "s10.grey", frame: cue.grey + 6, sfx: "tick", gainDb: -14, pan: 0, note: "the grey line fades in" },
];
export const cues: SceneCues = {
  cue, sfx, hero: cue.update + 20,
  anchors: [
    { label: "achhi", frame: cue.pullStart + 16, note: "gentle pull-back: the phone, the mic still lit" },
    { label: "khabar", frame: cue.micOff + 14, note: "the red mic icon turned off" },
    { label: "fix", frame: cue.ringStart + 40, note: "the green Update ring filling around the phone" },
    { label: "chuka hai", frame: cue.card + 24, note: "the ring complete, the card 'Fix aa gaya', the beacon green" },
    { label: "update", frame: cue.update + 14, note: "'Signal update karo' card plus the grey 'No known exploitation' line" },
  ],
  cam: [
    key(cue.pullStart, onStation(2, 1.08), "HOLD"),
    key(cue.pullEnd, onStation(2, 1.0), "PULL", { ease: "swing", settle: false }),
  ],
};

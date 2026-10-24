// S2 "Darr nahi, sach. Number paanch": DRIFT on the full map, "Darr nahi, sach." writes on (a thin green underline wipe on "sach": the first hint of trust),
// the countdown HUD appears, and on "Number paanch se" a FLY-TO toward station #5.
import { fw, w } from "../anchors";
import { key, mapView, onStation } from "../camlib";
import type { SceneCues } from "../types";
import { leadFrame, type SfxEvent } from "../sfx";

const S = (b: string, n = 0) => fw(w("S2", b, n));
export const cue = {
  darr: S("darr"), nahi: S("nahi"), sach: S("sach"), underline: S("sach"), textOut: S("number") + 10,
  hud: S("number"), flyStart: S("paanch") + 0, flyEnd: S("paanch") + 72, flyMid: S("paanch") + 36,
};
export const sfx: SfxEvent[] = [
  { id: "s2.sach", frame: cue.sach, sfx: "piano_tick", gainDb: -4, pitch: 7, note: "sach: the green underline wipes in under the word" },
  { id: "s2.hud", frame: cue.hud + 4, sfx: "tink", gainDb: -8, pitch: 12, pan: 0.7, note: "the HUD ring + 05 fade in at the top right" },
  { id: "s2.fly", frame: leadFrame("flyto_whoosh", cue.flyStart), sfx: "flyto_whoosh", gainDb: -2, pan: 0.3, panTo: -0.7, note: "FLY-TO station #5: the doppler whoosh pans right to left toward the bank; its pre-roll starts 12 frames before the camera moves" },
];
export const cues: SceneCues = {
  cue, sfx, hero: cue.sach + 20,
  anchors: [
    { label: "darr", frame: cue.darr + 6, note: "'Darr nahi, sach.' writing on over the green-tinted... the full map, drifting" },
    { label: "sach", frame: cue.sach + 8, note: "the green underline wipes under 'sach'" },
    { label: "number", frame: cue.hud + 8, note: "the HUD ring with 05 at the top right" },
    { label: "shuru", frame: cue.flyStart + 36, note: "mid FLY-TO: the camera has zoomed out and travels left toward the bank, motion blur" },
  ],
  cam: [
    key(cue.flyStart, mapView(0.15), "HOLD"),
    key(cue.flyEnd, onStation(5, 1.0), "FLY-TO"),
  ],
  blur: [],
};

// S8 "Wahan aapka app hai? Abhi shift karo": a lateral glide to frame a small green safe server beside the closing city; an app icon lifts from the dark city and flies along an arc
// to the green server (SHIFT); a password field re-types to new dots with a green check; the beacon turns green.
import { fw, w } from "../anchors";
import { key, onStation } from "../camlib";
import type { SceneCues } from "../types";
import { leadFrame, type SfxEvent } from "../sfx";

const S = (b: string, n = 0) => fw(w("S8", b, n));
export const cue = {
  glideStart: 2762, glideEnd: 2826,
  server: S("aapka"), app: S("app"), lift: S("abhi"), shift: S("shift"), land: S("karo") + 14,
  pw: S("passwords"), type1: S("passwords") + 2, check: S("badlo"), beaconGreen: S("badlo"),
};
const typed: SfxEvent[] = Array.from({ length: 4 }, (_, i) => ({ id: `s8.type${i}`, frame: cue.type1 + i * 7, sfx: "type_click" as const, gainDb: -12, pan: 0.4, pitch: i % 2 ? 2 : -1, seed: i, note: "the new password dots type in" }));
export const sfx: SfxEvent[] = [
  { id: "s8.glide", frame: leadFrame("whoosh", cue.glideStart), sfx: "whoosh", gainDb: -10, pan: 0.2, note: "the lateral glide to the green server" },
  { id: "s8.server", frame: cue.server + 4, sfx: "card_slide", gainDb: -10, pan: 0.6, note: "the green safe-server outline writes on" },
  { id: "s8.lift", frame: cue.lift, sfx: "lift_whoop", gainDb: -5, pan: -0.3, note: "Abhi: the app icon lifts from the dark city" },
  { id: "s8.arc", frame: cue.shift + 12, sfx: "arc_whoosh", gainDb: -5, pan: -0.3, panTo: 0.6, note: "shift: the icon flies along its arc to the green server (the pan follows it)" },
  { id: "s8.land", frame: cue.land, sfx: "land_tap", gainDb: -5, pan: 0.6, note: "the icon lands on the green server" },
  ...typed,
  { id: "s8.check", frame: cue.check, sfx: "checklist_tick", gainDb: -13, pan: 0.4, pitch: 3, note: "the green check" },
  { id: "s8.green", frame: cue.beaconGreen + 6, sfx: "tink", gainDb: -13, pitch: 9, pan: -0.5, note: "the beacon flips red to green" },
];
export const cues: SceneCues = {
  cue, sfx, hero: cue.beaconGreen + 24,
  anchors: [
    { label: "wahan", frame: cue.glideStart + 30, note: "the camera gliding sideways: the closing city and the green safe server" },
    { label: "app", frame: cue.app + 10, note: "an app icon lit in the dark city" },
    { label: "shift", frame: cue.shift + 14, note: "the app icon in flight along its arc, label SHIFT" },
    { label: "passwords", frame: cue.pw + 10, note: "the password field retyping, the icon on the green server" },
    { label: "badlo", frame: cue.beaconGreen + 10, note: "the green check, the beacon green" },
  ],
  cam: [
    key(cue.glideStart, onStation(3, 0.86), "HOLD"),
    key(cue.glideEnd, onStation(3, 0.86, 340, 0), "GLIDE", { ease: "glide" }),
  ],
};

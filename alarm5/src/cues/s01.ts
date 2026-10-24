// S1 "paanch alarm baje": starts extremely close on station #1's beacon (scale 3.0: one dark circle), a long PULL to the full map over the first sentence; five beacons blink on in
// sequence with the route paths drawing between them; the headline types in; on "suna bhi nahi" the sound wave over the crowd stays flat; on "seedha aapko" a PUNCH.
import { fw, w } from "../anchors";
import { key, mapView } from "../camlib";
import { beaconPoint } from "../geometry";
import type { SceneCues } from "../types";
import { leadFrame, type SfxEvent } from "../sfx";

const S = (b: string, n = 0) => fw(w("S1", b, n));
export const cue = {
  silence: 18, bip1: 20,
  pullStart: 22, pullEnd: 172,
  bip2: S("paanch"), bip3: S("alarm"), bip4: S("baje"), bip5: S("zyaadatar"),
  iss: S("iss"), headline: S("paanch"), headlineOut: S("ek") + 14,
  crowd: S("suna") - 8, flat: S("nahi"), crowdOut: S("lekin") + 40,
  ek: S("ek"), seedha: S("seedha"), aapko: S("aapko"), you: S("aapko"),
};
const b1 = beaconPoint(1);
export const sfx: SfxEvent[] = [
  { id: "s1.bip1", frame: cue.bip1, sfx: "beacon_bip", gainDb: -4, pitch: -2, pan: 0, note: "the first beacon blinks in the dark (silence 0.3 s before it)" },
  { id: "s1.pullback", frame: leadFrame("pullback_whoosh", cue.pullStart), sfx: "pullback_whoosh", gainDb: -3, pan: 0, note: "the long airy pull-back: it starts under the first bip and peaks as the camera is at its fastest" },
  { id: "s1.bip2", frame: cue.bip2, sfx: "beacon_bip", gainDb: -6, pitch: 3, pan: 0.5, note: "beacon #2 blinks on (right)" },
  { id: "s1.bip3", frame: cue.bip3, sfx: "beacon_bip", gainDb: -6, pitch: 5, pan: -0.46, note: "beacon #3 blinks on (left)" },
  { id: "s1.bip4", frame: cue.bip4, sfx: "beacon_bip", gainDb: -6, pitch: 7, pan: 0.53, note: "beacon #4 blinks on (right)" },
  { id: "s1.bip5", frame: cue.bip5, sfx: "beacon_bip", gainDb: -6, pitch: 10, pan: -0.53, note: "beacon #5 blinks on (left): five alarms" },
  { id: "s1.crowd", frame: cue.crowd + 10, sfx: "crowd_flat", gainDb: -8, pan: 0, note: "the sound wave over the crowd stays flat: nobody hears" },
  { id: "s1.ek", frame: cue.ek, sfx: "beacon_bip", gainDb: -8, pitch: -5, pan: 0.0, note: "ek...: the beacon of station #1 pulses once, low" },
  { id: "s1.riser", frame: cue.aapko, sfx: "reverse_riser", gainDb: -7, note: "seedha aapko: the 8-frame reverse riser into the hit (ends on it)" },
  { id: "s1.punch", frame: cue.aapko, sfx: "punch_hit", gainDb: 0, note: "aapko: PUNCH, the red line lands and the YOU pill lands" },
  { id: "s1.heart", frame: cue.aapko + 14, sfx: "heartbeat", gainDb: -3, note: "the heartbeat thump after the hit" },
];
export const cues: SceneCues = {
  cue, sfx, hero: 440,
  anchors: [
    { label: "silence+bip", frame: cue.bip1 + 4, note: "one red beacon in a dark circle, the screen is one dark disc" },
    { label: "iss hafte", frame: cue.iss + 6, note: "pull-back under way, beacon #1 still large; 'iss hafte' in serif italic" },
    { label: "paanch alarm", frame: cue.headline + 10, note: "beacons blinking on, '5 ALARM' typing" },
    { label: "baje", frame: cue.bip4 + 6, note: "four beacons, routes drawing" },
    { label: "suna bhi nahi", frame: cue.flat + 6, note: "the crowd of tiny people, the sound wave flat" },
    { label: "ek", frame: cue.ek + 6, note: "full map, beacon #1 pulses" },
    { label: "seedha aapko", frame: cue.aapko + 6, note: "PUNCH: the red dotted line at the camera, the YOU pill" },
  ],
  cam: [
    key(0, { x: b1[0], y: b1[1], s: 3.0 }, "START"),
    key(cue.pullStart, { x: b1[0], y: b1[1], s: 3.0 }, "HOLD"),
    key(cue.pullEnd, mapView(0.165), "PULL", { ease: "swing" }),
  ],
  punches: [{ f: cue.aapko, amount: 0.25, id: "s1.aapko" }],
  blur: [[cue.seedha, cue.aapko + 8]],
};

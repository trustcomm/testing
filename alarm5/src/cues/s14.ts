// S14 "Isliye AI se darna nahi hai": PULL further (scale 0.15) so the map is a glowing constellation; every beacon pulses green in a wave along the route and the route lines turn green;
// three big words stack in screen space on their words: UPDATE. KEYS BADLO. PASSWORD: KISI KO NAHI.; on "AI ko bhi nahi" a tiny robot shakes its head 'nope' beside a green lock; PUSH back toward the centre.
import { fw, w } from "../anchors";
import { key, mapView } from "../camlib";
import type { SceneCues } from "../types";
import { leadFrame, type SfxEvent } from "../sfx";

const S = (b: string, n = 0) => fw(w("S14", b, n));
export const cue = {
  pullStart: S("isliye"), pullEnd: S("isliye") + 84,
  wave: S("darna") - 20, route0: S("darna") - 14, route1: S("darna") + 8, route2: S("darna") + 30, route3: S("darna") + 52,
  update: S("update"), keys: S("keys"), password: S("password"), kisi: S("kisi"),
  robot: S("ai", 1), nope: S("nahi", 1), lock: S("nahi", 1),
  pushStart: S("aur"), pushEnd: S("nahi", 1) + 30,
};
const wave: SfxEvent[] = [0, 1, 2, 3, 4].map((i) => ({ id: `s14.tink${i}`, frame: cue.wave + i * 22 + 4, sfx: "green_tink" as const, gainDb: -9, pitch: i * 2, pan: [-0.5, 0.5, -0.45, 0.5, 0.05][i], note: `a soft green tink: beacon ${5 - i} pulses green along the route` }));
export const sfx: SfxEvent[] = [
  { id: "s14.pull", frame: leadFrame("pullback_whoosh", cue.pullStart), sfx: "pullback_whoosh", gainDb: -8, pan: 0, note: "PULL further: the whole map becomes a constellation" },
  { id: "s14.pad", frame: cue.pullStart + 10, sfx: "pad_bloom", gainDb: -8, pan: 0, note: "isliye: the warm pad blooms" },
  ...wave,
  { id: "s14.update", frame: cue.update, sfx: "hit_firm", gainDb: -4, pitch: 0, pan: 0, note: "UPDATE. lands: one firm satisfying hit" },
  { id: "s14.keys", frame: cue.keys, sfx: "hit_firm", gainDb: -4, pitch: 2, pan: 0, note: "KEYS BADLO. lands" },
  { id: "s14.pass", frame: cue.password, sfx: "hit_firm", gainDb: -4, pitch: 4, pan: 0, note: "PASSWORD: lands" },
  { id: "s14.kisi", frame: cue.kisi + 10, sfx: "hit_firm", gainDb: -6, pitch: 7, pan: 0, note: "KISI KO NAHI lands" },
  { id: "s14.nope", frame: cue.nope, sfx: "boop", gainDb: -15, pan: 0, note: "the robot's playful nope head-shake" },
  { id: "s14.lock", frame: cue.lock + 6, sfx: "lock_click", gainDb: -14, pan: 0.1, pitch: 4, note: "the green lock clicks" },
];
export const cues: SceneCues = {
  cue, sfx, hero: cue.nope + 20,
  anchors: [
    { label: "isliye", frame: cue.pullStart + 40, note: "pulling further out: the whole map" },
    { label: "darna", frame: cue.route1 + 20, note: "the beacons and the route lines turning green in a wave" },
    { label: "update", frame: cue.update + 12, note: "the big word 'UPDATE.' in screen space over the green constellation" },
    { label: "keys", frame: cue.keys + 12, note: "'KEYS BADLO.' stacked under it" },
    { label: "password", frame: cue.kisi + 22, note: "'PASSWORD: KISI KO NAHI.' stacked" },
    { label: "nahi", frame: cue.nope + 12, note: "the tiny robot shaking its head nope beside the green lock" },
  ],
  cam: [
    key(cue.pullStart, mapView(0.165), "HOLD", { r: 2.0 }),
    key(cue.pullEnd, mapView(0.15), "PULL", { ease: "swing", r: 2.0 }),
    key(cue.pushStart, mapView(0.15), "HOLD", { r: 2.0 }),
    key(cue.pushEnd, mapView(0.17), "HOLD", { ease: "swing", r: 0.5 }),
  ],
  captionLift: [[4498, 4915]],
};

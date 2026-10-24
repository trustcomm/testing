// S15 "Follow karo. Aur comment karo ALERT": DRIFT and a gentle final push on the green constellation; CTA: a pill "Follow @baqur.ai" and a bigger white pill "Comment ALERT" that pulses;
// a checklist icon flips open showing five tiny green ticks; a micro line of sources at the bottom edge (above the safe zone).
import { fw, w } from "../anchors";
import { key, mapView } from "../camlib";
import type { SceneCues } from "../types";
import type { SfxEvent } from "../sfx";

const S = (b: string, n = 0) => fw(w("S15", b, n));
export const cue = {
  follow: S("follow"), followPill: S("follow") - 8,
  comment: S("comment") - 6, alert: S("alert"), checklist: S("checklist") - 10, flip: S("checklist"), bhej: S("bhej"), dunga: S("dunga"),
  tick0: S("checklist") + 12, sources: S("comment"),
};
const ticks: SfxEvent[] = [0, 1, 2, 3, 4].map((i) => ({ id: `s15.tick${i}`, frame: cue.tick0 + i * 7, sfx: "checklist_tick" as const, gainDb: -15, pitch: i * 2, pan: -0.2 + i * 0.1, note: `tick ${i + 1} of 5 in the checklist` }));
export const sfx: SfxEvent[] = [
  { id: "s15.resolve", frame: cue.follow, sfx: "pluck_resolve", gainDb: -12, frames: 70, pan: 0, note: "Follow karo: the upbeat pluck resolve" },
  { id: "s15.pill1", frame: cue.followPill + 6, sfx: "pop", gainDb: -8, pan: -0.2, note: "the Follow pill pops" },
  { id: "s15.pill2", frame: cue.comment + 6, sfx: "pop", gainDb: -6, pan: 0.1, note: "the Comment ALERT pill pops" },
  { id: "s15.alert", frame: cue.alert, sfx: "tink", gainDb: -7, pitch: 7, pan: 0.1, note: "ALERT: the pill pulses" },
  { id: "s15.flip", frame: cue.flip, sfx: "page_flip", gainDb: -7, pan: 0, note: "the checklist icon flips open" },
  ...ticks,
  { id: "s15.final", frame: cue.dunga + 22, sfx: "final_chime", gainDb: -10, pan: 0, note: "dunga.: the final gentle chime with a long tail" },
];
export const cues: SceneCues = {
  cue, sfx, hero: cue.dunga + 34,
  anchors: [
    { label: "har hafte", frame: S("har") + 20, note: "the green constellation, DRIFT" },
    { label: "follow", frame: cue.follow + 12, note: "the pill 'Follow @baqur.ai'" },
    { label: "comment", frame: cue.comment + 24, note: "the bigger white pill 'Comment ALERT'" },
    { label: "checklist", frame: cue.tick0 + 20, note: "the checklist icon flipped open with green ticks" },
    { label: "dunga", frame: cue.dunga + 24, note: "the CTA complete, the sources line at the bottom edge" },
  ],
  cam: [
    key(S("har"), mapView(0.138), "HOLD", { r: 0.5 }),
    key(5302, mapView(0.144), "HOLD", { ease: "swing", r: 0 }),
  ],
  captionLift: [],
};

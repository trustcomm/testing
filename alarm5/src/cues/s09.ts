// S9 "Number do. Signal": FLY-TO station #2, the 2 reveals, a generic phone with a call screen, a finger tap on the red hang-up button on "call kaatne" ("Call ended"), the tiny mic stays lit red
// with sound rings radiating on "ke baad bhi", a tight PUSH on the phone and a PUNCH on "sun sakta tha".
import { fw, w } from "../anchors";
import { key, onStation } from "../camlib";
import type { SceneCues } from "../types";
import { leadFrame, type SfxEvent } from "../sfx";

const S = (b: string, n = 0) => fw(w("S9", b, n));
export const cue = {
  flyStart: 2878, flyEnd: 2942, flyMid: 2910,
  numeral: S("do"),
  phone: S("signal") - 4, secure: S("secure"), bug: S("bug"), fact: S("mila"),
  callTone: S("call") - 10, tap: S("kaatne"), ended: S("kaatne") + 14, mic: S("bhi"), micOn: S("bhi"),
  pushStart: S("usmein"), pushEnd: S("usmein") + 80, sun: S("sun"), tha: S("tha"),
};
export const sfx: SfxEvent[] = [
  { id: "s9.fly", frame: leadFrame("flyto_whoosh", cue.flyStart), sfx: "flyto_whoosh", gainDb: -4, pan: -0.6, panTo: 0.6, note: "FLY-TO station #2: left to right and down" },
  { id: "s9.number", frame: cue.numeral, sfx: "number_reveal", gainDb: -1, note: "the 2 assembles" },
  { id: "s9.phone", frame: cue.phone + 10, sfx: "card_slide", gainDb: -11, pan: 0, note: "the phone outline writes on" },
  { id: "s9.bug", frame: cue.bug, sfx: "scuttle_s", gainDb: -9, pan: 0.2, note: "bug: a red bug glyph flashes in the phone's corner" },
  { id: "s9.fact", frame: cue.fact, sfx: "tink", gainDb: -8, pitch: 1, pan: 0, note: "the fact line pops: Signal call bug . CVE-2026-113380" },
  { id: "s9.call", frame: cue.callTone, sfx: "call_tone", gainDb: -9, pan: 0, note: "a soft call tone while the call is on" },
  { id: "s9.tap", frame: cue.tap, sfx: "hangup_blip", gainDb: -4, pan: 0.05, note: "kaatne: the finger-tap ripple hits the red hang-up button" },
  { id: "s9.room", frame: cue.micOn, sfx: "room_tone", gainDb: -7, pan: 0, note: "ke baad bhi: the eerie continuing room tone with a faint mic hiss" },
  { id: "s9.punch", frame: cue.sun, sfx: "punch_hit", gainDb: -1, pan: 0, note: "sun sakta tha: PUNCH" },
  { id: "s9.heart", frame: cue.sun + 22, sfx: "heartbeat", gainDb: -2, pan: 0, note: "heartbeat on sakta" },
];
export const cues: SceneCues = {
  cue, sfx, hero: cue.sun - 8,
  anchors: [
    { label: "do", frame: cue.numeral + 6, note: "the big 2 at screen centre" },
    { label: "signal", frame: cue.phone + 20, note: "the phone outline with a call screen (Call, a red hang-up button)" },
    { label: "bug", frame: cue.bug + 10, note: "a red bug glyph at the phone, the CVE fact line 'Signal call bug . CVE-2026-113380'" },
    { label: "kaatne", frame: cue.tap + 8, note: "the finger tap ripple on the red hang-up button, 'Call ended'" },
    { label: "bhi", frame: cue.micOn + 14, note: "the tiny mic icon stays lit red, sound rings radiating" },
    { label: "sun sakta", frame: cue.sun + 8, note: "PUNCH: the phone and the lit mic, tight" },
  ],
  cam: [
    key(cue.flyStart, onStation(3, 0.86, 340), "HOLD"),
    key(cue.flyEnd, onStation(2, 1.0), "FLY-TO", { dip: 0.35 }),
    key(cue.pushStart, onStation(2, 1.0), "HOLD"),
    key(cue.pushEnd, onStation(2, 1.2), "HOLD", { ease: "swing" }),
  ],
  punches: [{ f: cue.sun, amount: 0.25, id: "s9.sun" }],
  captionLift: [],
};

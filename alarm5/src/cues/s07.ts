// S7 "Number teen. Zeabur": FLY-TO station #3, the 3 reveals, a skyline of server-rack buildings labelled ZEABUR, two red calendar stamps (AUG, OCT) on "doosri baar", a PUNCH on "Battees lakh"
// while the counter rolls up to 3.2M+ records and sparks stream out, the windows switch off row by row, a sign swings in: CLOSING . DEC 2026; a slow PULL on "band ho rahi hai".
import { fw, w } from "../anchors";
import { key, onStation } from "../camlib";
import type { SceneCues } from "../types";
import { leadFrame, type SfxEvent } from "../sfx";

const S = (b: string, n = 0) => fw(w("S7", b, n));
export const cue = {
  flyStart: 2186, flyEnd: 2256, flyMid: 2221,
  numeral: S("teen"),
  city: S("zeabur") - 14, zeabur: S("zeabur"), hosting: S("hosting"),
  aug: S("doosri"), oct: S("baar"), breach: S("breach"),
  counterStart: S("battees") - 30, counterEnd: S("lakh"), lakh: S("lakh"),
  sparks: S("lakh"), sparksEnd: S("leak") + 20,
  windows: S("company") + 4, windowsEnd: S("ho") + 8, band: S("band"), sign: S("rahi"),
  pullStart: S("band"), pullEnd: S("band") + 80,
};
const win: SfxEvent[] = Array.from({ length: 8 }, (_, i) => ({ id: `s7.win${i}`, frame: cue.windows + Math.round(i * (cue.windowsEnd - cue.windows) / 7), sfx: "window_click" as const, gainDb: -11 + (i % 2), pitch: -2 * i, pan: -0.3 + (i % 3) * 0.3, seed: i, note: "a row of windows switches off: the cascade falls row by row" }));
export const sfx: SfxEvent[] = [
  { id: "s7.fly", frame: leadFrame("flyto_whoosh", cue.flyStart), sfx: "flyto_whoosh", gainDb: -4, pan: 0.6, panTo: -0.6, note: "FLY-TO station #3: right to left and down" },
  { id: "s7.number", frame: cue.numeral, sfx: "number_reveal", gainDb: -1, note: "the 3 assembles" },
  { id: "s7.city", frame: cue.city + 8, sfx: "card_slide", gainDb: -11, pan: 0, note: "the skyline writes on" },
  { id: "s7.zeabur", frame: cue.zeabur + 8, sfx: "tink", gainDb: -7, pitch: 3, pan: -0.15, note: "the ZEABUR label pops" },
  { id: "s7.aug", frame: cue.aug, sfx: "stamp_thud", gainDb: -4, pan: -0.25, pitch: 0, note: "doosri: the red AUG stamp lands" },
  { id: "s7.oct", frame: cue.oct, sfx: "stamp_thud", gainDb: -4, pan: 0.25, pitch: -2, note: "baar: the red OCT stamp lands" },
  { id: "s7.counter", frame: cue.lakh, sfx: "counter_roll", gainDb: -5, pan: 0, note: "the counter rolls up 3.2M+ and lands with a sub hit on lakh" },
  { id: "s7.punch", frame: cue.lakh, sfx: "punch_hit", gainDb: -9, pan: 0, note: "Battees lakh: PUNCH" },
  { id: "s7.sparks", frame: cue.sparks + 6, sfx: "spark_crackle", gainDb: -8, pan: 0, note: "hundreds of tiny dots stream out like sparks" },
  ...win,
  { id: "s7.pull", frame: leadFrame("whoosh", cue.pullStart), sfx: "whoosh", gainDb: -13, pan: 0, note: "the slow PULL on band ho rahi hai" },
  { id: "s7.sad", frame: cue.band, sfx: "sad_drop", gainDb: -12, frames: 90, pan: 0, note: "band: a low sad tonal drop" },
  { id: "s7.sign", frame: cue.sign, sfx: "stamp_thud", gainDb: -9, pan: 0, pitch: 2, note: "the CLOSING sign swings in and settles" },
];
export const cues: SceneCues = {
  cue, sfx, hero: cue.sign + 10,
  anchors: [
    { label: "teen", frame: cue.numeral + 6, note: "the big 3 at screen centre, the camera has just arrived at the server city" },
    { label: "zeabur", frame: cue.zeabur + 14, note: "the skyline of server-rack buildings labelled ZEABUR" },
    { label: "doosri baar", frame: cue.oct + 10, note: "the AUG and OCT calendar chips stamped red" },
    { label: "lakh", frame: cue.lakh + 8, note: "the counter reads 3.2M+ records, sparks streaming out (PUNCH)" },
    { label: "company", frame: cue.windows + 12, note: "windows switching off row by row" },
    { label: "rahi hai", frame: cue.sign + 24, note: "the sign CLOSING . DEC 2026 swinging in, the camera pulling back" },
  ],
  cam: [
    key(cue.flyStart, onStation(4, 1.0, 0, 0), "HOLD"),
    key(cue.flyEnd, onStation(3, 1.0), "FLY-TO", { dip: 0.35 }),
    key(cue.pullStart, onStation(3, 1.0), "HOLD"),
    key(cue.pullEnd, onStation(3, 0.86), "PULL", { ease: "swing", settle: false }),
  ],
  punches: [{ f: cue.lakh, amount: 0.25, id: "s7.lakh" }],
};

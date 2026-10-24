// S5 "Number chaar. LiteLLM": FLY-TO station #4 (zoom out, glide right/down, zoom in), the 4 reveal, a shipping box "LiteLLM 1.107.0" on a conveyor, a red worm-line slips into its seam
// on "chupke se", then a DOLLY-THROUGH the package on "chor code daal diya gaya" into the dark inner world where the stolen keys are pulled out through a hatch.
import { fw, w } from "../anchors";
import { key, onStation } from "../camlib";
import { stationPoint } from "../geometry";
import type { SceneCues } from "../types";
import { leadFrame, type SfxEvent } from "../sfx";

const S = (b: string, n = 0) => fw(w("S5", b, n));
const st4 = stationPoint(4);
export const BOX = { x: 0, y: 40 };                                 // the LiteLLM box, local to station #4
export const boxWorld = { x: st4[0] + BOX.x, y: st4[1] + BOX.y };
export const cue = {
  flyStart: 1478, flyEnd: 1548, flyMid: 1513,
  numeral: S("chaar"),
  box: S("litellm") - 12, label: S("litellm"), others: S("developers"), tagIn: S("version") - 6,
  worm: S("chupke") - 10, wormIn: S("chupke"),
  dollyStart: S("chor") - 6, dollyEnd: S("chor") + 8,
  keyCloud: S("cloud"), keyAi: S("ai", 1), pull1: S("keys"), pull2: S("chura"), pull3: S("raha"), pull4: S("tha"),
};
export const sfx: SfxEvent[] = [
  { id: "s5.fly", frame: leadFrame("flyto_whoosh", cue.flyStart), sfx: "flyto_whoosh", gainDb: -4, pan: -0.6, panTo: 0.6, note: "FLY-TO station #4: zoom out, glide right and down, zoom in" },
  { id: "s5.number", frame: cue.numeral, sfx: "number_reveal", gainDb: -1, note: "the 4 assembles while the camera is in flight" },
  { id: "s5.conveyor", frame: cue.box + 4, sfx: "conveyor_hum", gainDb: -16, pan: 0, note: "the conveyor starts to hum" },
  { id: "s5.label", frame: cue.label + 6, sfx: "tink", gainDb: -7, pitch: 4, pan: 0.1, note: "LiteLLM 1.107.0 label pops" },
  { id: "s5.creak", frame: cue.wormIn, sfx: "creak", gainDb: -9, pan: 0.15, note: "chupke se: the red worm-line slips inside the box seam" },
  { id: "s5.dive", frame: leadFrame("dolly_dive", cue.dollyStart, 7), sfx: "dolly_dive", gainDb: -2, pan: 0, note: "DOLLY-THROUGH the package: the camera dives through it" },
  { id: "s5.key1", frame: cue.pull1, sfx: "glassy_pluck", gainDb: -5, pitch: 0, pan: -0.4, note: "the first stolen key leaves through the hatch" },
  { id: "s5.key2", frame: cue.pull2, sfx: "glassy_pluck", gainDb: -5, pitch: 4, pan: 0.3, note: "the second key" },
  { id: "s5.key3", frame: cue.pull3, sfx: "glassy_pluck", gainDb: -6, pitch: 7, pan: -0.2, note: "the third key" },
  { id: "s5.key4", frame: cue.pull4, sfx: "glassy_pluck", gainDb: -6, pitch: 11, pan: 0.45, note: "the fourth key" },
];
export const cues: SceneCues = {
  cue, sfx, hero: cue.pull4 - 4,
  anchors: [
    { label: "chaar", frame: cue.numeral + 6, note: "the big 4 whole at screen centre, the camera arriving at the package station" },
    { label: "litellm", frame: cue.label + 10, note: "the shipping box 'LiteLLM 1.107.0' on the conveyor with other boxes" },
    { label: "chupke", frame: cue.wormIn + 14, note: "the red worm-line slipping into the box seam" },
    { label: "chor", frame: cue.dollyStart + 8, note: "DOLLY-THROUGH: the box fills the screen and blurs as the camera passes through" },
    { label: "cloud", frame: cue.keyCloud + 14, note: "inside: the CLOUD KEY floating up" },
    { label: "keys", frame: cue.pull1 + 8, note: "inside: keys pulled by a red dotted line out of a hidden hatch" },
  ],
  cam: [
    key(cue.flyStart, onStation(5, 0.77), "HOLD"),
    key(cue.flyEnd, onStation(4, 1.0), "FLY-TO", { dip: 0.35 }),
    key(cue.dollyStart, onStation(4, 1.0), "HOLD"),
    key(cue.dollyEnd, { x: boxWorld.x, y: boxWorld.y, s: 8.0 }, "DOLLY-THROUGH", { ease: "swing", settle: false }),
  ],
  blur: [],
};

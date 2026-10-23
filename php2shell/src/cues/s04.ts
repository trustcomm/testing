import { fw, w, wp } from "../anchors";
import type { SfxEvent } from "../sfx";
import type { SceneCues } from "./types";

// S4 "Inhe pakda Wiz, Calif aur OpenAI ke researchers ne."
const W4 = (bare: string, nth = 0) => fw(w("S4", bare, nth));
const fInhe = W4("inhe"), fPakda = W4("pakda"), fWiz = W4("wiz"), fCalif = W4("calif"), fAur = W4("aur"), fOpenai = W4("openai"), fRes = W4("researchers"), fNe = W4("ne");
const end = fw(wp(10, "ab"));                      // S5's first word: S4 must be dust by then
const cue = {
  lensStart: fInhe - 5,                            // a magnifying glass sweeps across the PHP panel ...
  focus: fPakda - 1,                               // ... decelerates into focus (the swoosh ends with its tiny lock) ...
  caught: fPakda,                                  // ... and stops on "pakda": the bugs freeze inside the lens (caught)
  tierOut: fInhe + 2,                              // the Website -> WordPress tier leaves (blur + fade) to make room for the names
  label: fPakda + 3,                               // "Found by researchers" rises
  chip1: fWiz, chip2: fCalif, chip3: fOpenai,      // the three chips spring in EXACTLY on each name (the spring starts 4 frames before)
  sparkle: fPakda + 1,                             // a small sparkle on the lens
  dissolve: end - 18,                              // everything dissolves to dust over the last 18 frames (S5 starts from dust)
  end,
};
const sfx: SfxEvent[] = [
  { id: "s4.focus", frame: cue.focus, sfx: "focus_swoosh", gainDb: -5, note: "the lens sweeps across the panel and locks into focus (swoosh ends with its tiny lock)" },
  { id: "s4.caught", frame: cue.caught, sfx: "caught_click", gainDb: -4, pan: 0, note: "'pakda': the lens stops, the bugs freeze inside it" },
  { id: "s4.sparkle", frame: cue.sparkle + 2, sfx: "tick", gainDb: -19, note: "a small sparkle on the lens" },
  { id: "s4.wiz", frame: fWiz, sfx: "chip_tick", pitch: 0, pan: -0.45, gainDb: -6, note: "chip 'Wiz' springs in" },
  { id: "s4.calif", frame: fCalif, sfx: "chip_tick", pitch: 4, pan: 0, gainDb: -6, note: "chip 'Calif' springs in" },
  { id: "s4.openai", frame: fOpenai, sfx: "chip_tick", pitch: 9, pan: 0.45, gainDb: -6, note: "chip 'OpenAI' springs in" },
  { id: "s4.dust", frame: cue.dissolve + 8, sfx: "whoosh", gainDb: -17, note: "everything dissolves to dust, drifting up and out" },
];
const A = (label: string, frame: number, expect: string) => ({ label, frame, expect });
export const cues: SceneCues<typeof cue> = {
  cue, sfx, hero: fRes + 5,
  anchors: [
    A("Inhe", fInhe + 4, "S3's stack, identical; a magnifying glass is sweeping in across the PHP panel, the top tier is leaving"),
    A("pakda", fPakda + 2, "the lens has stopped over the two bugs: they are frozen inside it (magnified, in brackets); a sparkle"),
    A("Wiz", fWiz + 4, "'Found by researchers' above; the chip 'Wiz' springs in"),
    A("Calif", fCalif + 4, "'Wiz' and 'Calif' are in"),
    A("aur", fAur + 3, "two chips held; the OpenAI chip is just starting to spring in (anticipation)"),
    A("OpenAI", fOpenai + 4, "all three chips: Wiz, Calif, OpenAI"),
    A("researchers", fRes + 4, "everything formed: label, three chips, panel, lens with the caught bugs (hold)"),
    A("ne", fNe + 5, "everything is dissolving to dust, drifting up and out"),
    A("end", end - 3, "almost all dust; S5 takes over"),
  ],
};

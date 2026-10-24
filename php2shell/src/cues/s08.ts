import { fw, w } from "../anchors";
import type { SfxEvent } from "../sfx";
import type { SceneCues } from "./types";

// S8 "Aur kuch cases mein, hacker bina login kiye... poore server pe control le sakta hai."
const fAur = fw(w("S8", "aur")), fCases = fw(w("S8", "cases")), fMein = fw(w("S8", "mein")), fHacker = fw(w("S8", "hacker")),
  fBina = fw(w("S8", "bina")), fLogin = fw(w("S8", "login")), fKiye = fw(w("S8", "kiye")), fPoore = fw(w("S8", "poore")), fServer = fw(w("S8", "server")),
  fPe = fw(w("S8", "pe")), fControl = fw(w("S8", "control")), fLe = fw(w("S8", "le")), fSakta = fw(w("S8", "sakta")), fHai = fw(w("S8", "hai"));

const cue = {
  boxIn: fCases - 2,                       // the login box writes on (18 frames) while "cases mein" is said: the hall is guarded
  walkStart: fHacker - 8,                  // the hooded figure writes on at the left edge (12 frames) and sets off: first step 8 frames before "hacker"
  figDone: fHacker + 4,
  walkEnd: fServer + 2,                    // he reaches the right-hand end of the hall and stops
  listen: fBina - 4,                       // "bina": the login box is waiting for input (carets blink)
  pass: fKiye,                             // he is under the box on "kiye"
  strike: fKiye,                           // "bina login kiye": the red strike-through wipes across the box (denied)
  boxOut: fPoore - 4,                      // the box leaves before the wave
  turnStart: fServer + 6, turnEnd: fControl - 4,   // he turns to face the hall
  hit: fControl,                           // "control": big hit, red wave (bottom to top), micro-shake, push-in
  waveFrames: 20,                          // the wave rises from the floor of the hall to its top
  cursor: fControl + 6,                    // the red cursor pops in, then clicks
  click: fControl + 14,
  dissolve: fHai + 2, dissolveEnd: fHai + 26,   // the red hall breaks into dust while S9's gauge begins
  headA: fBina, headB: fLogin, headOut: fKiye + 5, headC: fPoore - 2, headD: fControl,   // kinetic type: "No login." then "Full control."
};

// the walk: the figure's x on frame f (a quick start, a steady sneak, a soft stop), his speed (px per frame) and the phase of his legs (one step = `step` px: no sliding feet)
export const FLOOR_Y = 1300, WALK = { x0: 130, x1: 800, step: 130 };
const trapezoid = (t: number, ta: number, td: number) => {            // 0..1 position: a short ease-in (ta), constant speed, a longer ease-out (td)
  const u = Math.min(1, Math.max(0, t)), v = 1 / (1 - ta / 2 - td / 2);
  if (u < ta) return (v * u * u) / (2 * ta);
  if (u < 1 - td) return v * (u - ta / 2);
  const r = 1 - u;
  return 1 - (v * r * r) / (2 * td);
};
export const walkX = (f: number) => WALK.x0 + (WALK.x1 - WALK.x0) * trapezoid((f - cue.walkStart) / (cue.walkEnd - cue.walkStart), 0.1, 0.22);
export const walkSpeed = (f: number) => Math.abs(walkX(f + 0.5) - walkX(f - 0.5));
export const walkPhase = (f: number) => (Math.PI * (walkX(f) - WALK.x0)) / WALK.step;
// the quiet sub pulses ride on every second footfall and follow him across the stereo field
const pulse = (k: number, frame: number): SfxEvent => {
  const x = Math.round(walkX(frame));
  return { id: `s8.pulse${k}`, frame, sfx: "stealth_pulse", gainDb: -11 + (k === 3 ? 2 : 0), pan: Math.max(-0.6, Math.min(0.6, ((x - 540) / 540) * 0.6)), pitch: -k, note: `sneaking: footfall ${k} (the figure is at x~${x})` };
};
const sfx: SfxEvent[] = [
  { id: "s8.box", frame: cue.boxIn + 2, sfx: "ui_click", gainDb: -15, note: "the login box writes on in front of the racks" },
  pulse(0, cue.walkStart + 2), pulse(1, cue.walkStart + 24), pulse(2, cue.walkStart + 46), pulse(3, cue.walkEnd + 2),
  { id: "s8.denied", frame: cue.strike, sfx: "denied_buzz", gainDb: -4, note: "kiye: the red strike-through wipes across the login box" },
  { id: "s8.hit", frame: cue.hit, sfx: "big_hit", gainDb: 0, note: "control: big low hit, micro-shake, push-in" },
  { id: "s8.zap", frame: cue.hit, sfx: "zap_sweep", gainDb: -10, frames: 15, note: "control: the red wave rises through every rack, bottom to top" },
  { id: "s8.click", frame: cue.click, sfx: "ui_click", gainDb: -12, pitch: 3, note: "the cursor clicks: a ring leaves its tip" },
];

const A = (label: string, frame: number, expect: string) => ({ label, frame, expect });
export const cues: SceneCues<typeof cue> = {
  cue, sfx, hero: fControl + 20,
  anchors: [
    A("Aur", fAur + 3, "the six white racks of the server hall, exactly as S7 left them (still, white)"),
    A("cases", fCases + 4, "the login box (USERNAME / PASSWORD) is writing on in front of the racks"),
    A("mein", fMein + 4, "the login box stands in front of the racks, waiting"),
    A("hacker", fHacker + 4, "a red hooded figure has appeared at the left edge and is walking in"),
    A("bina", fBina + 4, "the figure walks along the floor toward the login box; its carets blink; 'No' rises up top"),
    A("login", fLogin + 4, "the figure is just before the box; 'No login.'"),
    A("kiye", fKiye + 4, "the red strike-through wipes across the dimming login box as he passes under it"),
    A("poore", fPoore + 4, "the login box is gone; he keeps walking; 'Full'"),
    A("server", fServer + 4, "he stops at the right-hand end of the white hall and turns toward it"),
    A("pe", fPe + 2, "he faces the hall; tension before the hit"),
    A("control", fControl + 5, "the red wave is rising through every rack, bottom to top, with the micro-shake and the push-in; 'control.' lands"),
    A("le", fLe + 6, "every rack is red; the red cursor pops in; he raises an arm"),
    A("sakta", fSakta + 4, "red hall, red cursor clicking; held"),
    A("hai", fHai + 4, "the red hall begins to break into dust"),
  ],
  pushes: [{ frame: cue.hit - 6, frames: 14, extra: 0.03 }],
  shakes: [cue.hit],
};

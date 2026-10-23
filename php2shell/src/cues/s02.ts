import { fw, w } from "../anchors";
import type { SfxEvent } from "../sfx";
import type { SceneCues } from "./types";

// S2 "Aur agar aapki website WordPress pe hai... toh yeh kahani aapki bhi hai."
const W2 = (bare: string, nth = 0) => fw(w("S2", bare, nth));
const fAur = W2("aur"), fAgar = W2("agar"), fAapki = W2("aapki", 0), fWebsite = W2("website"), fWP = W2("wordpress"), fPe = W2("pe"), fHai = W2("hai", 0),
  fToh = W2("toh"), fYeh = W2("yeh"), fKahani = W2("kahani"), fAapki2 = W2("aapki", 1), fBhi = W2("bhi"), fHai2 = W2("hai", 1);
const hit1 = fw(w("S1", "udd"));          // S1's alarm hit: the globe's red glow keeps decaying from it
const cue = {
  s1Hit: hit1,                           // (boundary contract with S1: alarmGlow = exp(-(f - hit) / 14))
  dollyStart: fAur - 1,                  // the globe, exactly as S1 leaves it, holds until "Aur", then zooms past the camera
  dollyEnd: fAapki + 4,                  // ... gone through the lens just after the first "aapki"
  whoosh: fAapki - 2,                    // the peak of the whoosh: the globe passes the camera
  winStart: fAapki - 6,                  // ONE browser window writes on while the globe rushes past
  click: fAapki,                         // "aapki": the window is there (UI click)
  type: fAapki + 2,                      // the address bar types "aapki-website.com" (30 chars/s) across "aapki website"
  pill: fWP,                             // the "WordPress" pill springs in ON the word (the spring starts 4 frames before)
  pushStart: fAapki2 - 7,                // the window slides close to the camera ...
  push: fAapki2,                         // ... the heartbeat lands on the second "aapki": one soft red outline pulses around it
  pushEnd: fAapki2 + 18,                 // ... and holds still (S3 starts from exactly this pose)
};
const sfx: SfxEvent[] = [
  { id: "s2.whoosh", frame: cue.whoosh, sfx: "whoosh_through", gainDb: -3, note: "the globe zooms past the camera (dolly through)" },
  { id: "s2.click", frame: cue.click, sfx: "ui_click", gainDb: -5, note: "the browser window is there (address bar writes on)" },
  { id: "s2.pill", frame: fWP, sfx: "pop", gainDb: -14, note: "the WordPress pill springs in on the word" },
  { id: "s2.heart", frame: cue.push, sfx: "heartbeat", gainDb: -2, note: "second 'aapki': push-in + one red outline pulse" },
];
const A = (label: string, frame: number, expect: string) => ({ label, frame, expect });
export const cues: SceneCues<typeof cue> = {
  cue, sfx, hero: cue.pushEnd + 3,
  anchors: [
    A("Aur", fAur + 2, "S1's globe, identical (red servers, red glow), starting to swell: the dolly through begins"),
    A("agar", fAgar + 5, "the globe is rushing past the camera, huge and fading"),
    A("aapki", fAapki + 4, "the globe has gone through; ONE browser window outline is writing on in the centre"),
    A("website", fWebsite + 4, "the window is drawn; the address bar is typing aapki-website.com"),
    A("WordPress", fWP + 4, "the address reads aapki-website.com; the WORDPRESS pill springs in under the window"),
    A("hai", fHai + 3, "held: window + WORDPRESS pill, stillness"),
    A("toh", fToh + 3, "held (the page wireframe has loaded)"),
    A("kahani", fKahani + 4, "held, stillness before the beat"),
    A("aapki (2nd)", fAapki2 + 3, "the window slides towards the camera; a soft red outline pulses around it (heartbeat)"),
    A("bhi", fBhi + 3, "the window is close; the red outline pulses back (lub-dub)"),
    A("hai (end)", fHai2 + 4, "the window close to the camera, still (S3 starts from here)"),
  ],
  pushes: [{ frame: fAapki2 - 4, frames: 18, extra: 0.03 }],
};

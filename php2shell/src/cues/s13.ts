import { fw, totalFrames, w } from "../anchors";
import type { SfxEvent } from "../sfx";
import type { SceneCues } from "./types";

// S13 "Apni website check karne ka simple tareeka chahiye? Comment karo PHP, main bhej dunga. Aur yeh video us dost ko bhejo... jiski website hai."
const W = (b: string, n = 0) => w("S13", b, n);
const fApni = fw(W("apni")), fWebsite = fw(W("website")), fCheck = fw(W("check")), fKarne = fw(W("karne")), fKa = fw(W("ka")), fTareeka = fw(W("tareeka")), fChahiye = fw(W("chahiye")),
  fComment = fw(W("comment")), fPhp = fw(W("php")), fBhej = fw(W("bhej")), fVideo = fw(W("video")), fUs = fw(W("us")), fDost = fw(W("dost")), fBhejo = fw(W("bhejo")),
  fJiski = fw(W("jiski")), fWebsite2 = fw(W("website", 1)), fHai = fw(W("hai"));

const cue = {
  open: fApni,                                   // the scene opens: the pluck resolves; the (empty) pill outline starts to write on
  pillOutline: fApni + 4,
  labelWords: [fWebsite, fCheck, fKarne, fKa, fTareeka],   // "Website check karne ka tareeka": each word rises as it is spoken
  tareeka: fTareeka,                             // its green underline wipes on "tareeka"
  envelope: fChahiye - 4,                        // the line envelope writes on, after "tareeka"
  pillIn: fComment,                              // "Comment": the pill fills white and pops; "Comment" appears in it
  php: fPhp,                                     // "PHP": the word pops into the pill (second soft pop)
  pulse: fPhp + 12,                              // from here the pill pulses gently
  bhej: fBhej,                                   // "bhej dunga": the envelope next to the label hops
  avatarIn: fVideo - 2,                          // the friend avatar writes on while "yeh video" is said
  dost: fDost,                                   // "dost": the DOST pill pops under the avatar
  flightStart: fUs - 2,                          // "us dost ko bhejo": the paper plane leaves the pill ...
  land: fBhejo,                                  // ... and lands on the friend on "bhejo"
  windowIn: fJiski - 3,                          // "jiski website": the browser window writes on above his head ...
  windowHit: fWebsite2,                          // ... its address pops on "website"
  handle: fWebsite2,                             // "@baqur.ai" rises
  sources: fWebsite2 + 2,                        // the sources line rises
  chime: fHai,                                   // the last word: the final chime
  endCard: totalFrames() - 24,                   // the full end card is on screen from here to the last frame (>= 0.8 s)
};
/** frames the complete end card is on screen at the end of the film (must be >= 24 = 0.8 s) */
export const END_CARD_FRAMES = totalFrames() - cue.endCard;

const sfx: SfxEvent[] = [
  { id: "s13.pluck", frame: cue.open, sfx: "pluck_resolve", gainDb: -7, note: "the scene opens: an upbeat pluck resolves" },
  { id: "s13.envelope", frame: cue.envelope + 6, sfx: "tick", gainDb: -16, pitch: 4, note: "the little envelope icon writes on" },
  { id: "s13.pill", frame: cue.pillIn, sfx: "pop", gainDb: -5, note: "'Comment': the pill lands" },
  { id: "s13.php", frame: cue.php, sfx: "pop", gainDb: -12, pitch: 4, note: "'PHP' pops into the pill" },
  { id: "s13.hop", frame: cue.bhej, sfx: "tick", gainDb: -15, pitch: 7, note: "'bhej dunga': the envelope hops" },
  { id: "s13.avatar", frame: cue.avatarIn + 8, sfx: "ui_click", gainDb: -16, pan: 0.3, note: "the friend avatar writes on" },
  { id: "s13.dost", frame: cue.dost, sfx: "glass_tap", gainDb: -12, pan: 0.3, note: "'dost': the DOST pill" },
  { id: "s13.plane", frame: cue.flightStart, sfx: "plane_swish", gainDb: -7, note: "the paper plane flies from the pill to the friend (the sound sweeps left to right)" },
  { id: "s13.land", frame: cue.land, sfx: "chip_tick", gainDb: -9, pan: 0.3, pitch: 7, note: "'bhejo': the plane lands on the friend, a ripple" },
  { id: "s13.window", frame: cue.windowHit, sfx: "glass_tap", gainDb: -11, pan: 0.3, pitch: 2, note: "'website': the browser window above his head" },
  { id: "s13.chime", frame: cue.chime, sfx: "final_chime", gainDb: -5, note: "the last word: @baqur.ai glows; the gentle final chime" },
];

const A = (label: string, frame: number, expect: string) => ({ label, frame, expect });
export const cues: SceneCues<typeof cue> = {
  cue, sfx, hero: totalFrames() - 6,
  anchors: [
    A("apni", fApni + 4, "S12's cards are fading; the empty pill outline starts writing on"),
    A("website", fWebsite + 4, "the label 'Website' rises above the pill outline"),
    A("tareeka", fTareeka + 5, "'Website check karne ka tareeka' with a green underline on 'tareeka'; the pill outline waits, empty"),
    A("chahiye", fChahiye + 5, "the line envelope writes on after the label"),
    A("comment", fComment + 4, "the white pill 'Comment' has popped in"),
    A("php", fPhp + 5, "the pill reads 'Comment PHP' (PHP popping); pill pulses gently"),
    A("bhej", fBhej + 3, "the envelope next to the label hops"),
    A("video", fVideo + 8, "the friend avatar is writing on"),
    A("us", fUs + 3, "the paper plane has left the pill, a dotted trail behind it"),
    A("dost", fDost + 3, "the plane flies on toward the friend; the DOST pill pops"),
    A("bhejo", fBhejo + 3, "the plane has landed on the friend; a ripple"),
    A("jiski", fJiski + 5, "the browser window writes on above the friend's head"),
    A("website", fWebsite2 + 4, "the window's address 'website.com' pops; @baqur.ai rises"),
    A("hai", fHai + 4, "@baqur.ai and the sources line are in; the chime lands"),
    A("end", totalFrames() - 4, "the full end card, captions gone: pill, label + envelope, friend + window, @baqur.ai, the sources line"),
  ],
  pushes: [{ frame: fComment - 6, frames: 22, extra: 0.015 }],
};

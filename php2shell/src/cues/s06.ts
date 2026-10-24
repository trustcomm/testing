import { fw, w } from "../anchors";
import type { SfxEvent } from "../sfx";
import type { SceneCues } from "./types";

// S6 "Socho ek tiffin wapas aata hai... aur uske andar pichhle ghar ki chaabi reh gayi. Agla aadmi dabba kholta hai... aur chaabi uske haath mein."
const f = (bare: string, nth = 0) => fw(w("S6", bare, nth));
const fSocho = f("socho"), fTiffin = f("tiffin"), fWapas = f("wapas"), fPichhle = f("pichhle"), fChaabi = f("chaabi", 0), fReh = f("reh"), fGayi = f("gayi"),
  fAgla = f("agla"), fKholta = f("kholta"), fChaabi2 = f("chaabi", 1), fUske = f("uske", 1), fHaath = f("haath"), fMein = f("mein");

const cue = {
  fade: fSocho,                          // "Socho": every tiffin but one dims (ONE tiffin)
  camIn: fSocho + 8, camInEnd: fWapas + 3,   // the camera leaves the wide shot and zooms onto the tiffin on house 5
  hopStart: fWapas,                      // "wapas aata hai": it floats back along the arc, towards house 4 (slow, the camera follows)
  hopEnd: fAgla + 15,                    // it settles on house 4's roof as "Agla aadmi" is said
  pill: fPichhle,                        // the red pill "PICHHLE GHAR KI CHAABI" springs in on "pichhle"
  xray: fChaabi - 6,                     // the X-ray scan starts 6 frames early ...
  chaabi: fChaabi,                       // ... "chaabi": the lid opens slightly, the red key is revealed (key jingle)
  personOn: fAgla,                       // "Agla aadmi": a second person writes on, on house 4's roof
  reach: fKholta - 8,                    // his hand reaches for the lid
  lidLift: fKholta,                      // "kholta": he lifts the lid (clink)
  keyRise: fChaabi2 - 4,                 // "chaabi uske haath mein": the red key floats up ...
  keyHand: fHaath,                       // ... and lands in his hand on "haath": eyes widen, red "!" (uh-oh)
  hold: fMein + 3,                       // stillness until the pull-back of S7
};

const sfx: SfxEvent[] = [
  { id: "s6.pluck", frame: fTiffin, sfx: "pluck", pitch: 7, gainDb: -16, note: "tiffin: the curious motif answers (one note)" },
  { id: "s6.rattle1", frame: cue.hopStart, sfx: "tiffin_rattle", gainDb: -13, pan: 0.3, note: "the tiffin lifts off house 5 and starts its trip back" },
  { id: "s6.rattle2", frame: cue.hopStart + 34, sfx: "tiffin_rattle", gainDb: -19, pan: 0.2, note: "the trip continues (softer)" },
  { id: "s6.swipe", frame: cue.pill, sfx: "swipe", gainDb: -17, pan: 0, note: "the red pill springs in" },
  { id: "s6.key", frame: cue.chaabi, sfx: "key_jingle", gainDb: -4, pan: 0, note: "chaabi: the lid opens slightly, X-ray: a red key inside" },
  { id: "s6.land", frame: cue.hopEnd, sfx: "tok", pitch: -2, gainDb: -12, pan: -0.2, note: "the tiffin lands on house 4's roof" },
  { id: "s6.clink", frame: cue.lidLift, sfx: "lid_clink", gainDb: -5, pan: -0.1, note: "kholta: the second person lifts the lid" },
  { id: "s6.float", frame: cue.keyHand - 4, sfx: "whoosh", gainDb: -22, pan: -0.1, note: "the red key floats up (peak just before it lands)" },
  { id: "s6.uhoh", frame: cue.keyHand, sfx: "uhoh_note", gainDb: -6, pan: 0, note: "haath: the key lands in his hand, eyes widen, red !" },
];
const A = (label: string, frame: number, expect: string) => ({ label, frame, expect });
export const cues: SceneCues<typeof cue> = {
  cue, sfx, hero: fHaath + 12,
  anchors: [
    A("socho", fSocho + 5, "S5's wide world (six houses, tiffins); every tiffin but the one on house 5 is dimming"),
    A("tiffin", fTiffin + 4, "the camera is zooming onto the one tiffin resting on house 5"),
    A("wapas", fWapas + 5, "close-up: the tiffin has lifted off and floats back along the dotted arc, houses sliding past"),
    A("pichhle", fPichhle + 4, "close-up on the floating tiffin, the red pill PICHHLE GHAR KI CHAABI has sprung in"),
    A("chaabi", fChaabi + 4, "the tiffin's lid opens slightly; X-ray: a red key outline inside; the word CHAABI pops with a red underline"),
    A("gayi", fGayi + 3, "the key is clear inside the tin (hold)"),
    A("agla", fAgla + 4, "the tiffin has reached house 4; a second person is writing on beside it"),
    A("kholta", fKholta + 4, "he lifts the lid: it swings up, the red key is visible in the open tin"),
    A("chaabi2", fChaabi2 + 4, "the red key lifts out of the tin, floating up"),
    A("haath", fHaath + 3, "the key is in his hand, his eyes are wide, a red ! pops above his head"),
    A("hold", fMein + 3, "held: red key in hand, wide eyes, the red !"),
  ],
  pushes: [{ frame: fChaabi2 - 6, frames: 30, extra: 0.03 }],
};

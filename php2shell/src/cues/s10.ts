import { fw, w } from "../anchors";
import type { SfxEvent } from "../sfx";
import type { SceneCues } from "./types";

// S10, THE TRUST TURN. "Lekin ab dar nahi, sach suniye. Abhi tak kisi bade hack ki confirm khabar nahi hai. Kuch companies ne safety ke liye services band ki. Aur fix aa chuka hai."
const fLekin = fw(w("S10", "lekin")), fAb = fw(w("S10", "ab")), fDar = fw(w("S10", "dar")), fNahi = fw(w("S10", "nahi")), fSach = fw(w("S10", "sach")), fSuniye = fw(w("S10", "suniye")),
  fAbhi = fw(w("S10", "abhi")), fKisi = fw(w("S10", "kisi")), fHack = fw(w("S10", "hack")), fConfirm = fw(w("S10", "confirm")), fKhabar = fw(w("S10", "khabar")),
  fKuch = fw(w("S10", "kuch")), fCompanies = fw(w("S10", "companies")), fSafety = fw(w("S10", "safety")), fServices = fw(w("S10", "services")), fBand = fw(w("S10", "band")),
  fAur = fw(w("S10", "aur")), fFix = fw(w("S10", "fix")), fAa = fw(w("S10", "aa")), fChuka = fw(w("S10", "chuka")), fHai = fw(w("S10", "hai", 1));

const cue = {
  lekin: fLekin,                  // S9's red desaturates and fades (its own cue in s09.ts); the screen is clean black, the music drops (mixer, MUSIC.drop)
  gather: fDar,                   // "dar nahi": a few white dots begin to gather in the dark
  sach: fSach,                    // "sach": the headline "Sach." is whole, white; the single piano note
  underline: fSach + 3, underlineFrames: 12,    // the GREEN underline wipes under it
  cards: [fAbhi, fKuch, fAur],    // one glass fact card on each sentence
  keys: [fConfirm, fSafety, fFix],   // key word of each card: green underline wipe when it is spoken
  fix: fFix,                      // "fix": the check of card 3 writes on, the resolved chord
  exit: fHai + 4,                 // the content drifts up while S11 comes in
};

const sfx: SfxEvent[] = [
  { id: "s10.piano", frame: cue.sach, sfx: "piano_note", gainDb: -9, pitch: 7, note: "sach: the single soft piano note: the only sound here" },
  { id: "s10.tap1", frame: cue.cards[0], sfx: "glass_tap", gainDb: -8, pitch: 0, note: "card 1 lands: No confirmed major breach (as of 21 Oct)" },
  { id: "s10.tap2", frame: cue.cards[1], sfx: "glass_tap", gainDb: -8, pitch: 2, note: "card 2 lands: Some services offline as a precaution" },
  { id: "s10.tap3", frame: cue.cards[2], sfx: "glass_tap", gainDb: -8, pitch: 4, note: "card 3 lands: Fix available" },
  { id: "s10.chord", frame: cue.fix, sfx: "chord_resolved", gainDb: -11, note: "fix aa chuka hai: the green check writes on, the warm resolved chord" },
];

const A = (label: string, frame: number, expect: string) => ({ label, frame, expect });
export const cues: SceneCues<typeof cue> = {
  cue, sfx, hero: fHai + 2,
  anchors: [
    A("Lekin", fLekin + 3, "the S9 picture is a fading grey ghost; clean black, the background warming"),
    A("ab", fAb + 3, "clean black, nothing on screen (the pause)"),
    A("dar", fDar + 3, "a few faint white dots begin to gather at the centre"),
    A("nahi", fNahi + 3, "the dots are flying together into the shape of the headline"),
    A("sach", fSach + 3, "'Sach.' in white Inter Display at its place (piano note); the green underline starts to wipe"),
    A("suniye", fSuniye + 4, "'Sach.' white with the green underline wiped across; nothing else (held)"),
    A("Abhi", fAbhi + 4, "card 1 (glass) rises in under the headline: No confirmed major breach (as of 21 Oct)"),
    A("kisi", fKisi + 3, "card 1 in place, its border glowing green"),
    A("hack", fHack + 3, "card 1 held"),
    A("confirm", fConfirm + 4, "'confirmed' gets its green underline wipe"),
    A("khabar", fKhabar + 3, "card 1 with the underlined 'confirmed' (held)"),
    A("Kuch", fKuch + 4, "card 2 rises in: Some services offline as a precaution"),
    A("companies", fCompanies + 3, "card 2 in place, glowing green; card 1 settled"),
    A("safety", fSafety + 4, "'precaution' gets its green underline wipe"),
    A("services", fServices + 3, "two cards stacked under the headline"),
    A("band", fBand + 3, "two cards held"),
    A("Aur", fAur + 4, "card 3 rises in: Fix available"),
    A("fix", fFix + 5, "the green check of card 3 is writing on, the chord blooms; 'Fix' underlined green"),
    A("aa", fAa + 3, "the green check completes in its circle"),
    A("chuka", fChuka + 3, "all three cards; card 3 glowing green with its check"),
    A("hai", fHai + 4, "the finished picture: 'Sach.' with its green underline and the three fact cards (held)"),
  ],
  pushes: [{ frame: cue.sach - 6, frames: 16, extra: 0.025 }, { frame: cue.fix - 6, frames: 18, extra: 0.02 }],
};

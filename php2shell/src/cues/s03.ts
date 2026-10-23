import { fw, w } from "../anchors";
import { rand } from "../motion";
import type { SfxEvent } from "../sfx";
import type { SceneCues } from "./types";

// S3 "WordPress chalta hai PHP pe. Aur PHP ke andar mile do aise bug... jo das saal se chupchaap baithe the."
const W3 = (bare: string, nth = 0) => fw(w("S3", bare, nth));
const fWP = W3("wordpress"), fChalta = W3("chalta"), fHai = W3("hai"), fPhp0 = W3("php", 0), fPe = W3("pe"), fAur = W3("aur"), fPhp1 = W3("php", 1), fAndar = W3("andar"),
  fMile = W3("mile"), fDo = W3("do"), fAise = W3("aise"), fBug = W3("bug"), fJo = W3("jo"), fDas = W3("das"), fSaal = W3("saal"), fSe = W3("se"), fChup = W3("chupchaap"),
  fBaithe = W3("baithe"), fThe = W3("the");
export const CVE_TEXT = ["CVE-2026-109618", "CVE-2026-109619"] as const;
export const TYPE_CPS = 26;                       // the CVE labels type at 26 chars/s
const cue = {
  liftStart: fWP + 2,                              // the window lifts away like an X-ray (it turns to glass, slides up and settles as the top of the stack) ...
  wpPop: fWP,                                      // ... while the WORDPRESS pill pops on its word
  liftEnd: fChalta,                                // the layer beneath is fully revealed on "chalta" (peak of the layer-sweep sound)
  scanStart: fWP + 4,                              // the glass PHP panel scans in beneath (a thin bright X-ray line sweeps down)
  connect: fChalta,                                // the connector line WordPress -> PHP draws on across "chalta hai" ...
  connectEnd: fPhp0,                               // ... and lands on "PHP"
  php0: fPhp0,                                     // the big mono PHP rises into the panel and pops
  php1: fPhp1,                                     // "Aur PHP ke ...": PHP pops again
  glowStart: fAndar - 2, glowPeak: fDo,            // "andar": a red glow builds at the panel's lower corners
  bug1: fDo - 3, bug1End: fDo + 17,                // "do": the first bug crawls out of the lower-left corner
  bug2: fAise - 3, bug2End: fAise + 17,            // "aise": the second bug crawls out of the lower-right corner
  label1: fBug, label2: fBug + 4,                  // "bug": the CVE capsules write on ...
  type1: fBug + 6, type2: fBug + 10,               // ... and the labels type in (26 chars/s)
  cntIn: fDas - 6,                                 // "2016" rises
  roll: fDas - 2, rollEnd: fSaal,                  // "das saal": the right-hand number rolls 2016 -> 2026 (an odometer), dust trails behind it, and lands on "saal"
  web: fSaal + 2, webEnd: fThe,                    // the faint cobweb creeps across the panel's top-left corner (radials, then three arcs) until the idea ends
  settle: fThe,                                    // "baithe the": the reverse riser ends, the dust settles; stillness
};
const typedFrame = (at: number, i: number) => at + Math.ceil(((i + 1) * 30) / TYPE_CPS);
const keys: SfxEvent[] = [
  ...Array.from({ length: CVE_TEXT[0].length }, (_, i) => i).filter((i) => i % 2 === 0).map((i) => ({ id: `s3.k1.${i}`, frame: typedFrame(cue.type1, i), sfx: "key_click" as const, gainDb: -15, pan: -0.5, pitch: Math.round((rand(i, 31) - 0.5) * 5), seed: i, note: `label 1 types "${CVE_TEXT[0][i]}"` })),
  ...Array.from({ length: CVE_TEXT[1].length }, (_, i) => i).filter((i) => i % 2 === 0).map((i) => ({ id: `s3.k2.${i}`, frame: typedFrame(cue.type2, i), sfx: "key_click" as const, gainDb: -15, pan: 0.5, pitch: Math.round((rand(i, 32) - 0.5) * 5), seed: 40 + i, note: `label 2 types "${CVE_TEXT[1][i]}"` })),
];
const ticks: SfxEvent[] = Array.from({ length: 5 }, (_, k) => ({ id: `s3.tick${k}`, frame: cue.roll + 1 + 2 * k, sfx: "tick", gainDb: -21, note: "the counter rolls a year" }));
const sfx: SfxEvent[] = [
  { id: "s3.sweep", frame: cue.liftEnd, sfx: "layer_sweep", gainDb: -4, note: "the window lifts like an X-ray: the PHP layer is revealed (sound peaks here)" },
  { id: "s3.php", frame: fPhp0, sfx: "glass_tap", gainDb: -12, note: "the connector lands: big PHP appears in the glass panel" },
  { id: "s3.php2", frame: fPhp1, sfx: "glass_tap", gainDb: -18, pitch: -3, note: "PHP pops again" },
  { id: "s3.scuttle1", frame: fDo, sfx: "scuttle", gainDb: -8, pan: -0.65, note: "bug 1 crawls out of the lower-left corner" },
  { id: "s3.scuttle2", frame: fAise, sfx: "scuttle", gainDb: -8, pan: 0.65, seed: 3, note: "bug 2 crawls out of the lower-right corner" },
  ...keys,
  ...ticks,
  { id: "s3.riser", frame: fThe, sfx: "reverse_riser", gainDb: -9, note: "tape-like reverse riser under 'das saal se chupchaap baithe the': its END lands on 'the', where the idea ends" },
];
const A = (label: string, frame: number, expect: string) => ({ label, frame, expect });
export const cues: SceneCues<typeof cue> = {
  cue, sfx, hero: fThe + 2,
  anchors: [
    A("WordPress", fWP + 4, "S2's window (close) is starting to lift and turn to glass; the WORDPRESS pill pops"),
    A("chalta", fChalta + 4, "the window has lifted to the top of the stack; a glass panel is revealed beneath; the connector starts to draw"),
    A("hai", fHai + 3, "the connector line runs down from WORDPRESS towards the panel"),
    A("PHP", fPhp0 + 4, "the connector has landed; a big mono PHP rises into the glass panel"),
    A("pe", fPe + 2, "stack diagram: window -> WORDPRESS -> PHP (held)"),
    A("PHP (2)", fPhp1 + 4, "PHP pops again"),
    A("andar", fAndar + 4, "a red glow is building at the panel's lower corners"),
    A("mile", fMile + 3, "the glow is stronger; tension"),
    A("do", fDo + 5, "the first red bug is crawling out of the lower-left corner"),
    A("aise", fAise + 5, "bug 1 crawls on; the second bug emerges from the lower-right corner"),
    A("bug", fBug + 8, "both bugs are in place; both CVE capsules have written on and are typing"),
    A("jo", fJo + 9, "both CVE labels are typed (CVE-2026-109618, CVE-2026-109619); the bugs sit in place, idling"),
    A("das", fDas + 4, "a mono counter '2016' with an arrow; the right-hand number is rolling, dust trailing behind"),
    A("saal", fSaal + 3, "2016 -> 2026 has landed; the dust drifts"),
    A("se", fSe + 3, "the cobweb lines start to draw at the panel's top-left corner"),
    A("chupchaap", fChup + 4, "cobweb radials drawn, arcs creeping outwards; the bugs sit still"),
    A("baithe", fBaithe + 3, "the cobweb is nearly complete"),
    A("the", fThe + 3, "everything formed: stack, PHP, two bugs with CVEs, 2016 -> 2026, cobweb; stillness"),
  ],
  pushes: [{ frame: fDo - 6, frames: 16, extra: 0.03 }],
};

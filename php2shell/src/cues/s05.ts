import { fw, w } from "../anchors";
import type { SfxEvent } from "../sfx";
import type { SceneCues } from "./types";

// S5 "Ab samjho, hua kya. Mumbai ka dabbawala. Roz hazaaron tiffin, ek ghar se doosre ghar."
// The picture (src/components/b-world.tsx + scenes/S05.tsx) hangs on these frames; every one is a word of the voiceover.
const f = (bare: string, nth = 0) => fw(w("S5", bare, nth));
const fAb = f("ab"), fSamjho = f("samjho"), fHua = f("hua"), fKya = f("kya"), fMumbai = f("mumbai"), fDabba = f("dabbawala"), fRoz = f("roz"),
  fHaz = f("hazaaron"), fTiffin = f("tiffin"), fEk = f("ek"), fGhar1 = f("ghar", 0), fDoosre = f("doosre"), fGhar2 = f("ghar", 1);

const cue = {
  dustStart: fAb - 6,                    // S4's dust is still drifting away: new dots drift in from above
  dustDone: fSamjho + 24,                // the dots have reached their places (a dotted preview of the ground line and the figure)
  groundOn: fHua - 9, groundFrames: 20,  // the long ground line writes on, finishing on "kya"
  figureOn: fKya + 1, figureFrames: 30,  // the dabbawala writes on (legs, kurta, head, arms, tray), done just before "dabbawala"
  trayOn: fDabba - 12,                   // the three round tiffins on his tray pop on (2 frames... 3 apart)
  hit: fDabba,                           // "dabbawala": the cap fills white, the DABBAWALA pill springs in, the bicycle bell
  pullStart: fHaz - 6, pullEnd: fHaz - 6 + 38,   // "hazaaron": the camera pulls wide (ease-in-out)
  houseOn: fHaz + 6,                     // the six houses write on, from the middle outwards
  arcOn: fHaz + 2,                       // the dotted arcs write on, from the middle outwards
  tiffinPop: fTiffin,                    // "tiffin": a round tiffin pops onto every roof
  rippleEnd: fGhar2,                     // the last hop lands on "ghar"
};

/** one hop of a tiffin between two stations (0 = left edge, 1..6 = the houses, 7 = right edge): lift-off frame, flight length */
export interface Hop { s0: number; s1: number; lift: number; dur: number }
/**
 * "ek ghar se doosre ghar": a ripple. The right-most tiffin leaves first, every other one follows 5 frames later into the roof that was just vacated;
 * the last one comes in from the left edge and lands on the final "ghar". The long hop over the dabbawala's head (3 -> 4) lands on "doosre".
 */
const LAND = [0, 1, 2, 3, 4, 5, 6].map((j) => fGhar2 - 5 * j);        // landings: 6->7 is the earliest (fGhar2 - 30), 0->1 the last (fGhar2)
const DUR = (s0: number) => (s0 === 3 ? 16 : 12);
export const HOPS5: Hop[] = [6, 5, 4, 3, 2, 1, 0].map((s0, j) => ({ s0, s1: s0 + 1, lift: LAND[6 - j] - DUR(s0), dur: DUR(s0) }));
/** the landing frame of the hop that ends on station s1 (1..6) */
export const landOf = (s1: number) => HOPS5.find((h) => h.s1 === s1)!.lift + HOPS5.find((h) => h.s1 === s1)!.dur;

// a tiny seeded hash for the pitch variation of the toks (same numbers every render)
const hash = (i: number) => { let h = (Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(77, 0x85ebca6b)) >>> 0; h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0; h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0; return ((h ^ (h >>> 15)) >>> 0) / 4294967296; };
const HX = [135, 255, 375, 705, 825, 945];
const toks: SfxEvent[] = [1, 2, 3, 4, 5, 6].map((s1) => ({
  id: `s5.tok${s1}`, frame: landOf(s1), sfx: "tok", gainDb: -9, pitch: Math.round(-3 + 6 * hash(s1)), seed: s1, pan: ((HX[s1 - 1] - 540) / 540) * 0.5,
  note: `a tiffin lands on house ${s1}${s1 === 4 ? " (the long hop over the dabbawala, on \"doosre\")" : s1 === 1 ? " (the last one, on the final \"ghar\")" : ""}`,
}));
const sfx: SfxEvent[] = [
  // the curious pluck motif (E G A C5, then a step back to G): it starts here and answers itself in S6
  { id: "s5.pluck1", frame: fSamjho, sfx: "pluck", pitch: 4, gainDb: -14, note: "dots drift in: first note of the curious motif" },
  { id: "s5.pluck2", frame: fKya, sfx: "pluck", pitch: 7, gainDb: -14, note: "the ground line is complete" },
  { id: "s5.pluck3", frame: fMumbai, sfx: "pluck", pitch: 9, gainDb: -14, note: "the figure's head and cap are drawn" },
  { id: "s5.bell", frame: cue.hit, sfx: "bike_bell", gainDb: -7, note: "dabbawala: the cap fills white, the pill springs in" },
  { id: "s5.pluck4", frame: fHaz, sfx: "pluck", pitch: 12, gainDb: -14, note: "hazaaron: the camera pulls wide" },
  { id: "s5.whoosh", frame: cue.pullStart + 14, sfx: "whoosh", gainDb: -18, pan: 0, note: "the pull-wide (peak mid-move)" },
  { id: "s5.pluck5", frame: fTiffin, sfx: "pluck", pitch: 7, gainDb: -15, note: "tiffin: a round tiffin on every roof" },
  ...toks,
];
const A = (label: string, frame: number, expect: string) => ({ label, frame, expect });
export const cues: SceneCues<typeof cue> = {
  cue, sfx, hero: fGhar2 + 10,
  anchors: [
    A("ab", fAb + 4, "from S4's dust: new dots drift in from above toward where the ground line and the figure will be"),
    A("samjho", fSamjho + 8, "the dots are converging into a dotted preview of the standing figure and a long ground line; faint stars fade in"),
    A("kya", fKya + 3, "the ground line is drawn; the figure starts to write on (legs, kurta)"),
    A("mumbai", fMumbai + 4, "the dabbawala is nearly drawn: head, arms, tray; the white cap not yet filled"),
    A("dabbawala", cue.hit + 4, "the cap fills white, the tray of round tiffins, the DABBAWALA pill has sprung in under his feet"),
    A("roz", fRoz + 4, "stillness: the dabbawala with his tiffins, the camera has not moved yet"),
    A("hazaaron", fHaz + 8, "the camera is pulling wide: the first houses write on beside the figure"),
    A("tiffin", fTiffin + 4, "wide shot: six tiny houses, dotted arcs (a high one over his head), a tiffin popping onto every roof"),
    A("ek", fEk + 4, "the ripple has begun: the right-most tiffin hops off the screen along its dotted arc, the next one follows"),
    A("ghar", fGhar1 + 3, "tiffins are mid-hop along the arcs; one lands on a roof"),
    A("doosre", fDoosre + 3, "a tiffin has just landed on house 4 after the high hop over the dabbawala's head"),
    A("ghar2", fGhar2 + 3, "the last tiffin has landed on house 1: six houses, six tiffins at rest (hold)"),
  ],
};

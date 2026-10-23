import { fw, w } from "../anchors";
import type { SfxEvent } from "../sfx";
import type { SceneCues } from "./types";

// S9 "Isliye PHP ne isey 10 mein se 9.2 ki critical rating di. 21 October ko fix aaya... aur usi din attack ki koshishein bhi dikhne lagi."
const fIsliye = fw(w("S9", "isliye")), fPhp = fw(w("S9", "php")), fIsey = fw(w("S9", "isey")), f10 = fw(w("S9", "10")), fMein = fw(w("S9", "mein")), fSe = fw(w("S9", "se")),
  f92 = fw(w("S9", "9.2")), fKi = fw(w("S9", "ki")), fCritical = fw(w("S9", "critical")), fRating = fw(w("S9", "rating")),
  f21 = fw(w("S9", "21")), fOctober = fw(w("S9", "october")), fFix = fw(w("S9", "fix")), fAaya = fw(w("S9", "aaya")),
  fAttack = fw(w("S9", "attack")), fKoshishein = fw(w("S9", "koshishein")),
  fBhi = fw(w("S9", "bhi")), fDikhne = fw(w("S9", "dikhne")), fLagi = fw(w("S9", "lagi")), fLekin = fw(w("S10", "lekin"));

// ---- the needle: a damped spring (underdamped: a visible overshoot), 0 -> 9.2, released on "10 mein se". It swings through 9.2 (the number reads 9.2), overshoots to ~9.6 and the PEAK of that
// overshoot lands exactly on the word "9.2" (the hit: heavy clunk + micro-shake); it then rings back and settles on 9.2 while "nau point do" is said. Deterministic (closed form). ----
export const TARGET = 9.2;
export const SPRING9 = { zeta: 0.7, wn: 4.9 };                                   // damping ratio, natural frequency (rad/s)
const wd = SPRING9.wn * Math.sqrt(1 - SPRING9.zeta ** 2);
const tPeak = Math.PI / wd;                                                      // seconds from release to the top of the overshoot
export const swingStart = f92 - tPeak * 30;                                      // (fractional) frame the needle is released (6 frames before "10")
const step = (t: number) => (t <= 0 ? 0 : 1 - Math.exp(-SPRING9.zeta * SPRING9.wn * t) * (Math.cos(wd * t) + ((SPRING9.zeta * SPRING9.wn) / wd) * Math.sin(wd * t)));
/** the needle's value (0..10) on frame f (fractional frames allowed) */
export const needleAt = (f: number) => TARGET * step((f - swingStart) / 30);

// the ratchet: a tick every time the needle passes a whole number on its way up, and the half step 9.5 on the overshoot and on the way back (at least 2 frames apart)
const detents: { id: string; frame: number; n: number; gain: number }[] = [];
{
  let prev = 0;
  const marks: { id: string; n: number; frame: number; gain: number }[] = [];
  for (let g = Math.floor(swingStart); g < swingStart + 100; g += 0.25) {
    const v = needleAt(g);
    for (let n = 1; n <= 9; n++) if (prev < n && v >= n && !marks.some((m) => m.id === `${n}`)) marks.push({ id: `${n}`, n, frame: g, gain: n < 3 ? -12 : -9 });
    if (prev < 9.5 && v >= 9.5 && !marks.some((m) => m.id === "9.5u")) marks.push({ id: "9.5u", n: 9.5, frame: g, gain: -12 });
    if (prev > 9.5 && v <= 9.5 && !marks.some((m) => m.id === "9.5d")) marks.push({ id: "9.5d", n: 9.5, frame: g, gain: -12 });
    prev = v;
  }
  for (const m of marks) { const fr = Math.round(m.frame), last = detents[detents.length - 1]; detents.push({ id: m.id, n: m.n, frame: last && fr < last.frame + 2 ? last.frame + 2 : fr, gain: m.gain }); }
}

const cue = {
  gaugeIn: fIsliye - 8, arcFrames: 28,            // the arc and its ticks write on while "Isliye PHP ne isey" is said (the layer shows from 6 frames before "Isliye")
  f10,                                            // "10": the end of the scale lights up
  swing: Math.floor(swingStart),                  // the needle is released (physics)
  hit: f92,                                       // "9.2": the overshoot peaks on the word (clunk, micro-shake, the number pops); it then rings back and settles on 9.2
  critical: fCritical,                            // the red CRITICAL pill springs in
  shieldIn: f21 - 4,                              // "21": the green shield blinks in at the top-left of the gauge
  chipIn: fOctober - 4,                           // "October": the date chip FIX: 21 OCT
  fix: fFix,                                      // "fix": chime, the shield fills and its check writes on
  arrows: [fAttack, fKoshishein, fBhi, fDikhne],  // each arrow's impact on the shield (one on each word)
  flight: 9,
  desat: fLekin - 10,                             // red desaturates to grey over 10 frames, grey exactly on S10's "Lekin" (the scene layer's own blur + fade runs over the same frames)
};

const sfx: SfxEvent[] = [
  { id: "s9.arc", frame: cue.gaugeIn + 6, sfx: "whoosh", gainDb: -19, note: "the gauge arc writes on (from the dust of S8)" },
  ...detents.map((d) => ({ id: `s9.tick${d.id}`, frame: d.frame, sfx: "ratchet_tick" as const, pitch: d.n * 0.5 - 2, gainDb: d.gain, pan: 0, note: `ratchet: the needle passes ${d.n}` })),
  { id: "s9.clunk", frame: cue.hit, sfx: "clunk", gainDb: 0, note: "9.2: the needle peaks past 9.2: heavy clunk, micro-shake, the number pops" },
  { id: "s9.critical", frame: cue.critical, sfx: "pop", gainDb: -12, pitch: -5, note: "the red CRITICAL pill springs in" },
  { id: "s9.chip", frame: cue.chipIn + 3, sfx: "chip_tick", gainDb: -13, pitch: 4, pan: -0.5, note: "the date chip FIX: 21 OCT" },
  { id: "s9.chime", frame: cue.fix, sfx: "chime_pos", gainDb: -4, pan: -0.4, note: "fix: the green shield fills, its check writes on" },
  ...cue.arrows.map((fr, k) => ({ id: `s9.ping${k}`, frame: fr, sfx: "ping_impact" as const, pitch: [0, 3, -2, 5][k], gainDb: -10, pan: -0.5, note: `attack arrow ${k + 1} bounces off the shield` })),
];

const A = (label: string, frame: number, expect: string) => ({ label, frame, expect });
export const cues: SceneCues<typeof cue> = {
  cue, sfx, hero: fLagi + 2,
  anchors: [
    A("Isliye", fIsliye + 4, "S8's red hall has gone; the gauge's thin white arc is writing on"),
    A("PHP", fPhp + 4, "the arc is complete; ticks and the 0 / 5 / 10 labels write on"),
    A("isey", fIsey + 4, "the empty gauge: needle lying at 0, the scale ready"),
    A("10", f10 + 4, "the needle (released 6 frames before '10') is sweeping up; the 10 label pops; the number counts up"),
    A("mein", fMein + 3, "the needle is sweeping up through 8, the red arc following; ratchet ticks"),
    A("se", fSe + 3, "the needle has swung through 9.2 and is overshooting; the number reads 9.2"),
    A("9.2", f92 + 3, "the overshoot has just peaked (micro-shake + clunk): the needle starts back toward 9.2; the number 9.2 / 10 pops"),
    A("ki", fKi + 2, "the needle has rung back and rests on 9.2"),
    A("critical", fCritical + 4, "the red CRITICAL pill springs in under the number; the needle rests on 9.2"),
    A("rating", fRating + 4, "needle at rest on 9.2, red arc, CRITICAL (held)"),
    A("21", f21 + 4, "a small green shield outline blinks in at the top-left of the gauge"),
    A("October", fOctober + 4, "the shield is written; the chip FIX: 21 OCT springs in under it"),
    A("fix", fFix + 4, "chime: the shield fills with green light and its check writes on"),
    A("aaya", fAaya + 3, "the green shield with its check and the chip FIX: 21 OCT (held)"),
    A("attack", fAttack + 3, "the first faint red arrow strikes the shield and bounces off"),
    A("koshishein", fKoshishein + 3, "the second arrow bounces off; the first is fading away"),
    A("bhi", fBhi + 3, "the third arrow, deflected"),
    A("dikhne", fDikhne + 3, "the fourth arrow, deflected: red arrows pinging at the shield from the edges"),
    A("lagi", fLagi + 5, "the gauge, the shield and the chip, calm after the arrows"),
  ],
  pushes: [{ frame: cue.hit - 6, frames: 12, extra: 0.02 }],
  shakes: [cue.hit],
};

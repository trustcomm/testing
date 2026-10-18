// Every cue in the video, as a time looked up from the aligned transcript. A scene starts on its first word; every reveal sits on
// the phrase it shows; every number changes on the word that says it. No seconds are written here.
import { audioDuration, first, w, TAIL } from "./anchors";
import { FPS, TRANSITION } from "./theme";

const FIRST_SENTENCE = [0, 4, 7, 9, 12, 17, 20, 23];
export const SCENES = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"] as const;
export const sceneStart = (i: number) => (i === 0 ? 0 : first(FIRST_SENTENCE[i]).start);
export const sceneEnd = (i: number) => (i === SCENES.length - 1 ? audioDuration + TAIL : sceneStart(i + 1));

// the test data (the creator's single run; not to be changed)
export const DATA = {
  claude: { name: "Claude Opus 5.5", seconds: 1 * 3600 + 53 * 60, cents: 2346 },
  gemini: { name: "Gemini 4 Argon", seconds: 4 * 60 + 20, cents: 340 },
  credit: "Test: @EnvolDev on X · single run",
};
export const SPEED_X = Math.round(DATA.claude.seconds / DATA.gemini.seconds);            // 26
export const COST_X = DATA.claude.cents / DATA.gemini.cents;                             // 6.9 -> "~7×"

const snap = w(3, "chaar").start;                                   // "sirf chaar minute": the Gemini bar snaps to 100 %
const land = w(3, "minute").end + 0.1;                              // Claude's stopwatch lands just after, in the pause before "Kharcha"

export const CUE = {
  s1: {
    prompt: w(0, "ek").start, promptOut: w(1, "claude").start,
    tracks: w(1, "claude").start,                                  // "Claude ko laga": the two tracks appear
    fill: [w(1, "laga").end, snap] as const,                       // both start filling when "laga" is said
    snap, land,
    gemini: w(2, "gemini").start,
  },
  s2: {
    morph: w(4, "kharcha").start,                                  // the bars morph into receipts
    claude: [w(5, "claude").start, w(5, "dollar").end] as const,   // $23.46 rolls on "Claude, teis dollar"
    gemini: [w(6, "gemini").start, w(6, "dollar").end] as const,   // $3.40 rolls on "Gemini, sirf saadhe teen dollar"
  },
  s3: {
    apart: w(7, "matlab").start,                                   // the receipts slide apart
    x26: [w(7, "chhabbees").start, w(7, "guna").end] as const, tez: w(7, "tez").start,
    shift: w(8, "aur").start, x7: [w(8, "saat").start, w(8, "guna").end] as const, sasta: w(8, "sasta").start,
  },
  s4: {
    dim: w(9, "lekin").start, kicker: w(9, "twist").start,
    detail: w(11, "detail").start, me: w(11, "me").start, claude: w(11, "claude").start, aage: w(11, "aage").start,
    chips: w(11, "ab").start, creator: w(10, "creator").start,
  },
  s5: {
    card: w(12, "toh").start,
    jaldi: w(13, "jaldi").start, kam: w(13, "kam").start, gemini: w(14, "gemini").start,
    har: w(15, "har").start, claude: w(16, "claude").start,
  },
  s6: { smart: w(17, "smart").start, dono: w(17, "dono").start, gemini: w(18, "gemini").start, claude: w(19, "claude").start },
  s7: {
    nOut: w(20, "hai").start, par: w(20, "par").start, sirf: w(20, "sirf").start, ekTest: w(20, "ek").start, test: w(20, "test").start,
    apna: w(21, "apna").start, khud: w(21, "khud").start, ka: w(21, "ka").start, karo: w(21, "karo").start,
    same: w(22, "same").start, ek: w(22, "ek").start, teen: w(22, "teen").start,
    detail: w(22, "detail").start, time: w(22, "time").start, cost: w(22, "cost").start,
  },
  s8: { fair: w(23, "fair").start, test: w(23, "test").start, ka: w(23, "ka").start, poora: w(23, "poora").start, prompt23: w(23, "prompt").start, comment: w(24, "comment").start, karo: w(24, "karo").start, prompt: w(24, "prompt").start },
};
if (CUE.s1.land >= sceneStart(1) - 2 / FPS) throw new Error("Claude's stopwatch must land before 'Kharcha'");

// camera: 1.00 -> 1.04 over every scene (it settles back during the dissolve into the next)
export const cameraAt = (t: number): number => {
  let s = 0;
  for (let i = 0; i < SCENES.length; i++) if (t >= sceneStart(i)) s = i;
  const a = sceneStart(s), b = sceneEnd(s), base = 1 + 0.04 * Math.min(1, Math.max(0, (t - a) / (b - a)));
  if (s === 0) return base;
  const k = Math.min(1, (t - a) / (TRANSITION / FPS)), e = k * k * (3 - 2 * k);
  return 1.04 + (base - 1.04) * e;
};

// the canvas dims slightly for the twist (scene 4): in over 12 frames from its first word, out over 12 frames at scene 5
export const dimAt = (t: number): number => {
  const ease = (x: number) => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };
  return ease((t - sceneStart(3)) / (12 / FPS)) * (1 - ease((t - sceneStart(4)) / (12 / FPS)));
};

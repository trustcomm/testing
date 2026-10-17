// Every cue in the video, as a time looked up from the aligned transcript (anchors.ts). A scene starts on its first word,
// every reveal sits on the word it illustrates, every number changes on the word that says it. No seconds are written here.
import { audioDuration, first, w } from "./anchors";
import { FPS, TRANSITION } from "./theme";

// scene -> its first sentence (sentences are numbered in timings.json)
const FIRST_SENTENCE = [0, 2, 5, 10, 12, 16, 19];
export const SCENES = ["S1", "S2", "S3", "S4", "S5", "S6", "S7"] as const;
export const sceneStart = (i: number) => (i === 0 ? 0 : first(FIRST_SENTENCE[i]).start);
export const sceneEnd = (i: number) => (i === SCENES.length - 1 ? audioDuration : sceneStart(i + 1));

const spread = (a: number, b: number, n: number) => Array.from({ length: n }, (_, k) => a + (k * (b - a)) / n);   // n times in [a, b), the first on a

export const CUE = {
  s1: {
    motion: w(0, "motion").start, designer: w(0, "designer").start, ek: w(0, "ek").start, project: w(0, "project").start,
    invoice: w(1, "pachaas").start,                                                   // the invoice rises
    total: [w(1, "pachaas").start, w(1, "hazaar").end] as const,                      // 0 -> 50,000 while "pachaas hazaar" is said
    swoosh: w(1, "rupaye").start, upTo: w(1, "tak").start,
  },
  s2: {
    slide: w(2, "claude").start,                                                      // invoice slides left and shrinks, the card rises
    pro: w(2, "pro").start,
    price: [w(3, "do").start, w(3, "hazaar").end] as const,                           // 0 -> 2,000 while "do hazaar" is said
    perMonth: w(3, "rupaye").start, included: w(3, "rupaye").start,
    ring: [w(4, "poore").start, w(4, "ke").end] as const,                             // the ring completes one circle over "poore mahine ke"
  },
  s3: {
    calculator: w(5, "calculator").start,                                             // both cards blur out, the calculator springs in
    result: w(7, "pacchees").start,                                                   // the display morphs to 25
    grid: w(8, "pacchees").start,                                                     // the calculator becomes 25 calendar tiles
    saal: [w(9, "do").start, w(9, "saal").start, w(9, "zyada").start] as const,       // "2+ saal"
  },
  s4: { aur: w(10, "aur").start, one: w(11, "one").start, thing: w(11, "thing").end },
  s5: {
    yeh: w(12, "yeh").start, kisi: w(13, "kisi").start, designer: w(13, "designer").start, nahi: w(13, "nahi").start,
    typing: [w(12, "yeh").start + 0.25, w(13, "kisi").start] as const,
    render: [w(14, "claude").start, w(14, "banaya").end] as const, done: w(14, "banaya").end,
    sirf: w(15, "sirf").start, pullBack: w(15, "ek").start, prompt: w(15, "prompt").start,
  },
  s6: {
    designers: w(16, "designers").start, khatam: w(16, "khatam").start, nahi: w(16, "nahi").start, honge: w(16, "honge").start,
    jo: w(17, "jo").start, ai: w(17, "ai").start, nahiSeekh: w(17, "nahi").start, seekhenge: w(17, "seekhenge").start,
    woh: w(18, "woh").start, zaroor: w(18, "zaroor").start, ho: w(18, "ho").start, jayenge: w(18, "jayenge").start,
  },
  s7: { prompt: w(19, "prompt").start, comment: w(20, "comment").start, karo: w(20, "karo").start, motion: w(20, "motion").start, motionEnd: w(20, "motion").end },
};

// The calculator's key presses. Each digit run starts on the word that says the number and is spread over it; "÷" lands on
// "divided"; "=" lands in the pause after "hazaar", before "pacchees" says the answer.
export const KEYS: { key: string; t: number }[] = [
  ...spread(w(6, "pachaas").start, w(6, "hazaar", 0).end - 0.1, 5).map((t, k) => ({ key: "50000"[k], t })),
  { key: "÷", t: w(6, "divided").start },
  ...spread(w(6, "do").start, w(6, "hazaar", 1).end - 0.1, 4).map((t, k) => ({ key: "2000"[k], t })),
  { key: "=", t: w(6, "hazaar", 1).end + 0.12 },
];
if (KEYS.at(-1)!.t >= CUE.s3.result) throw new Error("the = press must land in the pause before 'pacchees'");

// camera: 1.00 -> 1.04 over every scene; at a scene boundary it settles back during the dissolve
export const cameraAt = (t: number): number => {
  let s = 0;
  for (let i = 0; i < SCENES.length; i++) if (t >= sceneStart(i)) s = i;
  const a = sceneStart(s), b = sceneEnd(s), base = 1 + 0.04 * Math.min(1, Math.max(0, (t - a) / (b - a)));
  if (s === 0) return base;
  const k = Math.min(1, (t - a) / (TRANSITION / FPS)), e = k * k * (3 - 2 * k);
  return 1.04 + (base - 1.04) * e;
};

// the black of scene 4: eases to #000 over 18 frames from the first word of S4, back to the canvas from the first word of S6
export const DARK_FRAMES = 18;
export const darkAt = (t: number): number => {
  const ease = (x: number) => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };
  const up = ease((t - sceneStart(3)) / (DARK_FRAMES / FPS)), down = ease((t - sceneStart(5)) / (DARK_FRAMES / FPS));
  return up * (1 - down);
};

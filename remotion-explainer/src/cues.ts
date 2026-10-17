// Every cue in the video, as a time looked up from the transcript. A scene starts on its first word; every pop-in sits on
// the word it illustrates. Nothing here is a number of seconds.
import { audioDuration, first, last, w } from "./timing";
import { FPS, WIPE_FRAMES, WIPE_LEAD } from "./theme";

export const WIPE = WIPE_FRAMES / FPS;   // seconds a wipe takes; it is centred on the incoming scene's first word

export const CUE = {
  hook: {
    counter: [w(0, "9848").start, w(0, "9848").end] as const,    // 0 -> 9,848 while "9848" is said
    viewsLabel: w(0, "views").start,
    snap: w(0, "sirf").start,                                      // the big number snaps small
    visits: w(0, "44").start,                                      // "44" + the screen shake
    visitsLabel: w(0, "profile").start,
    question: w(1, "kahan").start,
    illustrates: last(1).end,
  },
  problem: {
    pill: first(2).start, phone: first(2).start,
    views: w(2, "dekhte").start, neq: w(2, "scroll").start, followers: w(3, "follow").start,
    stream: [w(2, "scroll").start, w(2, "nikal").start] as const,   // avatars scroll past ...
    leave: [w(2, "nikal").start, last(2).end] as const,             // ... and drift out of frame
    who: w(3, "kaun").start, why: w(3, "kyun").start,
    illustrates: last(3).end,
  },
  fix1: {
    pill: first(4).start, headline: w(4, "number").start, timeline: w(4, "ek").start,
    playhead: [w(4, "pehle").start, w(4, "second").end] as const,   // the first 3 seconds glow
    card: w(4, "kiske").start, hl: w(4, "kiske").start,
    illustrates: last(4).end,
  },
  fix2: {
    pill: first(5).start, headline: w(5, "number").start, phone: w(5, "do").start,
    typing: [w(5, "mein").start, w(5, "line").end] as const,        // the bio types out
    hl: w(5, "promise").start, tick: w(5, "ka").start,
    illustrates: last(5).end,
  },
  fix3: {
    pill: first(6).start, headline: w(6, "number").start, buttons: w(6, "teen").start,
    fade: w(6, "sirf").start,                                       // the competing buttons shrink away
    follow: w(6, "follow").start, hl: w(6, "sirf").start,
    illustrates: last(6).end,
  },
  reveal: {
    phone: first(7).start, flip: w(7, "nahi").start,                // the phone turns into a terminal
    madeBy: w(7, "banaya", 0).start, claude: w(7, "claude").start, code: w(7, "code").start,
    typing: [w(7, "claude").start, w(7, "banaya", 1).start] as const,
    lines: w(7, "banaya", 1).start,
    progress: [w(7, "sirf").start, w(7, "prompt").end] as const,    // 0 -> 100 % over "sirf ek prompt"
    done: w(7, "prompt").end,
    illustrates: last(7).end,
  },
  cta: {
    pill: first(8).start, pulse: w(9, "motion").start, comment: w(9, "comment").start, handle: w(9, "follow").start,
    illustrates: audioDuration,
  },
};

// Where each scene starts (its first word; the first scene at 0) and where it ends (the next scene's first word; the last, the audio's end).
const FIRST_SENTENCE = [0, 2, 4, 5, 6, 7, 8];
export const SCENE_IDS = ["hook", "problem", "fix1", "fix2", "fix3", "reveal", "cta"] as const;
export const sceneStart = (i: number) => (i === 0 ? 0 : first(FIRST_SENTENCE[i]).start);
export const sceneEnd = (i: number) => (i === SCENE_IDS.length - 1 ? audioDuration : sceneStart(i + 1));
// the sound effects' times: a whoosh at every wipe, a tick on every counter step
export const whooshTimes = SCENE_IDS.slice(1).map((_, i) => sceneStart(i + 1) - WIPE_LEAD / FPS);
const stepsOf = ([a, b]: readonly [number, number], every: number) => Array.from({ length: Math.floor((b - a) / every) + 1 }, (_, k) => a + k * every);
export const tickTimes = [...stepsOf(CUE.hook.counter, 0.075), ...stepsOf(CUE.reveal.progress, 0.09)];

// Time comes from words, never from numbers. src/timings.json is the aligned transcript (scripts/align.py + scripts/timings.py: voice time in seconds).
// The video starts with LEAD seconds of silence (the brief: "pure black, 0.4 s of silence") and ends TAIL seconds after the voice:
// duration = vo + LEAD + TAIL = vo + 0.8 s. Everything below is in COMPOSITION time (voice time + LEAD).
import data from "./timings.json";
import { FPS } from "./theme";

export const LEAD = 0.4, TAIL = 0.4;
export type SceneId = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8" | "S9" | "S10" | "S11" | "S12" | "S13";
export type Word = { i: number; text: string; bare: string; scene: SceneId; phrase: number; sentence: number; tokens: string[]; start: number; end: number; voiceStart: number; voiceEnd: number; alignStart: number; alignEnd: number };
export const words: Word[] = (data.words as unknown as Word[]).map((x) => ({ ...x, voiceStart: x.start, voiceEnd: x.end, start: x.start + LEAD, end: x.end + LEAD }));
export const audioDuration: number = data.audioDuration;
export const phrases: Word[][] = Array.from({ length: Math.max(...words.map((x) => x.phrase)) + 1 }, (_, k) => words.filter((x) => x.phrase === k));

/** the n-th (default first) word whose bare spelling (lower case, letters/digits/dot) is `bare` inside scene `scene` ("S3") */
export function w(scene: SceneId, bare: string, nth = 0): Word {
  const hit = words.filter((x) => x.scene === scene && x.bare === bare)[nth];
  if (!hit) throw new Error(`no word "${bare}" #${nth} in ${scene}: ${words.filter((x) => x.scene === scene).map((x) => x.bare).join(" ")}`);
  return hit;
}
/** same, inside phrase number `phrase` (0..43; see scripts/script.py) */
export function wp(phrase: number, bare: string, nth = 0): Word {
  const hit = phrases[phrase].filter((x) => x.bare === bare)[nth];
  if (!hit) throw new Error(`no word "${bare}" #${nth} in phrase ${phrase}: ${phrases[phrase].map((x) => x.bare).join(" ")}`);
  return hit;
}
export const sceneWords = (scene: SceneId) => words.filter((x) => x.scene === scene);
export const frameOf = (seconds: number) => Math.round(seconds * FPS);
/** frame on which a word starts (the hit of every cue lands here) */
export const fw = (x: Word) => frameOf(x.start);
export const fwEnd = (x: Word) => frameOf(x.end);
/** the length of the video: vo.mp3 (ffprobe) + 0.8 s, rounded up to a whole frame */
export const totalFrames = () => Math.ceil((audioDuration + LEAD + TAIL) * FPS - 1e-6);

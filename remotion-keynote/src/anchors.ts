// Time comes from words, never from numbers. timings.json is the aligned transcript (scripts/align.py + scripts/timings.py);
// w(sentence, "word") finds a word by its bare lower-case spelling. Everything in cues.ts is built from these.
import data from "./timings.json";
import { FPS } from "./theme";

export type Word = { i: number; text: string; bare: string; scene: string; sentence: number; start: number; end: number; alignStart: number; alignEnd: number };
export const words: Word[] = data.words as Word[];
export const audioDuration: number = data.audioDuration;
export const sentences: Word[][] = Array.from({ length: Math.max(...words.map((x) => x.sentence)) + 1 }, (_, k) => words.filter((x) => x.sentence === k));
export const first = (sentence: number) => sentences[sentence][0];
export const last = (sentence: number) => sentences[sentence].at(-1)!;

export function w(sentence: number, bare: string, nth = 0): Word {
  const hit = sentences[sentence].filter((x) => x.bare === bare)[nth];
  if (!hit) throw new Error(`no word "${bare}" #${nth} in sentence ${sentence}: ${sentences[sentence].map((x) => x.text).join(" ")}`);
  return hit;
}
export const frameOf = (seconds: number) => Math.round(seconds * FPS);
export const totalFrames = (seconds = audioDuration) => Math.ceil(seconds * FPS - 1e-6);

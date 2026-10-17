// The transcript, and the only way the rest of the code reads time: by word. words.json comes from
// scripts/build-timing.ts (ElevenLabs Scribe's word timestamps + the Roman Hinglish spelling).
import data from "./data/words.json";
import { FPS } from "./theme";

export type Word = { i: number; text: string; bare: string; start: number; end: number; sentence: number };
export const words: Word[] = data.words;
export const audioDuration: number = data.audioDuration;
export const sentences = Array.from({ length: Math.max(...words.map((w) => w.sentence)) + 1 }, (_, k) => words.filter((w) => w.sentence === k));
export const first = (sentence: number): Word => sentences[sentence][0];
export const last = (sentence: number): Word => sentences[sentence].at(-1)!;

/** The nth (default first) occurrence of a word in a sentence, by its lower-case Roman spelling without punctuation. */
export function w(sentence: number, bare: string, nth = 0): Word {
  const hit = sentences[sentence].filter((x) => x.bare === bare)[nth];
  if (!hit) throw new Error(`no word "${bare}" #${nth} in sentence ${sentence}: ${sentences[sentence].map((x) => x.text).join(" ")}`);
  return hit;
}
export const frameOf = (seconds: number) => Math.round(seconds * FPS);
export const durationInFrames = (seconds = audioDuration) => Math.ceil(seconds * FPS - 1e-6);

// words.raw.json (ElevenLabs Scribe, word-level timestamps) -> src/data/words.json: every word with its Roman Hinglish
// spelling, its start/end in seconds (Scribe's, untouched) and the sentence it belongs to. Every scene boundary and
// every pop-in in the video is looked up from this file; no second is hardcoded anywhere else.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const raw = JSON.parse(readFileSync("src/data/words.raw.json", "utf8")).words as { text: string; start: number; end: number }[];
const dict = JSON.parse(readFileSync("src/data/hinglish.json", "utf8")) as Record<string, string>;
const DEV = /[ऀ-ॿ]/;

let newSentence = true;
const words = raw.map((w, i) => {
  const trail = (w.text.match(/[,?.!।]+$/) ?? [""])[0];
  const core = w.text.slice(0, w.text.length - trail.length).replace(/^["']|["']$/g, "");
  let roman = core;
  if (DEV.test(core)) {
    const r = dict[core];
    if (!r) throw new Error(`word ${i} "${w.text}" is Devanagari and not in hinglish.json`);
    roman = r;
  }
  if (newSentence) roman = roman[0].toUpperCase() + roman.slice(1);
  const quoted = /^"/.test(w.text) ? `"${roman}"` : roman;
  const punct = trail.replace("।", ".");
  const text = quoted + punct;
  const sentenceStart = newSentence;
  newSentence = /[.?!]$/.test(punct);
  return { i, text, bare: roman.toLowerCase(), start: w.start, end: w.end, sentenceStart };
});
let s = -1;
const out = words.map((w) => ({ ...w, sentence: (s += w.sentenceStart ? 1 : 0) })).map(({ sentenceStart, ...w }) => w);

// Scribe's word edges are good to ~50 ms except where a word it hears as one is several syllables (a number: "nau hazaar aath
// sau adtalis" is "9848") or sits against a silence. So each edge is checked against the speech level of the actual mp3 (16 kHz,
// 10 ms steps): where loud speech (> -35 dB) runs into the gap beside a word, the edge moves out to the speech, never past the
// neighbouring word. scribeStart / scribeEnd keep what Scribe said; nothing else is touched.
const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", "public/vo.mp3", "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], { maxBuffer: 1 << 28 });
const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 2));
const db: number[] = [];
for (let i = 0; i + 160 <= samples.length; i += 160) { let e = 0; for (let k = 0; k < 160; k++) e += (samples[i + k] / 32768) ** 2; db.push(10 * Math.log10(e / 160 + 1e-12)); }
const LOUD = -35, loud = (f: number) => f >= 0 && f < db.length && db[f] > LOUD;
const refined = out.map((w, k, all) => {
  const prevEnd = k ? all[k - 1].end : 0, nextStart = k + 1 < all.length ? all[k + 1].start : db.length / 100;
  let start = w.start, end = w.end;
  if (w.start - prevEnd > 0.12 && loud(Math.round(w.start * 100) + 2)) {          // speech running up to the word's start
    let f = Math.round(w.start * 100); while (loud(f - 1)) f--;
    if (w.start - f / 100 >= 0.08) start = Math.max(f / 100, prevEnd);
  }
  if (nextStart - w.end > 0.12) {                                                  // speech just after the word's end
    let f = Math.round(w.end * 100); const lim = f + 15;
    while (f < lim && !loud(f)) f++;
    if (loud(f) && f < lim) { while (loud(f + 1)) f++; if (f / 100 > w.end + 0.05) end = Math.min(f / 100, nextStart - 0.02); }
  }
  return { ...w, start: +start.toFixed(3), end: +end.toFixed(3), scribeStart: w.start, scribeEnd: w.end };
});
for (const w of refined) if (w.start !== w.scribeStart || w.end !== w.scribeEnd) console.log(`refined "${w.text}": ${w.scribeStart}-${w.scribeEnd} -> ${w.start}-${w.end}`);

const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", "public/vo.mp3"]).toString().trim());
writeFileSync("src/data/words.json", JSON.stringify({ audioDuration: dur, words: refined }, null, 1));
console.log(`${out.length} words, ${s + 1} sentences, audio ${dur.toFixed(3)} s`);

/**
 * Word-timestamp sync. A visual appears on the frame the narrator says its word
 * (temporal contiguity).
 *
 * Accepted `public/vo-timestamps.json` shapes:
 *   1. [{ "word": "BYJU'S", "start": 1.52, "end": 1.98 }, ...]       (also "text" instead of "word")
 *   2. { "words": [{ "text": "...", "start": 1.52, "end": 1.98 }] }   (ElevenLabs Scribe / Whisper style)
 *   3. { "alignment": { "characters": [...], "character_start_times_seconds": [...],
 *        "character_end_times_seconds": [...] } }                       (ElevenLabs TTS "with-timestamps")
 */

export type Word = { text: string; start: number; end: number };

type CharAlignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

export const parseTimestamps = (json: unknown): Word[] => {
  const asWord = (w: Record<string, unknown>): Word => ({
    text: String(w.word ?? w.text ?? ""),
    start: Number(w.start ?? w.start_time ?? 0),
    end: Number(w.end ?? w.end_time ?? 0),
  });
  if (Array.isArray(json)) return json.map((w) => asWord(w as Record<string, unknown>)).filter((w) => w.text.trim());
  const obj = (json ?? {}) as Record<string, unknown>;
  if (Array.isArray(obj.words)) {
    return (obj.words as Record<string, unknown>[])
      .filter((w) => (w.type ?? "word") === "word")
      .map(asWord)
      .filter((w) => w.text.trim());
  }
  const al = (obj.alignment ?? obj.normalized_alignment) as CharAlignment | undefined;
  if (al && Array.isArray(al.characters)) {
    const words: Word[] = [];
    let cur: Word | null = null;
    al.characters.forEach((ch, i) => {
      if (/\s/.test(ch)) {
        if (cur) words.push(cur);
        cur = null;
        return;
      }
      const s = al.character_start_times_seconds[i];
      const e = al.character_end_times_seconds[i];
      if (!cur) cur = { text: ch, start: s, end: e };
      else {
        cur.text += ch;
        cur.end = e;
      }
    });
    if (cur) words.push(cur);
    return words;
  }
  return [];
};

const norm = (s: string) => s.toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}.$]/gu, "");

/**
 * A cue: the first word matching `match` (after `after`, in seconds) — or `fallback` frame
 * when there are no timestamps or the word isn't found. `offset` shifts the result in frames
 * (e.g. -24 so a 24-frame counter LANDS on the word).
 */
export type CueSpec = { match: RegExp; fallback: number; offset?: number };

export const resolveCues = <K extends string>(
  specs: Record<K, CueSpec>,
  words: Word[] | null,
  fps: number,
): Record<K, number> => {
  const out = {} as Record<K, number>;
  let cursor = 0; // seconds — cues are resolved in declaration order (narration order)
  (Object.keys(specs) as K[]).forEach((key) => {
    const spec = specs[key];
    let frame = spec.fallback;
    if (words && words.length) {
      const hit = words.find((w) => w.start >= cursor && spec.match.test(norm(w.text)));
      if (hit) {
        frame = Math.round(hit.start * fps) + (spec.offset ?? 0);
        cursor = hit.start;
      }
    }
    out[key] = Math.max(0, frame);
  });
  return out;
};

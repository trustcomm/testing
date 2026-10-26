// Typed access to a reel's generated timeline.json (seconds → frames).
import {VIDEO} from './tokens';

export type Word = {w: string; start: number; end: number};
export type Segment = {id: string; text: string; start: number; end: number; words: Word[]};
export type Cue = {t: number; seg: string; sfx: string[]; pan: number; gain: number};
export type TimelineJSON = {
  reel: string;
  source: 'estimated' | 'aligned';
  duration: number;
  segments: Segment[];
  cues: Record<string, Cue>;
};

export const makeTL = (tj: TimelineJSON, fps: number = VIDEO.fps) => {
  const sec = (s: number) => Math.round(s * fps);
  const seg = (id: string) => {
    const s = tj.segments.find((x) => x.id === id);
    if (!s) throw new Error(`segment ${id} missing`);
    return {from: sec(s.start), to: sec(s.end), dur: sec(s.end) - sec(s.start), seg: s};
  };
  /** Frame of a cue. Throws on typos so mistakes show up in Studio immediately. */
  const f = (id: string) => {
    const c = tj.cues[id];
    if (!c) throw new Error(`cue "${id}" missing from cues.json`);
    return sec(c.t);
  };
  const words = tj.segments.flatMap((s) => s.words.map((w) => ({...w, seg: s.id, from: sec(w.start), to: sec(w.end)})));
  return {fps, sec, seg, f, words, durationInFrames: sec(tj.duration), source: tj.source, raw: tj};
};

export type TL = ReturnType<typeof makeTL>;

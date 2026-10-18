// The mix. Voice at full level. The music bed (public/music.mp3, mastered near -14 LUFS) sits ~17 dB under the voice's loudness
// and swells +6 dB in the pauses between sentences, so it ducks under every phrase. Sound effects are synthesised
// (scripts/make_sfx.py), each keyed to a cue in cues.ts, their peak set 18 dB under the voice's peak.
import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { CUE, sceneStart } from "./cues";
import { FPS } from "./theme";
import { audioDuration, frameOf, TAIL, words, totalFrames } from "./anchors";

export const VOICE_PEAK_DB = -8.2, VOICE_LUFS = -27.3, SFX_PEAK_DB = -1, UNDER_VOICE_DB = 18;
const db = (x: number) => 10 ** (x / 20);
export const SFX_VOLUME = db(VOICE_PEAK_DB - UNDER_VOICE_DB - SFX_PEAK_DB);
export const MUSIC_UNDER_DB = 17, MUSIC_FILE_LUFS = -14, SWELL_DB = 6;
const MUSIC_BASE = db(VOICE_LUFS - MUSIC_UNDER_DB - MUSIC_FILE_LUFS);

// the music's gain at time t: ducked under speech, swelling into every pause >= 0.35 s, in over 0.8 s, out over the last 1.5 s
const gaps: [number, number][] = words.slice(0, -1).map((a, i) => [a.end, words[i + 1].start] as [number, number]).filter(([a, b]) => b - a >= 0.35);
const ease = (x: number) => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };
export const musicGain = (t: number): number => {
  let swell = 0;
  for (const [a, b] of gaps) swell = Math.max(swell, ease((t - a - 0.04) / 0.2) * (1 - ease((t - (b - 0.2)) / 0.2)));
  const end = words[words.length - 1].end;
  swell = Math.max(swell, ease((t - end - 0.05) / 0.6));                      // after the last word the bed comes up and rides out
  const total = audioDuration + TAIL;
  return MUSIC_BASE * db(SWELL_DB * swell) * ease(t / 0.8) * (1 - ease((t - (total - 1.5)) / 1.5));
};

// a decelerating ratchet of n ticks across [a, b], like a mechanical counter coming to rest
const ratchet = (a: number, b: number) => { const n = Math.max(3, Math.round((b - a) / 0.05)); return Array.from({ length: n }, (_, k) => a + (b - a) * (1 - (1 - k / n) ** 1.6)); };
const even = (a: number, b: number, hz: number) => Array.from({ length: Math.max(1, Math.floor((b - a) * hz)) }, (_, k) => a + k / hz);

const c1 = CUE.s1, c2 = CUE.s2, c3 = CUE.s3, c4 = CUE.s4, c5 = CUE.s5, c6 = CUE.s6, c7 = CUE.s7, c8 = CUE.s8;
type Fx = { t: number; file: string; vol: number; frames: number };
const fx = (file: string, vol: number, frames: number, times: number[]): Fx[] => times.map((t) => ({ t, file, vol, frames }));
export const EFFECTS: Fx[] = [
  // S1: prompt card, the tracks, Claude's stopwatch ratchet (slow, then fast after Gemini's snap), Gemini's ding and Claude's landing
  ...fx("pop", 0.8, 6, [c1.prompt, c1.tracks]),
  ...fx("tick", 0.45, 3, [...even(c1.fill[0], c1.snap, 9), ...even(c1.snap, c1.land, 26)]),
  ...fx("ding", 0.9, 28, [c1.snap]), ...fx("ding", 0.55, 28, [c1.land]),
  // S2: the morph and the two counters
  ...fx("whoosh", 0.8, 21, [c2.morph]),
  ...fx("tick", 0.7, 3, [...ratchet(...c2.claude), ...ratchet(...c2.gemini)]),
  // S3: slide apart; 26× and ~7× roll and land
  ...fx("whoosh", 0.8, 21, [c3.apart]),
  ...fx("tick", 0.7, 3, [...ratchet(...c3.x26), ...ratchet(...c3.x7)]),
  ...fx("thud", 1.0, 14, [c3.x26[1], c3.x7[1]]),
  // S4: the dim, the verdict's last word, the three chips
  ...fx("whoosh", 0.55, 21, [sceneStart(3)]),
  ...fx("thud", 0.8, 14, [c4.aage]),
  ...fx("pop", 0.8, 6, [0, 6, 12].map((f) => c4.chips + f / FPS)),
  // S5-S6: the decision card, its items on their words, the morph into one flow
  ...fx("whoosh", 0.8, 21, [sceneStart(4), c6.smart]),
  ...fx("pop", 0.8, 6, [c5.jaldi, c5.kam, c5.har]),
  ...fx("ding", 0.5, 28, [c6.gemini, c6.claude]),
  // S7: n = 1, the three constraints, the three score cards
  ...fx("whoosh", 0.8, 21, [sceneStart(6)]),
  ...fx("pop", 0.8, 6, [c7.ekTest, c7.same, c7.ek, c7.teen, c7.detail, c7.time, c7.cost]),
  // S8: the call to action
  ...fx("whoosh", 0.8, 21, [sceneStart(7)]),
  ...fx("ding", 1.0, 28, [c8.prompt]),
].sort((a, b) => a.t - b.t);

export const Mix: React.FC = () => (
  <>
    <Audio src={staticFile("vo.mp3")} />
    <Audio src={staticFile("music.mp3")} volume={(f) => musicGain(f / FPS)} />
    {EFFECTS.map((e, i) => <Sequence key={i} from={frameOf(e.t)} durationInFrames={e.frames}><Audio src={staticFile(`sfx/${e.file}.wav`)} volume={SFX_VOLUME * e.vol} /></Sequence>)}
  </>
);
void totalFrames;
